import asyncio
import os
from playwright.async_api import async_playwright
import json

async def main():
    async with async_playwright() as pw:
        proxy_url = "http://14cba0df6a7e4020a01341db9965636b:@api.zyte.com:8011"
        proxy = {
            "server": "http://api.zyte.com:8011",
            "username": "14cba0df6a7e4020a01341db9965636b",
            "password": ""
        }
        browser = await pw.chromium.launch(
            headless=True,
            proxy=proxy
        )
        context = await browser.new_context(ignore_https_errors=True)
        
        # Test applying X-Zyte-Options to force a US Residential IP
        await context.set_extra_http_headers({
            "X-Zyte-Options": json.dumps({"geolocation": "US"})
        })
        
        page = await context.new_page()
        print("Loading Craiglist...")
        try:
            resp = await page.goto("https://losangeles.craigslist.org/search/cto", timeout=20000)
            print(f"Status: {resp.status}")
            title = await page.title()
            print(f"Title: {title}")
        except Exception as e:
            print(f"Failed: {e}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
