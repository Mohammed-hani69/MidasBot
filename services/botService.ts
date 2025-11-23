import { BotAccount, Product, Transaction } from '../types';
import { storageService } from './storageService';
import { analyzeRedemptionResult } from './geminiService';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const botService = {
  updateAccountStatus: (id: string, status: 'online' | 'busy' | 'offline') => {
    const currentAccounts = storageService.getAccounts();
    const idx = currentAccounts.findIndex(a => a.id === id);
    if (idx !== -1) {
        currentAccounts[idx].runtimeStatus = status;
        storageService.saveAccounts(currentAccounts);
    }
  },

  // Simulate the browser actions and return logs + final web text
  executeMidasbuyStep: async (account: BotAccount, pid: string, code: string, onLog: (msg: string) => void): Promise<string> => {
      onLog(`> [Bot:${account.email}] Initializing Sequence...`);
      
      // 1. Open Site
      onLog(`> [Nav] Target: https://www.midasbuy.com/midasbuy/eg/redeem/pubgm`);
      try {
          // Attempt to open window to simulate "Real" browser action
          const win = window.open("https://www.midasbuy.com/midasbuy/eg/redeem/pubgm", "_blank", "width=1024,height=768");
          if(win) {
              onLog(`> [System] Browser Window Opened (PID: ${Math.floor(Math.random() * 9000) + 1000})`);
              setTimeout(() => win.close(), 15000); // Auto close after simulation
          } else {
              onLog(`> [Info] Headless Mode (Window hidden/blocked)`);
          }
      } catch(e) {
          onLog(`> [Info] Running in Headless Daemon Mode`);
      }
      
      await delay(2000);

      // --- LOGIN PHASE ---
      // 2. Click Login Button
      onLog(`> [DOM] Searching for element: .Button_btn_primary__1ncdM`);
      onLog(`> [Action] Clicked 'Login'`);
      await delay(1500);

      // 3. Click Other Methods
      onLog(`> [DOM] Searching for element: .to-other-login`);
      onLog(`> [Action] Clicked 'Other Methods'`);
      await delay(1500);

      // 4. Input Email
      onLog(`> [DOM] Finding input[type="email"]`);
      onLog(`> [Action] Typed email: ${account.email}`);
      await delay(1000);

      // 5. Click Continue
      onLog(`> [DOM] Clicked .btn.comfirm-btn (Step 1)`);
      await delay(1500);

      // 6. Input Password
      onLog(`> [DOM] Finding input[type="password"]`);
      onLog(`> [Action] Typed password: ************`);
      await delay(1000);

      // 7. Click Login Final
      onLog(`> [DOM] Clicked .btn.comfirm-btn (Step 2 - Login)`);
      onLog(`> [Bot] Status: LOGGED_IN (Active Session)`);
      await delay(2000);

      // --- REDEMPTION PHASE ---
      
      // 8. Click Switch Icon
      onLog(`> [DOM] Clicked <i class="i-midas:switch icon"></i>`);
      await delay(1000);

      // 9. Clear Input if needed
      onLog(`> [DOM] Checking .SelectServerBox_input_wrap_box__qq+Iq for error icon...`);
      // Simulating a check - sometimes it exists, sometimes not
      if (Math.random() > 0.5) {
        onLog(`> [Action] Found <i class="i-midas:error-filled icon"></i>. Clicked to clear.`);
        await delay(500);
      }

      // 10. Enter Player ID
      if (pid === "00000") return "Error: Invalid Player ID provided.";
      onLog(`> [DOM] Targeted input in .SelectServerBox_input_wrap_box__qq+Iq`);
      onLog(`> [Action] Typed Player ID: ${pid}`);
      await delay(1000);

      // 11. Click First OK
      onLog(`> [DOM] Clicked .Button_btn_primary__1ncdM (Player Verification)`);
      await delay(1500);

      // 12. Enter Redeem Code
      onLog(`> [DOM] Targeted input[placeholder="يرجى إدخال رمز استرداد"]`);
      onLog(`> [Action] Typed Code: ${code}`);
      await delay(1000);

      // 13. Click Final OK
      onLog(`> [DOM] Clicked Final OK .Button_btn_wrap__utZqk .Button_btn__P0ibl.Button_btn_primary__1ncdM`);
      onLog(`> [Midasbuy] Processing request...`);
      await delay(2000);

      // --- SIMULATED RESPONSES FOR TESTING ---
      // If code contains keywords, we simulate specific Midasbuy HTML responses
      
      if (code.includes("INVALID") || code.includes("EXP")) {
          onLog(`> [Website] Returned Error Dialog`);
          return `
            <div class="Dialog_dialog_content__2u04P">
              <div> خطأ في تنسيق الرمز، يرجى المحاولة مجددًا.</div>
            </div>
          `;
      }
      
      if (code.includes("REGION")) {
          onLog(`> [Website] Returned Error Dialog`);
          return `
            <div class="Dialog_dialog_content__2u04P">
               <div>This redemption code is not applicable for your region.</div>
            </div>
          `;
      }

      if (code.includes("USED")) {
          onLog(`> [Website] Returned Error Dialog`);
          return `
            <div class="Dialog_dialog_content__2u04P">
               <div>This code has already been redeemed.</div>
            </div>
          `;
      }

      // Success Case
      return `
        Transaction Result:
        -------------------
        Status: SUCCESS
        Message: The items have been sent to account ${pid}.
        Item Code: ${code.substring(0, 8)}...
        Ref: ${Date.now()}
      `;
  },

  processTransaction: async (transaction: Transaction, bot: BotAccount): Promise<void> => {
      // 1. Setup
      const logs: string[] = [];
      const addLog = (msg: string) => {
          logs.push(msg);
          // Update transaction logs in real-time
          const currentT = storageService.getTransactions().find(t => t.id === transaction.id);
          if (currentT) {
              currentT.log = logs;
              storageService.saveTransaction(currentT);
          }
      };

      botService.updateAccountStatus(bot.id, 'busy');
      
      try {
          addLog(`> [Queue] Assigned to Bot: ${bot.email}`);
          addLog(`> [System] Starting redemption for Order #${transaction.id.slice(0,6)}`);
          
          const codeToUse = transaction.redeemCode;
          if (!codeToUse) {
              throw new Error("No redeem code found in transaction record.");
          }

          // 2. Execute
          const webResultText = await botService.executeMidasbuyStep(bot, transaction.playerId, codeToUse, addLog);

          // 3. Analyze
          addLog("> [System] Analyzing website response via Gemini Pro...");
          const analysis = await analyzeRedemptionResult(webResultText, transaction.playerId, transaction.productName);

          // 4. Finalize
          const user = storageService.getUser();
          const allProducts = storageService.getProducts();
          const productIndex = allProducts.findIndex(p => p.id === transaction.productId);

          if (analysis.success) {
              addLog(`> [Success] ${analysis.userNotification}`);
              
              // Deduct Balance
              const newBalance = user.balance - transaction.amount;
              const updatedUser = { ...user, balance: newBalance };
              storageService.saveUser(updatedUser);

              // Remove code from inventory
              if (productIndex >= 0) {
                  const updatedCodes = allProducts[productIndex].redeemCodes.filter(c => c !== codeToUse);
                  allProducts[productIndex] = { ...allProducts[productIndex], redeemCodes: updatedCodes };
                  storageService.saveProducts(allProducts);
              }

              // Update Transaction
              const completedTransaction: Transaction = {
                  ...transaction,
                  status: 'success',
                  log: logs,
                  aiAnalysis: analysis.userNotification,
                  botId: bot.id
              };
              storageService.saveTransaction(completedTransaction);

          } else {
              addLog(`> [Failed] ${analysis.userNotification}`);
              addLog(`> [Inventory] Code preserved. Funds released.`);

              const failedTransaction: Transaction = {
                  ...transaction,
                  status: 'failed',
                  log: logs,
                  aiAnalysis: analysis.userNotification,
                  botId: bot.id
              };
              storageService.saveTransaction(failedTransaction);
          }

      } catch (error: any) {
          addLog(`> [Critical Error] ${error.message}`);
          const failedTransaction: Transaction = {
              ...transaction,
              status: 'failed',
              log: logs,
              aiAnalysis: "System Error during execution",
              botId: bot.id
          };
          storageService.saveTransaction(failedTransaction);
      } finally {
          botService.updateAccountStatus(bot.id, 'online');
      }
  }
};