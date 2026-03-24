
Write-Host "--- DEPLOYING TO LIVE ---" -ForegroundColor Cyan
Write-Host "1. Pushing to Vercel..." -ForegroundColor Yellow
git push

Write-Host "2. Deploying Scraper to AWS..." -ForegroundColor Yellow
cd lambda-scraper
npx sls deploy
cd ..

Write-Host "--- DEPLOYMENT COMPLETE ---" -ForegroundColor Green
Write-Host "Check your live site at https://privatecarbuyer.vercel.app/"
