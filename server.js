const express = require('express');
const routes = require('./routes/index.js');

const app = express();
const port = 5000;

app.use(routes);
app.listen(port, () => {
  console.log(`The server is running`);
});

module.exports = app;
