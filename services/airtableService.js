const axios = require('axios');
const Page = require('../models/page');
const querystring = require('querystring');
// Airtable API service for fetching bases, tables, and records

const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0';
const AIRTABLE_AUTH_URL = 'https://airtable.com/oauth2/v1/authorize';
const AIRTABLE_TOKEN_URL = 'https://airtable.com/oauth2/v1/token';

let accessToken ='patcCAUhUpNEIXlAA.d4c2770381dd364b1747fac8ed4a31f2ce5969d044391df2d3e6ab8030c283de';

const setAccessToken = (token) => {
  accessToken = token;
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

async function fetchBases() {
  const url = `${AIRTABLE_BASE_URL}/meta/bases`;
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

async function fetchTables(baseId) {
  const url = `${AIRTABLE_BASE_URL}/meta/bases/${baseId}/tables`;
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

async function fetchAndStorePages(baseId, tableId) {
  let url = `${AIRTABLE_BASE_URL}/${baseId}/${tableId}`;
  let allRecords = [];
  let offset = null;
  do {
    const params = offset ? { offset } : {};
    const res = await axios.get(url, { headers: getAuthHeaders(), params });
    const records = res.data.records;
    allRecords = allRecords.concat(records);
    // Store each record in MongoDB
    for (const record of records) {
      await Page.findOneAndUpdate(
        { baseId, tableId, recordId: record.id },
        { data: record },
        { upsert: true, new: true }
      );
    }
    offset = res.data.offset;
  } while (offset);
  return allRecords;
}

async function fetchUsers() {
  const url = 'https://api.airtable.com/v1/meta/whoami';
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

function getAuthUrl() {
  const params = querystring.stringify({
    client_id: process.env.AIRTABLE_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
    scope: 'data.records:read data.records:write schema.bases:read user.email:read',
    state: 'random_state_string',
  });
  return `${AIRTABLE_AUTH_URL}?${params}`;
}

async function exchangeCodeForToken(code) {
  const data = querystring.stringify({
    grant_type: 'authorization_code',
    code,
    client_id: process.env.AIRTABLE_CLIENT_ID,
    client_secret: process.env.AIRTABLE_CLIENT_SECRET,
    redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
  });
  const res = await axios.post(AIRTABLE_TOKEN_URL, data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
}

module.exports = {
  setAccessToken,
  fetchBases,
  fetchTables,
  fetchAndStorePages,
  fetchUsers,
  getAuthUrl,
  exchangeCodeForToken,
}; 