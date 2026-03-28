import json
import os

repo_file = 'e:/Projects/Webapp_Privatecarbuyer/lambda-scraper/ecr_all.txt'
if os.path.exists(repo_file):
    with open(repo_file, 'r', encoding='utf-16le' if os.name == 'nt' else 'utf-8') as f:
        content = f.read()
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end != 0:
            data = json.loads(content[start:end])
            repos = [repo['repositoryName'] for repo in data.get('repositories', [])]
            print("\n".join(repos))
        else:
            print("No JSON found.")
else:
    print("File not found.")
