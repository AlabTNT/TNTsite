from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

headerstr1 = """<g>
	<path d="M8,8.67h1.67c0.18,0,0.35-0.07,0.47-0.2l5-5c0.26-0.26,0.26-0.68,0-0.94l-1.67-1.67   c-0.26-0.26-0.68-0.26-0.94,0l-5,5c-0.12,0.12-0.2,0.29-0.2,0.47V8C7.33,8.37,7.63,8.67,8,8.67z M8.67,6.61L13,2.28L13.72,3   L9.39,7.33H8.67V6.61z"></path>
	<path d="M13,10.67H3c-0.55,0-1-0.45-1-1c0-0.55,0.45-1,1-1h2.33C5.7,8.67,6,8.37,6,8S5.7,7.33,5.33,7.33H3   c-1.29,0-2.33,1.05-2.33,2.33C0.67,10.95,1.71,12,3,12h10c0.55,0,1,0.45,1,1c0,0.55-0.45,1-1,1H6c-0.37,0-0.67,0.3-0.67,0.67   s0.3,0.67,0.67,0.67h7c1.29,0,2.33-1.05,2.33-2.33C15.33,11.71,14.29,10.67,13,10.67z"></path>
</g>"""

headerstr2 = """/* eslint-disable no-alert */
/* eslint-disable prefer-template */
/* eslint-disable no-var */"""


def extract_questions_from_text_1(html_content:str):
    soup = BeautifulSoup(html_content, 'html.parser')

    # Cleanup CodeMirror editor blocks to standard <pre><code> blocks
    for data_code in soup.find_all('div', attrs={'data-code': True}):
        cm_content = data_code.find('div', class_='cm-content')
        if cm_content:
            lines = []
            for line in cm_content.find_all('div', class_='cm-line'):
                # Handle zero-width spaces that might act as empty lines, or just get text
                lines.append(line.get_text())
            code_text = '\n'.join(lines)
            pre = soup.new_tag('pre')
            code = soup.new_tag('code')
            code.string = code_text
            pre.append(code)
            data_code.replace_with(pre)

    questions_list = []
    question_blocks = soup.select('div.pc-x')

    for block in question_blocks:
        question_data = {}
        author_tag = block.find(lambda tag: tag.name == "div" and "作者" in tag.text and "pc-text-raw" in tag.get("class", []))
        if author_tag:
            question_data['author'] = author_tag.get_text(strip=True).replace('作者', '').strip()
        stem_tag = block.select_one('.space-y-4 > .hyphens-auto > .rendered-markdown')
        if stem_tag:
            question_data['stem'] = str(stem_tag)
        options = []
        labels = block.select('label')
        for label in labels:
            input_radio = label.find('input')
            if input_radio:
                flex_div = label.find('div', class_='flex')
                opt_text = str(flex_div) if flex_div else label.get_text(strip=True)
                is_checked = input_radio.has_attr('checked')
                options.append({
                    'text': opt_text,
                    'is_user_choice': is_checked
                })
        question_data['options'] = options
        result_label = block.find(string='评测结果')
        if result_label:
            result_div = result_label.parent.find_next_sibling('div')
            if result_div:
                question_data['result'] = result_div.get_text(strip=True)
        if question_data.get('stem') or question_data.get('options'):
            questions_list.append(question_data)

    return questions_list

