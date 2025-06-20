const airtableService = require('../services/airtableService');
const jwt = require('jsonwebtoken'); // npm install jsonwebtoken

// In-memory token mapping (for demo; use DB/Redis in production)
const tokenMap = {};
exports.getBases = async (req, res) => {
  const accessToken = req.accessToken;
  if (!accessToken) return res.status(401).json({ error: 'Not authenticated with Airtable' });
  try {
    const data = await airtableService.fetchBases(accessToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTables = async (req, res) => {
  const accessToken = req.accessToken;
  if (!accessToken) return res.status(401).json({ error: 'Not authenticated with Airtable' });
  try {
    const { baseId } = req.params;
    const data = await airtableService.fetchTables(baseId, accessToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAndStorePages = async (req, res) => {
  const accessToken = req.accessToken;
  if (!accessToken) return res.status(401).json({ error: 'Not authenticated with Airtable' });
  try {
    const { baseId, tableId } = req.params;
    const records = await airtableService.fetchAndStorePages(baseId, tableId, accessToken);
    res.json({ count: records.length, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  const accessToken = req.accessToken;
  if (!accessToken) return res.status(401).json({ error: 'Not authenticated with Airtable' });
  try {
    const data = await airtableService.fetchUsers(accessToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAuthUrl = async (req, res) => {
  try {
    const url = await airtableService.getAuthUrl();
    res.redirect(url);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handleOAuthCallback = async (req, res) => {
  const { code, state} = req.query;
  if (!code || !state) return res.status(400).send("Missing code or state");

  try {
    const tokenData = await airtableService.exchangeCodeForToken(code, state);
    const myToken = jwt.sign(
      { type: "airtable", time: Date.now() },
      process.env.JWT_SECRET || "23456srtuilkjhgfdfghkl",
      { expiresIn: "1h" }
    );
    tokenMap[myToken] = tokenData;
    res.json({ token: myToken, access: tokenData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
