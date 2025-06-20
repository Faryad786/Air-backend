const axios = require('axios');
const Page = require('../models/page');
const querystring = require('querystring');
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto');

let accessToken = '';

const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0';
const AIRTABLE_AUTH_URL = 'https://airtable.com/oauth2/v1/authorize';
const AIRTABLE_TOKEN_URL = 'https://airtable.com/oauth2/v1/token';

const getAuthHeaders = (accessToken) => ({
  "Authorization": `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

async function fetchBases(accessToken) {
  const url = `${AIRTABLE_BASE_URL}/meta/bases`;
  const res = await axios.get(url, { headers: getAuthHeaders(accessToken) });
  return res.data;
}

async function fetchTables(baseId, accessToken) {
  const url = `${AIRTABLE_BASE_URL}/meta/bases/${baseId}/tables`;
  const res = await axios.get(url, { headers: getAuthHeaders(accessToken) });
  return res.data;
}

async function fetchAndStorePages(baseId, tableId, accessToken) {
  let url = `${AIRTABLE_BASE_URL}/${baseId}/${tableId}`;
  let allRecords = [];
  let offset = null;
  do {
    const params = offset ? { offset } : {};
    const res = await axios.get(url, { headers: getAuthHeaders(accessToken), params });
    const records = res.data.records;
    allRecords = allRecords.concat(records);
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



const codeVerifiers = {};
console.log("🔐 Code Verifiers initialized.",codeVerifiers);
const getCodeVerifier = (state) => {
  const verifier = codeVerifiers[state];
  if (!verifier) throw new Error("Invalid or expired state.");
  return verifier;
};

function generateCodeVerifier() {
  const random = crypto.randomBytes(64).toString("base64"); 
  return random
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, ""); 
}

function generateCodeChallenge(verifier) {
  const hash = crypto.createHash("sha256").update(verifier).digest("base64");
  return hash
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function storeCodeVerifier(state, code_verifier) {
  codeVerifiers[state] = code_verifier;
}

async function getAuthUrl() {
  const state = crypto.randomBytes(16).toString("hex");
  const code_verifier = generateCodeVerifier();
  const code_challenge = generateCodeChallenge(code_verifier);

  storeCodeVerifier(state, code_verifier);

  const scopes = [
    "data.records:read",
    "data.records:write",
    "data.recordComments:read",
    "data.recordComments:write",
    "schema.bases:read",
    "schema.bases:write",
    "user.email:read",
    "webhook:manage",
  ];

  const query = querystring.stringify({
    client_id: process.env.AIRTABLE_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
    scope: scopes.join(" "),
    state,
    code_challenge,
    code_challenge_method: "S256",
  });

  const authUrl = `https://airtable.com/oauth2/v1/authorize?${query}`;
  console.log("🔗 Auth URL:", authUrl);
  return  authUrl;
}

async function exchangeCodeForToken(code, state) {
  if (!code || !state) throw new Error("Missing code or state");

  const code_verifier = getCodeVerifier(state);
  if (!code_verifier) throw new Error("Invalid or expired state.");

  const hasClientSecret = !!process.env.AIRTABLE_CLIENT_SECRET;

  const authHeader = hasClientSecret
    ? "Basic " +
      Buffer.from(
        `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
      ).toString("base64")
    : undefined;

  const data = querystring.stringify({
    grant_type: "authorization_code",
    code,
    client_id: process.env.AIRTABLE_CLIENT_ID, 
    redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
    code_verifier,
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (hasClientSecret) {
    headers["Authorization"] = authHeader;
  }

  try {
    const res = await axios.post("https://airtable.com/oauth2/v1/token", data, {
      headers,
    });

    return res.data;
  } catch (err) {
    if (err.response) {
      throw new Error(
        `Token exchange failed: ${err.response.status} - ${JSON.stringify(err.response.data)}`
      );
    } else {
      throw new Error(`Unexpected error: ${err.message}`);
    }
  }
}

async function fetchUsers(accessToken) {
  const url = 'https://api.airtable.com/v1/meta/whoami';
  const res = await axios.get(url, { headers: getAuthHeaders(accessToken) });
  return res.data;
}

module.exports = {
  fetchBases,
  fetchTables,
  fetchAndStorePages,
  fetchUsers,
  getAuthUrl,
  exchangeCodeForToken,
}; 