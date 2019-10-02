require('newrelic');
const sslRedirect = require('heroku-ssl-redirect');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const keys = require('./config/keys');
const errorHandler = require('./middlewares/errorHandler');

require('./models/User'); // Used in match routes, etc.
require('./models/Match'); // Used in match routes, etc.
require('./models/Ping'); // Used in ping routes, etc.

mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useFindAndModify: false
});

const app = express();

// enable ssl redirect
app.use(sslRedirect());

//app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

require('./routes/matchRoutes')(app);
require('./routes/pingRoutes')(app);

app.use(errorHandler); // Custom default, i.e., catch-all, error handler middleware

if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.resolve(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;
app.listen(PORT);
