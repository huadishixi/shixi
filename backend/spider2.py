import requests
from bs4 import BeautifulSoup

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
}

with open('医疗.txt', 'r', encoding='utf-8') as f:
    urls = [line.strip() for line in f if line.strip()]

print(f"共读取到 {len(urls)} 个链接")

for idx, url in enumerate(urls, start=1):
    try:
        print(f"正在爬取第 {idx} 个：{url}")

        response = requests.get(url, headers=headers, timeout=10)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')

        title_tag = soup.find('h1', class_='arti-title')
        title = title_tag.get_text(strip=True) if title_tag else "未找到标题"

        content_div = soup.find('div', class_='arti-content')
        if content_div:
            content = content_div.get_text(strip=True)
        else:
            content = "未找到内容"

        with open('医疗内容.txt', 'a', encoding='utf-8') as f_out:
            f_out.write(f"【标题】{title}\n")
            f_out.write(f"【链接】{url}\n")
            f_out.write(f"【内容】\n{content}\n")
            f_out.write("=" * 60 + "\n")

    except requests.exceptions.RequestException as e:
        print(f"{url} 连接出问题，跳过 错误原因：{e}")

print("全部抓取完成，已保存到医疗内容.txt")
