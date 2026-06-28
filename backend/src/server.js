require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const scheduler = require('./scheduler');

const PORT = process.env.PORT || 3000;

connectDB();
scheduler.start();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
