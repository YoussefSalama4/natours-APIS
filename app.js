const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const gloalErrorHandler = require('./controllers/errorController');

const app = express();
app.use(helmet());
app.use(express.static(`${__dirname}/public`));
// 1)Middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));
//Data sanitization against nosql query injection
app.use(mongoSanitize());
//Data sanitization against XSS attacks
app.use(xss());
//3) Routes
app.use((req, res, next) => {
  // console.log(req.headers);
  next();
});
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.all('*', (req, res, next) => {
  next(
    new AppError(
      `can't find ${req.originalUrl} on this server!`,
      404,
    ),
  );
});
app.use(gloalErrorHandler);
module.exports = app;
