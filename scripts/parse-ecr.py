import json
import os

repo_file = 'e:/Projects/Webapp_Privatecarbuyer/lambda-scraper/ecr_repos.txt'
if os.path.exists(repo_file):
    with open(repo_file, 'r', encoding='utf-16le' if os.name == 'nt' else 'utf-8') as f:
        content = f.read()
        # Some CLI outputs might have extra text before/after JSON
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end != 0:
            data = json.loads(content[start:end])
            for repo in data.get('repositories', []):
                print(f"Repository Name: {repo['repositoryName']}")
                print(f"Registry ID: {repo['registryId']}")
                print(f"Repository URI: {repo['repositoryUri']}")
        else:
            print("No JSON found in file.")
else:
    print(f"File {repo_file} not found.")
