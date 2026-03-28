import os

input_file = 'e:/Projects/Webapp_Privatecarbuyer/lambda-scraper/ecr_full_list.txt'
output_file = 'e:/Projects/Webapp_Privatecarbuyer/lambda-scraper/ecr_full_utf8.txt'
if os.path.exists(input_file):
    with open(input_file, 'rb') as f:
        content = f.read().decode('utf-16le')
        with open(output_file, 'w', encoding='utf-8') as out:
            out.write(content)
    print(f"Converted to {output_file}")
else:
    print("Input file not found.")
