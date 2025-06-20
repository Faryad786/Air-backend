require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/mongo');

const PORT = process.env.PORT || 3000;

console.log(`Connecting to MongoDB at ${process.env.MONGO_URI}`);
console.log(`welcome to the Airtable API Proxy!`);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
});
