import json
import os

lambda_file = 'e:/Projects/Webapp_Privatecarbuyer/lambda-scraper/lambda_info.txt'
if os.path.exists(lambda_file):
    with open(lambda_file, 'r', encoding='utf-16le' if os.name == 'nt' else 'utf-8') as f:
        content = f.read()
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end != 0:
            data = json.loads(content[start:end])
            image_uri = data.get('Configuration', {}).get('ImageConfigResponse', {}).get('ImageConfig', {}).get('ImageUri', '') or data.get('Configuration', {}).get('Code', {}).get('ImageUri', '')
            print(f"Image URI: {image_uri}")
        else:
            print("No JSON found in file.")
else:
    print(f"File {lambda_file} not found.")
