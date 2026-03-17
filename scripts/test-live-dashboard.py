import asyncio
from playwright.async_api import async_playwright
import time

async def main():
    print("Launching visible browser on the user's desktop...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=50) # Non-headless so user can watch!
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        print("Navigating to local dashboard...")
        await page.goto("http://localhost:3000/dashboard")
        
        # Wait a moment for the user to see the 0 leads count
        await page.wait_for_timeout(3000)
        
        print("Clicking 'START SEARCH'...")
        # Look for the button with START SEARCH text
        start_btn = page.get_by_role("button", name="START SEARCH")
        if await start_btn.count() > 0:
            await start_btn.click()
        else:
            print("Could not find START SEARCH button. It might already be running.")
        
        print("Waiting 40 seconds for the DataImpulse Python Crawler to finish...")
        # The background Python script is now fetching Craigslist over residential proxies
        # and upserting into Supabase.
        await page.wait_for_timeout(40000)
        
        print("Refreshing Dashboard to show the newly scraped leads...")
        await page.reload()
        await page.wait_for_load_state("networkidle")
        
        # Scroll down so the user can see the populated Tactical Listing
        for i in range(5):
            await page.mouse.wheel(0, 300)
            await page.wait_for_timeout(500)
            
        print("Done! The dashboard should now show the fresh Craigslist cars.")
        await page.wait_for_timeout(10000) # Keep browser open for 10 seconds to admire
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
