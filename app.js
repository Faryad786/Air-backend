const express = require('express');
const session = require('express-session');
const airtableRoutes = require('./routes/airtableRoutes');

const app = express();

app.use(express.json());
app.use(session({
  secret: 'your_dev_secret',
  resave: false,
  saveUninitialized: true,
}));
app.use('/api/airtable', airtableRoutes);

module.exports = app;
