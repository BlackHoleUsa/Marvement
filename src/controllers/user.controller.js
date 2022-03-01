const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const { uploadToAws } = require('../utils/helpers');
const { addFilesToIPFS, pinMetaDataToIPFS } = require('../utils/helpers');
const EVENT = require('../triggers/custom-events').customEvent;
const { NOTIFICATION_TYPE } = require('../utils/enums');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['userName', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (filter.userName)
    filter.userName = { $regex: filter.userName, $options: 'i' }
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send({ status: true, message: 'Successfull', user });
});

const getUserStatistics = catchAsync(async (req, res) => {
  const stats = await userService.getUserStats(req.params.userId);
  if (!stats) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Stats not found');
  }
  res.send({ status: true, message: 'Successfull', stats });
});

const updateUser = catchAsync(async (req, res) => {
  if (req.files.length > 0) {
    // let img = await uploadToAws(req.files[0].buffer, `${req.params.userId}/${req.params.userId}-profile-pic.png`);
    const img = await addFilesToIPFS(req.files[0].buffer, 'image');
    req.body.profilePic = img;
  }
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const followUser = catchAsync(async (req, res) => {
  const { otherUserId } = req.body;
  const { user } = req;
  if (otherUserId === user._id) {
    res.status(httpStatus.BAD_REQUEST).send({
      status: false,
      message: 'otherUserId is equal to UserId',
    });
  } else {
    await userService.followOtherUser(user._id, otherUserId);

    EVENT.emit('send-and-save-notification', {
      receiver: user._id,
      type: NOTIFICATION_TYPE.NEW_FOLLOWER,
      extraData: {
        follower: otherUserId,
      },
    });

    res.status(httpStatus.OK).send({
      status: true,
      message: 'user followed successfully',
    });
  }
});

const unfollowUser = catchAsync(async (req, res) => {
  const { otherUserId } = req.body;
  const user = req.user;

  await userService.unFollowUser(user._id, otherUserId);
  res.status(httpStatus.OK).send({
    status: true,
    message: 'user unfollowed successfully',
  });
});

const getUserFollowers = catchAsync(async (req, res) => {
  const { page, perPage, userId } = req.query;

  const followers = await userService.getUserFollowers(userId, page, perPage);
  res.status(httpStatus.OK).send({
    status: true,
    message: 'successfull',
    data: followers,
  });
});

const getUserFollowing = catchAsync(async (req, res) => {
  const { page, perPage, userId } = req.query;

  const following = await userService.getUserFollowing(userId, page, perPage);
  res.status(httpStatus.OK).send({
    status: true,
    message: 'successfull',
    data: following,
  });
});
const getAllUsers = catchAsync(async (req, res) => {
  const { page, perPage } = req.query;
  const users = await userService.getAllUsers(page, perPage);
  res.status(httpStatus.OK).send({
    status: true,
    message: 'successfull',
    data: users,
  });
});
const setPlatformFee = catchAsync(async (req, res) => {
  const { address } = req.query;
  // eslint-disable-next-line radix
  const platFormFee = parseInt(req.body.platFormFee);
  const response = await userService.setPlatformFee(address, platFormFee);
  res.status(httpStatus.CREATED).send(response);
});
const setRoyality = catchAsync(async (req, res) => {
  const { address } = req.query;
  // eslint-disable-next-line radix
  const royality = parseInt(req.body.royality);
  const response = await userService.setRoyality(address, royality);
  res.status(httpStatus.CREATED).send(response);
});

const getRoyality = catchAsync(async (req, res) => {
  const { address } = req.query;
  const response = await userService.getRoyality(address);
  res.status(httpStatus.OK).send(response);
});

const getPlatformFee = catchAsync(async (req, res) => {
  const { address } = req.query;
  const response = await userService.getPlatformFee(address);
  res.status(httpStatus.OK).send(response);
});
module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  followUser,
  unfollowUser,
  getUserFollowing,
  getUserFollowers,
  getUserStatistics,
  getAllUsers,
  setPlatformFee,
  getPlatformFee,
  setRoyality,
  getRoyality,
};
