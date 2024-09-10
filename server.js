const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

//Use your own DB configurations here
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB Connected successfully');
  })
  .catch((err) => console.log(err.message));

const port = 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// process.on('unhandledRejection', (err) => {
//   console.log('unhandled REJECTION');
//   console.log(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });
