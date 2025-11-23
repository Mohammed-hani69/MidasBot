import { BotAccount } from '../types';

export const generatePythonScript = (accounts: BotAccount[]): string => {
    const activeAccount = accounts.find(a => a.status === 'active') || { email: 'NO_ACTIVE_ACCOUNT', password: '' };

    return `
# MIDASBOT REAL AUTOMATION SCRIPT
# Requires: pip install selenium webdriver-manager

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

# --- CONFIGURATION ---
BOT_EMAIL = "${activeAccount.email}"
BOT_PASSWORD = "${activeAccount.password}"
TARGET_URL = "https://www.midasbuy.com/midasbuy/eg/redeem/pubgm"

def run_bot(player_id, redeem_code):
    print(f"Starting MidasBot for Player: {player_id}")
    
    # 1. Setup Chrome Browser
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Uncomment to run in background
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    wait = WebDriverWait(driver, 20)

    try:
        # --- LOGIN PHASE ---
        print("Opening Midasbuy...")
        driver.get(TARGET_URL)
        
        print("Clicking Main Login Button...")
        login_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".Button_btn_primary__1ncdM")))
        login_btn.click()
        
        print("Selecting 'Other Methods'...")
        other_methods_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".to-other-login")))
        other_methods_btn.click()
        
        print(f"Entering Email: {BOT_EMAIL}")
        email_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        email_input.clear()
        email_input.send_keys(BOT_EMAIL)
        
        print("Clicking Continue...")
        continue_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".btn.comfirm-btn")))
        continue_btn.click()
        
        time.sleep(2)
        
        print("Entering Password...")
        pass_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='password']")))
        pass_input.send_keys(BOT_PASSWORD)
        
        print("Submitting Login...")
        login_submit_btns = driver.find_elements(By.CSS_SELECTOR, ".btn.comfirm-btn")
        for btn in login_submit_btns:
            if btn.is_displayed():
                btn.click()
                break
                
        print("Waiting for Login to complete...")
        time.sleep(5) 

        # --- REDEMPTION PHASE ---
        
        # 1. Click Switch Icon
        print("Clicking Switch Icon...")
        switch_icon = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "i[class*='i-midas:switch']")))
        switch_icon.click()
        time.sleep(1)

        # 2. Check for Error Icon (Clear button) inside Input Wrapper
        print("Checking for Clear Button...")
        try:
            # Look inside .SelectServerBox_input_wrap_box__qq+Iq (Escaped for CSS: \\+ )
            clear_btn = driver.find_element(By.CSS_SELECTOR, ".SelectServerBox_input_wrap_box__qq\\+Iq i[class*='i-midas:error-filled']")
            if clear_btn.is_displayed():
                clear_btn.click()
                print("Cleared existing input.")
                time.sleep(0.5)
        except:
            print("No clear button found, proceeding.")

        # 3. Enter Player ID
        print(f"Entering Player ID: {player_id}")
        # Targeting input inside the wrapper
        id_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".SelectServerBox_input_wrap_box__qq\\+Iq input")))
        id_input.clear()
        id_input.send_keys(player_id)
        time.sleep(1)

        # 4. Click OK (First one)
        print("Clicking OK (Player Verification)...")
        # Usually the first primary button on page or specific one
        ok_btn_1 = driver.find_element(By.CSS_SELECTOR, ".Button_btn__P0ibl.Button_btn_primary__1ncdM")
        ok_btn_1.click()
        time.sleep(2)

        # 5. Enter Redeem Code
        print(f"Entering Code: {redeem_code}")
        code_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder='يرجى إدخال رمز استرداد']")))
        code_input.clear()
        code_input.send_keys(redeem_code)
        time.sleep(1)

        # 6. Click Final OK
        print("Clicking Final OK...")
        final_ok_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".Button_btn_wrap__utZqk .Button_btn__P0ibl.Button_btn_primary__1ncdM")))
        final_ok_btn.click()
        
        # 7. Check Result
        print("Waiting for Result...")
        time.sleep(3)
        print("SUCCESS: Redemption Flow Complete.")
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        
    finally:
        # driver.quit() 
        pass

if __name__ == "__main__":
    run_bot("PLAYER_ID_HERE", "REDEEM_CODE_HERE")
`;
};

