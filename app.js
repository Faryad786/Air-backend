const express = require('express');
const session = require('express-session');
const airtableRoutes = require('./routes/airtableRoutes');
const authToken = require('./middlewares/authToken');

const app = express();

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, 
}));
app.use(authToken);
app.use('/api/airtable', airtableRoutes);

module.exports = app;
