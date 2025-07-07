import os
from flask import Flask, request, jsonify, render_template, send_from_directory
from openai import OpenAI
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 支持跨域请求（如果前后端分离）

# 初始化 OpenAI 客户端
client = OpenAI(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key="19ff5533-84a8-410b-8ddd-70a2feb4d57b",
)

# 路由：让浏览器能通过 /data/xxx 访问你项目中的 shixi/data 目录
@app.route('/data/<path:filename>')
def serve_data(filename):
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data'))
    return send_from_directory(data_dir, filename)

@app.route("/")
def index():
    return render_template("index.html")  # 渲染前端页面

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "")
    try:
        response = client.chat.completions.create(
            model="doubao-seed-1-6-250615",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": user_message
                        }
                    ],
                }
            ],
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
