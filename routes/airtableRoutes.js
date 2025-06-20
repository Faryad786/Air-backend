const express = require('express');
const router = express.Router();
const airtableController = require('../controllers/airtableController');

router.get('/bases', airtableController.getBases);
router.get('/bases/:baseId/tables', airtableController.getTables);
router.get('/bases/:baseId/tables/:tableId/pages', airtableController.getAndStorePages);
router.get('/users', airtableController.getUsers);
router.get('/auth-url', airtableController.getAuthUrl);
router.get('/oauth/callback', airtableController.handleOAuthCallback);

module.exports = router; 