const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const { User } = require('../models');
const EVENT = require('../triggers/custom-events').customEvent;
const collectionService = require('../services/collection.service');


async function helper(owner, symbol) {
  if (await collectionService.collectionExistsWithSymbol(owner, symbol)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Collection with symbol already exists');
  }
  let col1 = await collectionService.saveCollection({
    name: symbol,
    owner: owner,
    description: symbol,
    symbol: symbol
  });
  const data = await collectionService.getCollectionById(col1._id);
  EVENT.emit('add-collection-in-user', {
    collectionId: col1._id,
    userId: owner,
  });
}

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  let owner = user._id;
  await helper(owner, 'ART');
  await helper(owner, 'MUSIC');
  await helper(owner, 'VIDEO');
  await helper(owner, 'GIF');
  EVENT.emit('create-stats', {
    userId: user._id
  });
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { address } = req.body;
  const user = await authService.loginUserWithAddress(address);
  if (user) {
    await tokenService.removeToken(user);
    const tokens = await tokenService.generateAuthTokens(user);
    res.send({
      status: true,
      user,
      tokens,
    });
  } else {
    res.send({
      status: false,
      user: null,
      tokens: null,
      message: 'No user found',
    });
  }
});

const logout = catchAsync(async (req, res) => {
  await tokenService.removeToken(user);
  res.status(httpStatus.OK).send({
    status: true,
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  let dbUser = await userService.getUserByEmail(req.body.email);

  if (!dbUser) {
    return res.status(404).send({
      status: 404,
      message: 'User not found',
    });
  }

  await emailService.sendResetPasswordEmail(req.body.email, req.body.code);
  res.status(200).send({
    code: 200,
    message: 'Password reset email has been successfully sent to your email',
  });
});

const resetPassword = catchAsync(async (req, res) => {
  let dbUser = await userService.getUserByEmail(req.body.email);

  if (!dbUser) {
    return res.status(404).send({
      status: 404,
      message: 'User not found',
    });
  }

  await authService.resetPassword(req.body.email, req.body.password);
  res.status(httpStatus.OK).send({
    status: 200,
    message: 'Password changed successfully!',
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
