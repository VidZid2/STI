import fetch from 'node-fetch';

const key = "sk-yivjaNgwp86u0Io4cAe3qQuh7wGW4aYPZXCCd5iFhpOkRUzPyuHQqJbUHlCv9yYg";

async function test(url) {
  console.log(`Testing ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'mimo-v2.5-free',
        messages: [{role: 'user', content: 'hello'}]
      })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text.substring(0, 200)}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

async function main() {
  await test('https://api.openai.com/v1/chat/completions');
  await test('https://opencode.ai/zen/v1/chat/completions');
  await test('https://api.opencode.so/v1/chat/completions');
}
main();
