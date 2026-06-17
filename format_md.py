import os
import re
import glob

def format_text(text):
    # Remove HTML <br> tags
    text = re.sub(r'<br\s*/?>(\n)*', '\n', text)
    
    # Remove trailing spaces from lines
    text = re.sub(r'[ \t]+$', '', text, flags=re.MULTILINE)
    
    # Add spaces between Chinese and English/Numbers
    # match Chinese to English/Number
    text = re.sub(r'([\u4e00-\u9fa5])([a-zA-Z0-9])', r'\1 \2', text)
    # match English/Number to Chinese
    text = re.sub(r'([a-zA-Z0-9])([\u4e00-\u9fa5])', r'\1 \2', text)
    
    # Compress multiple blank lines to a single blank line
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip() + '\n'

def process_files(directory):
    files_to_process = [
        '2.0.md', '3.0.md', '4.0.md', '5.0.md',
        'index.md', 'app.1.md', 'app.2.md', 'app.3.md', 'app.4.md'
    ]
    
    for filename in files_to_process:
        filepath = os.path.join(directory, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = format_text(content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Processed {filename}')

if __name__ == '__main__':
    process_files(r'd:\projectives\alabtnt-web\content\tutorial')