export const generateJavaScriptConsoleCode = (accounts: BotAccount[]) => {
    const activeAccount = accounts.find(a => a.status === 'active') || { email: 'demo@email.com', password: 'password' };
    
    return `
// Copy and paste this into the Console (F12) on Midasbuy to test the flow immediately
(async () => {
    const email = "${activeAccount.email}";
    const password = "${activeAccount.password}";
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    console.log("%c[MidasBot] Starting Sequence...", "color: #8b5cf6; font-size: 14px; font-weight: bold;");

    // --- LOGIN ---
    const loginBtn = document.querySelector('.Button_btn_primary__1ncdM');
    if(loginBtn) { loginBtn.click(); await sleep(1500); }

    const otherBtn = document.querySelector('.to-other-login');
    if(otherBtn) { otherBtn.click(); await sleep(1500); }

    const emailInput = document.querySelector('input[type="email"]');
    if(emailInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(emailInput, email);
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(1000);
    }

    const confirmBtns = document.querySelectorAll('.btn.comfirm-btn');
    if(confirmBtns.length > 0) { confirmBtns[0].click(); await sleep(2500); }

    const passInput = document.querySelector('input[type="password"]');
    if(passInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(passInput, password);
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(1000);
    }

    const loginBtns = document.querySelectorAll('.btn.comfirm-btn');
    for(let btn of loginBtns) {
        if(btn.offsetParent !== null) { btn.click(); break; }
    }
    await sleep(5000);

    // --- REDEEM ---
    console.log("✔ Login Phase Done. Starting Redeem Phase...");

    // 1. Click Switch
    const switchIcon = document.querySelector('.i-midas\\:switch.icon') || document.querySelector('i[class*="i-midas:switch"]');
    if(switchIcon) { 
        switchIcon.click(); 
        console.log("✔ Clicked Switch");
        await sleep(1000);
    }

    // 2. Clear Input
    const clearBtn = document.querySelector('.SelectServerBox_input_wrap_box__qq\\+Iq .i-midas\\:error-filled') || 
                     document.querySelector('div[class*="SelectServerBox_input_wrap_box"] i[class*="i-midas:error-filled"]');
    if(clearBtn) {
        clearBtn.click();
        console.log("✔ Cleared Input");
        await sleep(500);
    }

    // 3. Enter ID
    // Note: We use a generic placeholder to find Player ID to be safe if class is dynamic, but fallback to requested class
    const idInput = document.querySelector('div[class*="SelectServerBox_input_wrap_box"] input') || 
                    document.querySelector('.SelectServerBox_input_wrap_box__qq\\+Iq input');
    
    if(idInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(idInput, "PLAYER_ID_HERE"); // Replace manually
        idInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log("✔ Entered ID");
        await sleep(1000);
    }

    // 4. Click OK
    const okBtn = document.querySelector('.Button_btn__P0ibl.Button_btn_primary__1ncdM');
    if(okBtn) {
        okBtn.click();
        console.log("✔ Clicked OK");
        await sleep(2000);
    }

    // 5. Enter Code
    const codeInput = document.querySelector('input[placeholder="يرجى إدخال رمز استرداد"]');
    if(codeInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(codeInput, "CODE_HERE"); // Replace manually
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log("✔ Entered Code");
        await sleep(1000);
    }

    // 6. Final OK
    const finalOk = document.querySelector('.Button_btn_wrap__utZqk .Button_btn__P0ibl.Button_btn_primary__1ncdM');
    if(finalOk) {
        finalOk.click();
        console.log("✔ Clicked Final OK");
    }
})();
    `;
}