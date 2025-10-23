# 本地前端 AI 智能体（离线静态示例）

功能

- 自然语言指令解析（基于规则）
- 语音播报（浏览器 TTS）
- 待办项管理：添加、完成、导出、导入
- 创建并下载文本文件
- 简单算术表达式计算

如何运行

1. 将 `ai-agent` 文件夹完整放到本地。
2. 在 Windows 上用 Chrome/Edge 打开 `index.html`（使用 file:// 协议）。
3. 在输入框输入指令并发送。示例：
   - 添加待办 买牛奶
   - 完成待办 1
   - 导出待办
   - 创建文件 notes.txt 内容：这是测试
   - 计算 12*3+5

说明

- 这是一个离线演示智能体，用于满足课程作业的“会说会做”要求。它不调用第三方 AI 服务；如需接入 OpenAI/其他模型，请在 `app.js` 中扩展调用逻辑并存放 API key（注意安全）。
- 若需天气查询等外部 API，可在 `app.js` 中添加请求并在 README 中说明如何填写 API Key。

天气查询（新增）

- 本项目新增了天气查询 UI（侧栏），可以输入城市名并可选填写 OpenWeatherMap 的 API Key。默认会使用 OpenWeatherMap 的 /weather 接口返回城市天气（单位：摄氏度，语言：中文）。
- 如果你没有 API Key，页面会返回离线示例数据（模拟），仍然可以体验功能流程。
- 如何获取 OpenWeatherMap API Key：访问 https://openweathermap.org/ 注册账号后在 API Keys 页面创建一个 Key。将 Key 填入侧栏的 "可选：输入 OpenWeatherMap API Key" 输入框后点击查询即可使用真实数据。
 详细步骤（逐步）:

 1. 打开网站：https://openweathermap.org/
 2. 点击右上角的 "Sign Up"（注册）并完成邮箱验证。
 3. 登录后进入 Dashboard（控制台）或 Account -> API keys 页面。
 4. 在 API keys 区域创建一个新的 Key（通常点击 "Create Key" 或 "Generate Key"），复制生成的字符串。
 5. 回到本项目页面（侧栏天气模块），在 "可选：输入 OpenWeatherMap API Key" 粘贴该字符串，然后点击 "保存 API Key"，随后可以点击 "查询天气" 来使用真实数据。

 示例 API 请求（直接在浏览器或 curl 中测试）：

 - 使用 city 名称查询（示例，返回 JSON）

    https://api.openweathermap.org/data/2.5/weather?q=Beijing&units=metric&lang=zh_cn&appid=YOUR_API_KEY

 - 示例返回片段（已简化）：

 ```json
 {
    "weather": [{"description": "多云"}],
    "main": {"temp": 21.5, "feels_like": 20.1}
 }
 ```

 注意事项：

 - 区分城市名与国家/地区：当多个城市同名时，可以使用 "q=City,CountryCode"（例如 q=London,GB）来明确目标。
 - API Key 生效可能有短暂延迟（几分钟）。
 - 免费套餐有调用频率限制，请参考 OpenWeatherMap 的限额说明。
 - 在 file:// 打开本地 HTML 时，浏览器安全策略可能阻止跨域请求；推荐通过本地静态服务器（上文示例）运行页面以避免此问题。
 - 不要把 Key 放到公开仓库或共享给不可信的人；本项目将 Key 保存在浏览器 localStorage 仅用于本地开发和测试。

故障排查（当你输入 Key 但 API 请求失败或返回 Key 无效时）：

1. 点击页面侧栏的 "测试 Key" 按钮来快速验证 Key 是否能通过 OpenWeatherMap 的简单请求（如果返回 200，Key 可用）。
2. 如果测试返回 401/403：Key 可能无效或未激活。回到 OpenWeatherMap 控制台确认 Key 是否正确复制，并尝试重新生成 Key。
3. 如果测试返回 429：表示达到免费配额或请求频率限制，请等待或升级计划，或在控制台查看配额使用情况。
4. 如果测试或查询报网络错误或 fetch 被阻止：请确认你正在通过 HTTP(S) 访问页面（推荐使用本地静态服务器），并检查是否存在防火墙或代理阻止外部请求。
5. 可以使用 "清除 Key" 按钮移除本地保存的 Key，之后重新粘贴并保存新的 Key。
6. 检查城市名是否拼写正确或使用 "City,CountryCode" 格式（例如：Beijing,CN）以避免城市歧义。
- 注意：在 file://（直接用本地文件打开）时，某些浏览器会因为 CORS 或安全策略阻止跨域 fetch 请求；如果遇到外部 API 无法访问，请在本地启动一个简单静态文件服务器再访问（示例命令）：

```powershell
# 在项目目录启动一个简单的静态服务（需已安装 Python）
python -m http.server 8000; # 然后在浏览器访问 http://localhost:8000/index.html
```

如何在页面保存 API Key

- 侧栏天气模块中有一个 "可选：输入 OpenWeatherMap API Key" 的输入框，输入 Key 后点击 "保存 API Key" 按钮会把 Key 存入浏览器的 localStorage，下次打开页面会自动加载。
- 如果你想清除本地保存的 Key，请点击 "清除 Key"。
- 我们把 Key 存在本地浏览器 storage 中以方便本地测试；不要把真实 Key 提交到公共仓库或共享给他人。

扩展建议

- 接入 Model Context Protocol (MCP) 或 LangChain 前端适配器
- 增加多轮对话状态与意图识别
- 将待办持久化到本地 IndexedDB
