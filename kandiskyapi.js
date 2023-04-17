// npm i axios
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

class rudalleClient {
  constructor() {
    this.headers = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryb6ZrB1LvoGELHGVQ',
      'Origin': 'https://fusionbrain.ai',
      'Pragma': 'no-cache',
      'Referer': 'https://fusionbrain.ai/diffusion',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
    };
  }

  async ask(prompt = 'cat', style = '') {
    const data = new FormData();
    data.append('queueType', 'generate');
    data.append('query', prompt.trim());
    data.append('preset', '1');
    data.append('style', style.trim());

    const response = await axios.post('https://fusionbrain.ai/api/v1/text2image/run', data, {
      headers: {
        ...this.headers,
        ...data.getHeaders(),
      },
    });

    const json = response.data;
    if (json.success === true) {
      return [true, json.result.pocketId];
    }
    return [false, ''];
  }

  async check(id) {
    const response = await axios.get(
      `https://fusionbrain.ai/api/v1/text2image/generate/pockets/${id}/status`,
      { headers: this.headers },
    );

    if (response.data.success !== true) {
      return [false];
    }
    if (['INITIAL', 'PROCESSING'].includes(response.data.result)) {
      return [false];
    }
    if (response.data.result === 'SUCCESS') {
      return [true];
    }
  }

  async load(id, path) {
    const response = await axios.get(
      `https://fusionbrain.ai/api/v1/text2image/generate/pockets/${id}/entities`,
      { headers: this.headers },
    );

    const newjpgtxt = response.data.result?.[0]?.response?.[0];
    if (newjpgtxt) {
      const imageBuffer = Buffer.from(newjpgtxt, 'base64');
      fs.writeFileSync(`${path}/0.png`, imageBuffer);
      return true;
    }
    return false;
  }
}

export async function generate(prompt, path, style) {
  if (!style || style == undefined) {style = ``;};
  const client = new rudalleClient();
  const [status, id] = await client.ask(prompt, style);
  if (status !== true) {
    return false;
  }
  let x = JSON.stringify(await client.check(id)) == `[true]`;
  while (x !== true) {
    await new Promise(resolve => setTimeout(resolve, 500));
    x = JSON.stringify(await client.check(id)) == `[true]`;
  }
  return client.load(id, path)
}