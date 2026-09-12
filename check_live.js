import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testLive() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Console Error] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    errors.push(`[Page Error] ${err.toString()}`);
  });

  // Try fetching live https://fit.socialninjas.in/v2 and /app
  for (const url of ['https://fit.socialninjas.in/app', 'https://fit.socialninjas.in/v2']) {
    console.log(`\n=== TESTING ${url} ===`);
    try {
      const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      console.log('Status code:', res.status());
      await new Promise(r => setTimeout(r, 2000));
      
      const title = await page.title();
      console.log('Page Title:', title);

      const rootHtml = await page.evaluate(() => {
        const r = document.getElementById('root');
        return r ? r.innerHTML.slice(0, 300) : 'NO #ROOT FOUND';
      });
      console.log('Root snippet:', rootHtml);

      const screenshotName = url.includes('/v2') ? 'live_v2.png' : 'live_app.png';
      await page.screenshot({
        path: `C:\\Users\\nazim\\.gemini\\antigravity\\brain\\9321fef8-4c02-4819-b0ef-ec67f253acbd\\${screenshotName}`,
        fullPage: false
      });
    } catch (e) {
      console.log(`Failed loading ${url}:`, e.message);
    }
  }

  console.log('\n=== LOGGED ERRORS ===');
  console.log(errors.join('\n') || 'None');

  await browser.close();
}

testLive().catch(e => console.error(e));
