const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1) create a transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: ' sumcap101@gmail.com',
      pass: 'ulks arji cbqv hvzh',
    },
  });

  //2)Define email options
  const mailOptions = {
    from: 'Youssef Salama',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  //3)Actually send the email with nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
