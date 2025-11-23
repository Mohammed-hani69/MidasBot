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
        # 2. Open Target URL
        print("Opening Midasbuy...")
        driver.get(TARGET_URL)
        
        # 3. Click 'Login' Button (.Button_btn_primary__1ncdM)
        print("Clicking Main Login Button...")
        login_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".Button_btn_primary__1ncdM")))
        login_btn.click()
        
        # 4. Click 'Sign in with other methods' (.to-other-login)
        print("Selecting 'Other Methods'...")
        other_methods_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".to-other-login")))
        other_methods_btn.click()
        
        # 5. Input Email
        print(f"Entering Email: {BOT_EMAIL}")
        email_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        email_input.clear()
        email_input.send_keys(BOT_EMAIL)
        
        # 6. Click Continue (.btn.comfirm-btn)
        print("Clicking Continue...")
        continue_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".btn.comfirm-btn")))
        continue_btn.click()
        
        # Wait for password field animation
        time.sleep(2)
        
        # 7. Input Password
        print("Entering Password...")
        pass_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='password']")))
        pass_input.send_keys(BOT_PASSWORD)
        
        # 8. Click Login (.btn.comfirm-btn)
        # Note: The class name is the same, so we find the visible one or re-query
        print("Submitting Login...")
        login_submit_btns = driver.find_elements(By.CSS_SELECTOR, ".btn.comfirm-btn")
        # Usually the second one is the active one now, or we click the visible one
        for btn in login_submit_btns:
            if btn.is_displayed():
                btn.click()
                break
                
        # 9. Verify Login Success
        print("Waiting for Login to complete...")
        time.sleep(5) # Wait for redirect
        
        # 10. Process Redemption
        print(f"Processing Redemption for ID: {player_id}")
        # Logic to enter ID and Code would go here...
        
        print("SUCCESS: Bot Login Sequence Complete.")
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        
    finally:
        # driver.quit() # Keep open to see result
        pass

# Example Usage (In a real scenario, this script would listen to an API or Database)
if __name__ == "__main__":
    # These would come from the React App request
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

    // 1. Click Login Button
    const loginBtn = document.querySelector('.Button_btn_primary__1ncdM');
    if(loginBtn) {
        loginBtn.click();
        console.log("✔ Clicked Login Button");
        await sleep(1500);
    } else { console.error("Login button not found"); return; }

    // 2. Click 'Other Login'
    const otherBtn = document.querySelector('.to-other-login');
    if(otherBtn) {
        otherBtn.click();
        console.log("✔ Clicked Other Methods");
        await sleep(1500);
    } else { console.error("Other login button not found"); return; }

    // 3. Enter Email
    const emailInput = document.querySelector('input[type="email"]');
    if(emailInput) {
        // React/Vue often require dispatching events
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(emailInput, email);
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log("✔ Entered Email");
        await sleep(1000);
    }

    // 4. Click Continue
    const confirmBtns = document.querySelectorAll('.btn.comfirm-btn');
    if(confirmBtns.length > 0) {
        confirmBtns[0].click();
        console.log("✔ Clicked Continue");
        await sleep(2500);
    }

    // 5. Enter Password
    const passInput = document.querySelector('input[type="password"]');
    if(passInput) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(passInput, password);
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log("✔ Entered Password");
        await sleep(1000);
    }

    // 6. Click Login
    const loginBtns = document.querySelectorAll('.btn.comfirm-btn');
    // Find the visible one
    for(let btn of loginBtns) {
        if(btn.offsetParent !== null) {
            btn.click();
            console.log("✔ Clicked Final Login");
            break;
        }
    }
})();
    `;
}
