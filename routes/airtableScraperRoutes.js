const express = require('express');
const router = express.Router();
const controller = require('../controllers/airtableScraperController');

router.post('/login', controller.login);
router.get('/check-cookies', controller.checkCookies);
router.post('/revision-history', controller.getRevisionHistory);

module.exports = router; 