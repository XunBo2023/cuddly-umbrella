// 本地前端智能体 主逻辑（不依赖外部 AI）
const messagesEl = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const voiceToggle = document.getElementById('voiceToggle');
const clearBtn = document.getElementById('clearBtn');

const todoListEl = document.getElementById('todoList');
const exportTodos = document.getElementById('exportTodos');
const importTodos = document.getElementById('importTodos');
const fileInput = document.getElementById('fileInput');

const calcBtn = document.getElementById('calcBtn');
const calcInput = document.getElementById('calcInput');

let todos = [];

function pushMessage(text, from='agent'){
  const div = document.createElement('div');
  div.className = 'message ' + (from==='user' ? 'user' : 'agent');
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  if(from==='agent' && voiceToggle.checked){ speak(text); }
}

function speak(text){
  if(!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function renderTodos(){
  todoListEl.innerHTML = '';
  todos.forEach((t, idx) =>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${idx+1}. ${escapeHtml(t.text)}</span><span><button data-idx="${idx}" class="doneBtn">完成</button></span>`;
    todoListEl.appendChild(li);
  });
}

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function addTodo(text){ todos.push({text}); renderTodos(); pushMessage(`已添加待办：${text}`); }
function completeTodo(idx){ if(todos[idx]){ const txt = todos[idx].text; todos.splice(idx,1); renderTodos(); pushMessage(`已完成待办：${txt}`); } else pushMessage('无效的待办编号'); }

function exportTodosTxt(){ const txt = todos.map((t,i)=>`${i+1}. ${t.text}`).join('\r\n');
  const blob = new Blob([txt],{type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'todos.txt'; a.click(); URL.revokeObjectURL(url);
  pushMessage('已导出待办到 todos.txt');
}

function importTodosFromFile(file){ const reader = new FileReader(); reader.onload = (e)=>{
  const content = e.target.result.split(/\r?\n/).filter(Boolean);
  content.forEach(line=>{
    const m = line.replace(/^\d+\.\s*/,''); if(m) todos.push({text:m});
  }); renderTodos(); pushMessage('已从文件导入待办');
}; reader.readAsText(file,'utf-8'); }

function createFileAndDownload(name, content){ const blob = new Blob([content],{type:'text/plain;charset=utf-8'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  pushMessage(`已创建并下载文件：${name}`);
}

function calcExpression(expr){ try{ // 安全：只允许数字和算术符
    if(!/^[0-9+\-*/().\s]+$/.test(expr)) throw new Error('表达式包含非法字符');
    const res = Function('return ('+expr+')')(); pushMessage(`计算结果：${res}`); return res;
  }catch(e){ pushMessage('计算失败：'+e.message); }
}

function simpleAgentHandle(text){
  const t = text.trim();
  // 常用指令
  const addTodoMatch = t.match(/^(添加|新建)\s*待办\s*(.+)$/i);
  const completeMatch = t.match(/^(完成|标记完成)\s*待办\s*(\d+)$/i);
  const exportMatch = t.match(/^(导出|下载)\s*待办/i);
  const createFileMatch = t.match(/^(创建|新建)文件\s+([^\s]+)\s+内容[:：]\s*(.+)$/i);
  const calcMatch = t.match(/^(计算|算)\s*(.+)$/i) || t.match(/^([0-9\s+\-*/().]+)$/);
  const weatherCmdMatch = t.match(/^(查询|查看)\s*天气\s*(?:in|在)?\s*(.+)$/i) || t.match(/^天气\s*(.+)$/i);
  const planMatch = t.match(/^(生成|制定|规划|建议)\s*(出行|旅行|行程)\s*(?:计划|方案)?\s*(?:in|去|到|在)?\s*(.+)$/i);

  if(addTodoMatch){ addTodo(addTodoMatch[2]); return; }
  if(completeMatch){ completeTodo(parseInt(completeMatch[2],10)-1); return; }
  if(exportMatch){ exportTodosTxt(); return; }
  if(createFileMatch){ createFileAndDownload(createFileMatch[2], createFileMatch[3]); return; }
  if(calcMatch){ const expr = calcMatch[2] || calcMatch[1]; calcExpression(expr); return; }
  if(weatherCmdMatch){ const city = weatherCmdMatch[2] || weatherCmdMatch[1]; fetchWeatherForCity(city); return; }
  if(planMatch){ const city = planMatch[3]; generateTravelPlan(city); return; }

  // 默认回复（模拟对话）
  pushMessage('我已收到你的指令，但这是一个离线示例智能体。目前支持：添加/完成/导出待办，创建文件，计算表达式。请参照示例命令。');
}

sendBtn.addEventListener('click', ()=>{ const v = userInput.value.trim(); if(!v) return; pushMessage(v,'user'); simpleAgentHandle(v); userInput.value=''; });
userInput.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){ sendBtn.click(); }});
clearBtn.addEventListener('click', ()=>{ messagesEl.innerHTML=''; pushMessage('会话已清空'); });

todoListEl.addEventListener('click',(e)=>{ if(e.target.classList.contains('doneBtn')){ const idx = parseInt(e.target.dataset.idx,10); completeTodo(idx); }});
exportTodos.addEventListener('click', exportTodosTxt);
importTodos.addEventListener('click', ()=>fileInput.click());
fileInput.addEventListener('change',(e)=>{ const f = e.target.files[0]; if(f) importTodosFromFile(f); });

calcBtn.addEventListener('click', ()=>{ const v = calcInput.value.trim(); if(!v) return; calcExpression(v); calcInput.value=''; });

/**
 * 根据天气生成出行建议，包含穿衣、交通工具、活动和路线等建议
 */
function generateAdviceFromWeather(city, weather, temp, feelsLike, windSpeed){
  let advice = [];
  
  // 穿衣建议（基于体感温度）
  if(feelsLike < 10){
    advice.push('🧥 建议穿厚外套、围巾，注意保暖');
  } else if(feelsLike < 15){
    advice.push('👕 建议穿长袖衣服、薄外套');
  } else if(feelsLike < 25){
    advice.push('👕 天气舒适，建议穿普通衬衫或T恤');
  } else {
    advice.push('👕 天气较热，建议穿轻薄透气的衣物');
  }

  // 出行方式建议（基于天气和风速）
  if(weather.includes('雨')){
    advice.push('🚌 降雨天气，建议乘坐公共交通或打车，记得带伞');
    advice.push('🌂 出门前准备雨伞或雨衣');
  } else if(weather.includes('雪')){
    advice.push('🚌 降雪天气，建议乘坐公共交通，注意路面结冰');
    advice.push('🧤 记得戴手套、围巾等保暖用品');
  } else if(windSpeed > 5){
    advice.push('💨 风力较大，建议选择地铁等封闭交通工具');
  } else if(weather.includes('晴') && temp > 20){
    advice.push('🚲 天气不错，可以考虑骑行或步行');
  }

  // 活动建议（基于天气状况）
  if(weather.includes('晴') && temp >= 15 && temp <= 28){
    advice.push('🏃‍♂️ 适合户外活动，可以去公园散步或运动');
    advice.push('🎨 推荐游览景点、拍照或野餐');
  } else if(weather.includes('阴') || weather.includes('多云')){
    advice.push('🏛️ 可以参观博物馆、美术馆等室内景点');
    advice.push('🛍️ 适合购物或在商场休闲');
  } else if(weather.includes('雨') || weather.includes('雪')){
    advice.push('🎬 建议选择室内活动，如看电影、逛商场');
    advice.push('☕ 找一家咖啡馆或餐厅放松休息');
  }

  // 路线规划建议
  if(weather.includes('雨') || weather.includes('雪')){
    advice.push('🗺️ 建议规划室内-地下通道-目的地的路线');
    advice.push('⏰ 预留更多通勤时间，注意交通延误');
  }

  // 其他贴心提示
  if(temp > 28){
    advice.push('💧 高温天气，记得多补充水分');
    advice.push('🕶️ 建议戴太阳镜、防晒');
  } else if(temp < 10){
    advice.push('🧣 低温天气，注意保暖');
  }

  // 发送建议
  pushMessage(`===== ${city}出行建议 =====`);
  advice.forEach(a => pushMessage(a));
  pushMessage('===================');
}

/**
 * 生成出行计划（先查询天气，然后生成建议）
 */
function generateTravelPlan(city){
  pushMessage(`正在为您生成${city}的出行计划...`);
  window._pendingPlanCity = city;  // 标记等待生成计划
  fetchWeatherForCity(city);  // 查询天气后会自动触发建议生成
}

// 启动欢迎信息
pushMessage('你好，我是本地前端智能体。你可以输入自然语言指令，例如：添加待办 买牛奶，创建文件 notes.txt 内容：你好，计算 12*3。现在也可以输入"生成出行计划 北京"获取基于天气的出行建议！');

// ---------- 天气查询实现 ----------
const weatherBtn = document.getElementById('weatherBtn');
const weatherCityInput = document.getElementById('weatherCity');
const weatherApiKeyInput = document.getElementById('weatherApiKey');
const exampleWeatherBtn = document.getElementById('exampleWeather');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const clearApiKeyBtn = document.getElementById('clearApiKey');
const testApiKeyBtn = document.getElementById('testApiKey');
const weatherStatusEl = document.getElementById('weatherStatus');

weatherBtn.addEventListener('click', ()=>{
  const city = weatherCityInput.value.trim(); if(!city){ pushMessage('请先输入城市名称'); return; }
  fetchWeatherForCity(city);
});
exampleWeatherBtn.addEventListener('click', ()=>{ const city='北京'; pushMessage(`查询天气 ${city}`,'user'); fetchWeatherForCity(city); });

// 加载本地保存的 API Key（如果存在）
const LS_WEATHER_KEY = 'owm_api_key_v1';
const savedKey = localStorage.getItem(LS_WEATHER_KEY);
if(savedKey){ weatherApiKeyInput.value = savedKey; weatherStatusEl.textContent = '已加载本地保存的 API Key'; }

saveApiKeyBtn.addEventListener('click', ()=>{
  const k = weatherApiKeyInput.value.trim();
  if(!k){ weatherStatusEl.textContent = '请输入一个非空的 API Key 后再保存'; return; }
  localStorage.setItem(LS_WEATHER_KEY, k); weatherStatusEl.textContent = '已保存 API Key 到 localStorage';
});
clearApiKeyBtn.addEventListener('click', ()=>{ localStorage.removeItem(LS_WEATHER_KEY); weatherApiKeyInput.value=''; weatherStatusEl.textContent = '已清除本地保存的 API Key'; });
testApiKeyBtn.addEventListener('click', ()=>{
  const k = weatherApiKeyInput.value.trim();
  if(!k){ weatherStatusEl.textContent = '请输入 API Key 后再测试'; return; }
  weatherStatusEl.textContent = '正在测试 API Key...';
  testApiKey(k).then(msg=>{ weatherStatusEl.textContent = msg; }).catch(err=>{ weatherStatusEl.textContent = '测试失败：'+err.message; });
});

async function testApiKey(key){
  const testUrl = `https://api.openweathermap.org/data/2.5/weather?q=Beijing&appid=${encodeURIComponent(key)}`;
  try{
    const r = await fetch(testUrl);
    if(r.status===200) return 'API Key 可用（测试成功）';
    if(r.status===401 || r.status===403) return 'Key 无效或无权限（HTTP '+r.status+'). 请检查 Key 或在 OpenWeatherMap 控制台重新生成。';
    if(r.status===429) return '达到调用限额（HTTP 429）。请检查配额或稍后重试。';
    return `测试返回 HTTP ${r.status}，请查看网络或 Key 配置`;
  }catch(e){
    throw new Error('网络错误或被浏览器阻止（CORS/HTTPS）。可尝试在本地服务器环境运行页面或检查网络连接。');
  }
}

/**
 * 尝试使用 OpenWeatherMap API 查询天气。
 * 如果未提供 API key 或请求失败，降级返回示例（模拟）数据。
 */
function fetchWeatherForCity(city){
  pushMessage(`正在查询 ${city} 的天气...`);
  const apiKey = weatherApiKeyInput.value.trim();
  if(apiKey){
    // 使用 OpenWeatherMap 的简单接口（城市名）
    weatherStatusEl.textContent = '正在通过 OpenWeatherMap 查询...';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=zh_cn&appid=${encodeURIComponent(apiKey)}`;
    fetch(url).then(async (r)=>{
      if(!r.ok){
        // 尝试读取响应体以便诊断（可能是 JSON 或文本）
        let bodyText = '';
        try{ bodyText = await r.text(); }catch(e){ bodyText = '<无法读取响应体>'; }
        // 对 404（城市未找到）给出更友好的提示
        if(r.status === 404){
          throw new Error('找不到该城市。请尝试使用英文名（如 Beijing）或添加国家代码（如 Beijing,CN）。' + 
            '常见例子：Shanghai、Guangzhou,CN、London,GB、Tokyo,JP');
        }
        throw new Error(`HTTP ${r.status} - ${bodyText}`);
      }
      return r.json();
    }).then(j=>{
      if(j && j.weather){
        const desc = j.weather[0].description;
        const temp = j.main && j.main.temp;
        const feels = j.main && j.main.feels_like;
        const wind = j.wind && j.wind.speed;
        const txt = `${city}：${desc}，当前 ${temp}°C，体感 ${feels}°C。`;
        pushMessage(txt);
        weatherStatusEl.textContent = `查询成功：${desc}，${temp}°C`;
        // 如果这是由生成计划触发的，自动生成建议
        if(window._pendingPlanCity === city){
          window._pendingPlanCity = null;
          generateAdviceFromWeather(city, desc, temp, feels, wind);
        }
      } else {
        throw new Error('未返回天气数据');
      }
    }).catch(err=>{
      console.error('weather fetch error', err);
      // 把更详细的错误呈现给用户用于排查
      const short = err.message || String(err);
      weatherStatusEl.textContent = '天气查询失败：' + short + (short.includes('找不到该城市') ? '' : '（已降级为示例数据）');
      pushMessage('天气查询出错：' + short);
      // 如果不是城市未找到的错误，才使用模拟数据
      if(!short.includes('找不到该城市')){
        pushMessage(simulateWeather(city));
      }
    });
  } else {
    // 无 api key，提供模拟数据
    weatherStatusEl.textContent = '未提供 API Key，返回离线示例天气数据';
    pushMessage('未提供 API Key，返回离线示例天气数据');
    pushMessage(simulateWeather(city));
  }
}

function simulateWeather(city){
  // 非真实来源，仅示例
  const temps = [10,12,15,18,20,22,25,28];
  const t = temps[Math.floor(Math.random()*temps.length)];
  const conds = ['晴', '多云', '小雨', '阴', '大风', '小雪'];
  const c = conds[Math.floor(Math.random()*conds.length)];
  return `${city}：${c}，大约 ${t}°C（示例数据）。`;
}
