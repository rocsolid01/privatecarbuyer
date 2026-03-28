import json
import os

repo_file = 'e:/Projects/Webapp_Privatecarbuyer/lambda-scraper/ecr_full_list.txt'
if os.path.exists(repo_file):
    try:
        with open(repo_file, 'r', encoding='utf-16le' if os.name == 'nt' else 'utf-8') as f:
            content = f.read()
            start = content.find('{')
            end = content.rfind('}') + 1
            if start != -1 and end != 0:
                data = json.loads(content[start:end])
                for repo in data.get('repositories', []):
                    print(repo['repositoryName'])
            else:
                print("No JSON found.")
    except Exception as e:
        print(f"Error reading file: {e}")
else:
    print("File not found.")
