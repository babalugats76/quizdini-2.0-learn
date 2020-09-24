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

const memcache = require("./services/memcache")(keys);

mongoose.connect(keys.mongoURI, {
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  poolSize: 10,
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

// enable ssl redirect
app.use(sslRedirect());

/*var corsOptions = {
  origin: 'http://example.com',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}*/

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

require('./routes/matchRoutes')(app, memcache);
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
