const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const { fileParser } = require('express-multipart-file-parser');
require('./config/aws.config');
require('./triggers/triggers');
require('./triggers/contract.triggers');
require('./triggers/cron-job')();
// require('./triggers/cron-job');
const EVENT = require('./triggers/custom-events').customEvent;
const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

app.use(express.urlencoded());

app.use(
  fileParser({
    rawBodyOptions: {
      limit: '30mb', //file size limit
    },
    busboyOptions: {
      limits: {
        fields: 50, //Number text fields allowed
      },
    },
  })
);

app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());
// Add headers before the routes are defined
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});
// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

EVENT.emit('add-price-counter');
module.exports = app;
