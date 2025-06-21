const scraper = require('../services/airtableScraperService');
const { loginAndGetCookies } = require('../services/airtableScraperService');
const cheerio = require('cheerio');


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cookies = await loginAndGetCookies({ email, password });
    res.json({ success: true, cookies });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.checkCookies = async (req, res) => {
  try {
    const valid = await scraper.checkCookiesValid();
    res.json({ valid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRevisionHistory = async (req, res) => {
  try {
    const html = await scraper.fetchRevisionHistoryWithPuppeteer(req.body);
    const changelogs = scraper.parseRevisionHistory(html);
    res.json({ changelogs });
  } catch (err) {
    console.error('❌ Error in getRevisionHistory:', err);
    res.status(400).json({ error: err.message });
  }
};