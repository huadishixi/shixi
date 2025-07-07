import requests
from bs4 import BeautifulSoup

base_url = "https://www.yiliaozixun.com.cn/htm/yiyuan/"
header = {
    "user-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
}
# 请求第一页获取总页数
response = requests.get(base_url,headers=header)
soup = BeautifulSoup(response.text, 'html.parser')

paging_div = soup.find('div', class_='wrap-list-paging mt-20 clearfix')
if paging_div:
    strong_tags = paging_div.find_all('strong')
    if strong_tags and len(strong_tags) >= 1:
        total_pages = int(strong_tags[0].text.strip())
        print(f"检测到总页数：{total_pages} 页")
    else:
        print("没找到 <strong> 标签，默认抓取 1 页")
        total_pages = 1
else:
    print("没找到分页区域，默认抓取 1 页")
    total_pages = 1

# 结果保存
href_list = []

# 遍历每一页
for i in range(1, total_pages + 1):
    if i == 1:
        url = "https://www.yiliaozixun.com.cn/htm/yiyuan/"
    else:
        url = f"https://www.yiliaozixun.com.cn/htm/yiyuan/lists_11_{i}.html"

    print(f"正在爬取：{url} ")

    # 请求页面
    response = requests.get(url)
    response.encoding = 'utf-8'
    soup = BeautifulSoup(response.text, 'html.parser')

    # 找到目标 div
    target_div = soup.find('div', class_='left fl')
    if target_div:
        h3_tags = target_div.find_all('h3', class_='ls-typetwo-title')
        for h3 in h3_tags:
            a_tag = h3.find('a', href=True)
            href = a_tag['href']
            if href.startswith('/htm/yiyuan/'):
                full_url = "https://www.yiliaozixun.com.cn" + href
                if full_url not in href_list:
                    href_list.append(full_url)
    else:
        print(f"第{i}页没有找到目标内容")

# 保存到文件
with open('医疗.txt', 'a', encoding='utf-8') as f:
    for link in href_list:
        f.write(link + '\n')

print(f"已保存{len(href_list)}条链接到医疗.txt")
