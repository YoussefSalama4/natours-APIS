const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, status, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        process.env.JWT_COOKIE_EXPIRES_IN *
          1000 *
          60 *
          60 *
          24,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(status).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1)check if email and password exists
  if (!email || !password) {
    return next(
      new AppError(
        'Please, provide email and password!',
        400,
      ),
    );
  }
  //2)Check if user exists and password is correct
  const user = await User.findOne({ email }).select(
    '+password',
  );

  if (
    !user ||
    !(await user.correctPassword(password, user.password))
  ) {
    return next(
      new AppError('Incorrect email or password', 401),
    );
  }
  //3)check if everything is ok, send token to client
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) getting to token and chek if its'there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError(
        'You are not logged in! please log in to get access.',
        401,
      ),
    );
  }
  //2) verification token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );
  //3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user no longer exist', 401),
    );
  }
  //4) check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed password! Please log in again',
        401,
      ),
    );
  }
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "you don't have permission to perform this action",
          403,
        ),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(
  async (req, res, next) => {
    //Get user based on posted email
    const user = await User.findOne({
      email: req.body.email,
    });
    if (!user) {
      return next(
        new AppError(
          'no user found with this email address',
          404,
        ),
      );
    }
    //generate random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    //send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? submit a patch request with your new password and passwordConfirm to ${resetURL}.\n if you didn't ignore this email`;
    try {
      await sendEmail({
        email: user.email,
        subject: `Your password reset token (valid for 10 mins)`,
        message,
      });
      res.status(200).json({
        status: 'success',
        message: 'token sent to email',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          'There was an error sending email. try again later',
          500,
        ),
      );
    }
  },
);
exports.resetPassword = catchAsync(
  async (req, res, next) => {
    //1) Get the user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    //2)set the new password if the user exists and token not expired
    if (!user) {
      return next(
        new AppError(
          'Token is invalid or has expirted',
          400,
        ),
      );
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    //3)update changedPasswordAt property
    //4) log the user in
    // const token = signToken(user._id);
    // res.status(200).json({
    //   status: 'success',
    //   token,
    // });
    createSendToken(user, 200, res);
  },
);

exports.updatePassword = catchAsync(
  async (req, res, next) => {
    const user = await User.findOne({
      email: req.user.email,
    }).select('+password');

    if (
      await user.correctPassword(
        req.body.oldPassword,
        user.password,
      )
    ) {
      user.password = req.body.password;
      user.passwordConfirm = req.body.passwordConfirm;
      await user.save();
    } else {
      return next(
        new AppError('old Password is incorrect', 401),
      );
    }

    // const token = signToken(user._id);
    // res.status(200).json({
    //   status: 'success',
    //   token,
    // });
    createSendToken(user, 200, res);
  },
);
