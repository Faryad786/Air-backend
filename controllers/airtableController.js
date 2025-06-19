const airtableService = require('../services/airtableService');

exports.getBases = async (req, res) => {
  try {
    const data = await airtableService.fetchBases();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTables = async (req, res) => {
  try {
    const { baseId } = req.params;
    const data = await airtableService.fetchTables(baseId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAndStorePages = async (req, res) => {
  try {
    const { baseId, tableId } = req.params;
    const records = await airtableService.fetchAndStorePages(baseId, tableId);
    res.json({ count: records.length, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const data = await airtableService.fetchUsers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.oauthRedirect = (req, res) => {
  const url = airtableService.getAuthUrl();
  res.redirect(url);
};

exports.oauthCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');
  try {
    const tokenData = await airtableService.exchangeCodeForToken(code);
    // Store token in session (or DB for production)
    req.session.airtableToken = tokenData.access_token;
    airtableService.setAccessToken(tokenData.access_token);
    res.send('Airtable authentication successful! You can now use the API.');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 