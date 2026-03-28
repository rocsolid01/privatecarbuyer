@echo off
aws lambda update-function-code --function-name pcb-scraper-dev-scrape --image-uri 009398924547.dkr.ecr.us-east-1.amazonaws.com/serverless-pcb-scraper-dev:v15 --region us-east-1 --profile pcb-scraper
