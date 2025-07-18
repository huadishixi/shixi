import os
from openai import OpenAI

# 请确保您已将 API Key 存储在环境变量 ARK_API_KEY 中
# 初始化Ark客户端，从环境变量中读取您的API Key
client = OpenAI(
    # 此为默认路径，您可根据业务所在地域进行配置
    # base_url="https://ark.cn-beijing.volces.com/api/v3",
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    # 从环境变量中获取您的 API Key。此为默认方式，您可根据需要进行修改
    api_key="19ff5533-84a8-410b-8ddd-70a2feb4d57b",
)

response = client.chat.completions.create(
    # 指定您创建的方舟推理接入点 ID，此处已帮您修改为您的推理接入点 ID
    model="doubao-seed-1-6-250615",
    # model="bot-20250705110808-7rdzv",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "你是谁研发的？"
                },
                #text从对话框获取
            ],
        }
    ],
)

print(response.choices[0])