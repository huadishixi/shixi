import json

# 原始文件路径
input_file = r'D:/hwadee/shixi/static/data/wordcloud/医疗内容.txt'
# 输出JSON文件路径
output_file = r'D:/hwadee/shixi/static/data/output/news.json'

def convert_to_json(input_path, output_path):
    articles = []
    
    try:
        with open(input_path, 'r', encoding='utf-8') as file:
            current_article = {}
            for line in file:
                line = line.strip()
                if line.startswith('【标题】'):
                    if current_article:  # 如果已经有收集的文章，先保存
                        articles.append(current_article)
                        current_article = {}
                    current_article['标题'] = line[4:].strip()  # 去掉【标题】前缀
                elif line.startswith('【链接】'):
                    current_article['链接'] = line[4:].strip()  # 去掉【链接】前缀
            
            if current_article:  # 添加最后一篇文章
                articles.append(current_article)
                
        # 写入JSON文件
        with open(output_path, 'w', encoding='utf-8') as json_file:
            json.dump(articles, json_file, ensure_ascii=False, indent=4)
            
        print(f"成功转换并保存为JSON文件: {output_path}")
        
    except FileNotFoundError:
        print(f"文件未找到: {input_path}")
    except Exception as e:
        print(f"处理文件时出错: {e}")

# 执行转换
convert_to_json(input_file, output_file)