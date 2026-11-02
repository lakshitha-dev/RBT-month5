const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  // log unexpected server errors
  if (!err.statusCode || err.statusCode >= 500) {
    logger.error(err.message, { requestId: req.id, path: req.originalUrl, stack: err.stack });
  }

  const status  = err.statusCode || 500;
  const code    = err.code      || 'INTERNAL_ERROR';
  const message = err.message   || 'Something went wrong';

  const body = { success: false, error: { code, message } };
  if (err.details) body.error.details = err.details;

  res.status(status).json(body);
};
