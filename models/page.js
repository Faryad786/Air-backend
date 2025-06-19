const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  baseId: { type: String, required: true },
  tableId: { type: String, required: true },
  recordId: { type: String, required: true },
  data: { type: Object, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Page', pageSchema); 