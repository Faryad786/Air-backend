const express = require('express');
const router = express.Router();
const airtableController = require('../controllers/airtableController');

router.get('/bases', airtableController.getBases);
router.get('/bases/:baseId/tables', airtableController.getTables);
router.get('/bases/:baseId/tables/:tableId/pages', airtableController.getAndStorePages);
router.get('/users', airtableController.getUsers);
router.get('/oauth/redirect', airtableController.oauthRedirect);
router.get('/oauth/callback', airtableController.oauthCallback);

module.exports = router; 