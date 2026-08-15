const dotenv = require('dotenv');
const { createApp } = require('./app');

dotenv.config();

const port = process.env.PORT || 5000;
const app = createApp();

app.listen(port, () => {
  console.log(`Camtel Pulse API listening on port ${port}`);
});
