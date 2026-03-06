#!/usr/bin/env python3
"""
测试 Flask 网站 - test.galaxystream.online
"""

from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试网站</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 1rem;
        }
        p {
            color: #666;
            font-size: 1.2rem;
        }
        .status {
            display: inline-block;
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #4ade80;
            color: white;
            border-radius: 0.5rem;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Test Site</h1>
        <p>Hello World from Flask!</p>
        <p>子域名：<code>test.galaxystream.online</code></p>
        <div class="status">✅ 运行正常</div>
    </div>
</body>
</html>
'''

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5003, debug=False)
