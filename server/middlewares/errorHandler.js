const HttpStatus = require('http-status-codes');

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = err.message || HttpStatus.getStatusText(statusCode) || '';
  const code = err.code || undefined;
  res.status(statusCode).send({ statusCode, message, code });
  next(err);
};