def extract_questions_from_text_2(html_content:str) -> dict:
    """
    处理编程题 HTML，提取题目标题、描述、输入输出样例、限制条件及代码内容。
    :param file_path_or_html: 文件路径或 HTML 字符串文本
    :return: dict 包含所有提取到的题目信息
    """
    soup = BeautifulSoup(html_content, 'html.parser')

    # Cleanup CodeMirror editor blocks to standard <pre><code> blocks
    for data_code in soup.find_all('div', attrs={'data-code': True}):
        cm_content = data_code.find('div', class_='cm-content')
        if cm_content:
            lines = []
            for line in cm_content.find_all('div', class_='cm-line'):
                # Handle zero-width spaces that might act as empty lines, or just get text
                lines.append(line.get_text())
            code_text = '\n'.join(lines)
            pre = soup.new_tag('pre')
            code = soup.new_tag('code')
            code.string = code_text
            pre.append(code)
            data_code.replace_with(pre)

    result = {}
    title_tag = soup.select_one('.text-darkest.font-bold.text-lg')
    result['title'] = title_tag.get_text(strip=True) if title_tag else None
    for text_div in soup.select('.pc-text-raw'):
        text = text_div.get_text(strip=True)
        if text.startswith('分数'):
            result['score'] = text.replace('分数', '').strip()
        elif text.startswith('作者'):
            result['author'] = text.replace('作者', '').strip()
        elif text.startswith('单位'):
            result['organization'] = text.replace('单位', '').strip()
    markdown_div = soup.select_one('.rendered-markdown')
    if markdown_div:
        result['description'] = str(markdown_div)
    def extract_code_mirror(container):
        if not container:
            return None
        lines = container.select('.cm-line')
        return '\n'.join(line.get_text() for line in lines)
    result['input_example'] = extract_code_mirror(soup.select_one('div[data-lang="in"]'))
    result['output_example'] = extract_code_mirror(soup.select_one('div[data-lang="out"]'))
    editor_content = soup.select_one('.answerInput__EAtJ .cm-content')
    result['submitted_code'] = extract_code_mirror(editor_content)
    limits = {}
    limit_items = soup.select('.problemInfo_HVczC .item_YVmJd')
    for item in limit_items:
        label_tag = item.select_one('.label_vdWMs')
        value_tag = item.select_one('.pc-color-normal .pc-text-raw')
        if label_tag and value_tag:
            key = label_tag.get_text(strip=True)
            value = value_tag.get_text(strip=True)
            limits[key] = value
            
    result['limits'] = limits

    return result


def savejson(filename:str, content:json):
    with open(f"./{filename}.json", "w", encoding="utf-8") as target:
        json.dump(content, target)

def general_wash(filename:str) -> str:
    '''
    提供与脚本同目录的文件名，然后输出初步洗刷数据。
    '''
    
    with open(f"./{filename}.html", "r", encoding="utf-8") as f:
        html_content = f.read().split(headerstr1)[1].split(headerstr2)[0]
    
    return html_content

def wash_step2_option(text:str) -> str:
    '''
    提供来自单选题、多选题和程序填空题的初步洗刷数据，然后输出二次洗刷数据
    '''
    return text.split("""<div class="flex flex-col m-4 mb-0 flex-1">""")[1].split("</main>")[0]

def wash_step2_program(text:str) -> str:
    '''
    提供来自程序题的初步洗刷数据，然后输出二次洗刷数据
    '''
    return text.split("""<div class="pc-icon"><svg aria-hidden="true" class="pc-icon-raw"><use xlink:href="#pat-right"></use></svg></div></div></button></div></div></div><div class="flex flex-col overflow-auto flex-1">""")[1].split("""<div class="sticky bottom-0 z-10 flex-none flex justify-center items-center px-2 py-3 border-t border-border bg-bg-base">""")[0]

def execute_1(filename, q_type, save=False, singleoutput=True, output=""):
    if singleoutput:
        output = filename
    questions = extract_questions_from_text_1(wash_step2_option(general_wash(filename)))
    for q in questions:
        q['q_type'] = q_type
    if save:
        savejson(output, questions)
    return questions

def execute_2(filename, q_type, save=False, singleoutput=True, output=""):
    if singleoutput:
        output = filename
    questions = extract_questions_from_text_2(wash_step2_program(general_wash(filename)))
    questions['q_type'] = q_type
    if save:
        savejson(output, questions)
    return questions

def batch_files():
    final_dict = {}
    for file in os.listdir('.'):
        if file.endswith('.html'):
            base_name = file[:-5]
            if "_" not in base_name:
                continue
            parts = base_name.split('_')
            print(f"Processing file: {file} with parts: {parts}")
            
            if len(parts) >= 2:
                time_key = parts[0]
                q_type = parts[1]
                
                if time_key not in final_dict:
                    final_dict[time_key] = []
                    
                if q_type in ['single', 'multi', 'blank', 'check']:
                    result = execute_1(base_name, q_type)
                    if isinstance(result, list):
                        final_dict[time_key].extend(result)
                elif q_type in ['program', 'function']:
                    result = execute_2(base_name, q_type)
                    final_dict[time_key].append(result)

    current_time = datetime.now().strftime("%Y%m%d-%H%M")
    with open(f"{current_time}.json", "w", encoding="utf-8") as f:
        json.dump(final_dict, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    batch_files()