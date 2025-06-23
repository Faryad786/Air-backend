const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');

puppeteer.use(StealthPlugin());

let airtableCookies = null; 

function cookiesArrayToHeader(cookies) {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

/**
 * @param {Object} param0 
 * @param {string} param0.email
 * @param {string} param0.password
 * @returns {Promise<string[]>} cookies
 */
async function loginAndGetCookies({ email, password,mfaCode }) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);

  try {
    console.log('[1] Navigating to Airtable login page...');
    await page.goto('https://airtable.com/login', { waitUntil: 'load', timeout: 60000 });

    console.log('[2] Waiting for email input...');
    await page.waitForSelector('input#emailLogin');
    await page.type('input#emailLogin', email);
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('[3] Clicking submit (email)...');
    await Promise.all([
      page.click('form#signInEmailForm button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }),
    ]);

    console.log('[4] Waiting for password input...');
    await page.waitForSelector('input#passwordLogin');
    await page.type('input#passwordLogin', password);
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('[5] Clicking submit (password)...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }),
    ]);

    console.log('[4] Waiting for mfa input...');
    await page.waitForSelector('input#mfaCode');
    await page.type('input#mfaCode', mfaCode);
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('[5] Clicking submit (mfa)...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }),
    ]);

    console.log('[6] Checking if login succeeded...');
    if (page.url().includes('/login')) {
      throw new Error('Login failed — incorrect credentials or CAPTCHA present.');
    }

    console.log('[7] Login successful. Getting cookies...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const cookies = await page.cookies();

    airtableCookies = cookiesArrayToHeader(cookies);
    console.log('✅ Cookies saved to airtableCookies');

    await browser.close();
    return cookies;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    await page.screenshot({ path: 'login-error.png' });
    await browser.close();
    throw error;
  }
}

/**
 * @returns {Promise<boolean>}
 */
async function checkCookiesValid() {
  if (!airtableCookies) return false;

  try {
    const res = await axios.get('https://airtable.com/account', {
      headers: { Cookie: airtableCookies },
      maxRedirects: 0,
      validateStatus: status => status < 400,
    });
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

function parseCookiesForPuppeteer(cookieString) {
  const domain = 'https://airtable.com';

  return cookieString
    .split(';')
    .map(cookie => cookie.trim())
    .filter(cookie => cookie.includes('='))
    .map(cookie => {
      const [name, ...valueParts] = cookie.split('=');
      const rawValue = valueParts.join('=').trim();

      if (!name || !rawValue) return null;
      const encodedValue = encodeURIComponent(rawValue);

      return {
        name: name.trim(),
        value: encodedValue,
        domain,
        path: '/',
        secure: true,
        httpOnly: false,
      };
    })
    .filter(Boolean);
}


async function fetchRevisionHistoryWithPuppeteer({ baseId, tableId, rowId }) {
  if (!airtableCookies) throw new Error('No valid Airtable cookies. Please login first.');

  const url = `https://airtable.com/${baseId}/${tableId}/${rowId}`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
const parsedCookies = parseCookiesForPuppeteer(airtableCookies);
  console.log(`Navigating to ${url}`);
  await page.setCookie(...parsedCookies);
  console.log('Cookies set for page:', airtableCookies);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  const html = await page.content();
  console.log('Fetched HTML content from Airtable record');
  console.log('HTML length:', html);
  return html;
}

function parseRevisionHistory(html) {
  const $ = cheerio.load(html);
  const changelogs = [];

  $('.activity-row').each((i, el) => {
    const activityId = $(el).attr('data-activity-id');
    const ticketId = $(el).attr('data-ticket-id');
    const columnType = $(el).find('.activity-type').text().trim();
    const oldValue = $(el).find('.old-value').text().trim();
    const newValue = $(el).find('.new-value').text().trim();
    const createdDate = $(el).find('.activity-date').attr('datetime');
    const authoredBy = $(el).find('.user-id').text().trim();

    if (columnType.match(/status|assignee/i)) {
      changelogs.push({
        uuid: activityId,
        issueId: ticketId,
        columnType,
        oldValue,
        newValue,
        createdDate: createdDate ? new Date(createdDate) : null,
        authoredBy,
      });
    }
  });

  return changelogs;
}
module.exports = {
  loginAndGetCookies,
  checkCookiesValid,
  fetchRevisionHistoryWithPuppeteer,
  parseRevisionHistory,
}; 