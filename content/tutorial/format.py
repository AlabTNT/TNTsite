import re
import glob
import os

def format_markdown(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Remove <br> and <br><br>
    content = re.sub(r'<br\s*/?>', '', content)
    
    # Remove trailing spaces at end of lines
    content = re.sub(r' +\n', '\n', content)

    # Insert spaces between Chinese and English/Numbers
    content = re.sub(r'([\u4e00-\u9fa5])([a-zA-Z0-9])', r'\1 \2', content)
    content = re.sub(r'([a-zA-Z0-9])([\u4e00-\u9fa5])', r'\1 \2', content)

    # Ensure no more than 2 empty lines
    content = re.sub(r'\n{3,}', '\n\n', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Formatted: {filepath}")

if __name__ == "__main__":
    tutorial_dir = r"d:\projectives\alabtnt-web\content\tutorial"
    md_files = glob.glob(os.path.join(tutorial_dir, "*.md"))
    for md_file in md_files:
        format_markdown(md_file)
    print("Done formatting markdown files.")
