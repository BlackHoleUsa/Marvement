const httpStatus = require('http-status');
const web3 = require('web3');
const { userService } = require('.');
const { User, Stats } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (!(await web3.utils.isAddress(userBody.address))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'address is not valid');
  } else if (await User.isAddressTaken(userBody.address)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'address already taken');
  } else if (await User.isUsernameTaken(userBody.userName)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'userName already taken');
  }
  const usr = await User.create(userBody);
  return usr.toObject();
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id).lean();
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email }).lean();
};

const getUserByAddress = async (address) => {
  return User.findOne({ address }).lean();
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await User.findByIdAndUpdate(userId, updateBody, {
    new: true,
  }).lean();

  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} artworkId
 * @returns {Promise<User>}
 */
const addArtworkToFavourites = async (userId, artworkId) => {
  return await User.findOneAndUpdate({ _id: userId }, { $push: { favouriteArtworks: artworkId } }).lean();
};

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} artworkId
 * @returns {Promise<User>}
 */
const removeArtworkFromFavourite = async (userId, artworkId) => {
  return await User.findOneAndUpdate({ _id: userId }, { $pull: { favouriteArtworks: artworkId } }).lean();
};

/**
 *
 * @param {ObjectId} userId
 * @param {number} page
 * @param {number} perPage
 */

const getFavouriteArtworks = async (userId, page, perPage) => {
  const user = await User.findOne({ _id: userId })
    .select(['favouriteArtworks'])
    .populate({
      path: 'favouriteArtworks',
      populate: [
        {
          path: 'owner',
          model: 'User',
        },
        {
          path: 'creater',
          model: 'User',
        },
        {
          path: 'sale',
          model: 'BuySell',
        },
        {
          path: 'auction',
          model: 'Auction',
        },
      ],
    })
    .limit(parseInt(perPage))
    .skip(page * perPage)
    .lean();

  return user ? user.favouriteArtworks : [];
};

const followOtherUser = async (userId, otherUserId) => {
  await User.findOneAndUpdate({ _id: otherUserId }, { $push: { followers: userId } }, { new: true });
  return await User.findOneAndUpdate({ _id: userId }, { $push: { following: otherUserId } }, { new: true }).lean();
};

const unFollowUser = async (userId, otherUserId) => {
  await User.findOneAndUpdate({ _id: otherUserId }, { $pull: { followers: userId } }, { new: true });
  return await User.findOneAndUpdate({ _id: userId }, { $pull: { following: otherUserId } }, { new: true }).lean();
};

const getUserFollowers = async (userId, page, perPage) => {
  const user = await User.findOne({ _id: userId })
    .populate({
      path: 'followers',
      options: {
        limit: parseInt(perPage),
        skip: page * perPage,
      },
    })
    .lean();
  return user.followers;
};

const getUserFollowing = async (userId, page, perPage) => {
  const user = await User.findOne({ _id: userId })
    .populate({
      path: 'following',
      options: {
        limit: parseInt(perPage),
        skip: page * perPage,
      },
    })
    .lean();
  return user.following;
};

const removeArtwork = async (userId, artworkId) => {
  await User.findOneAndUpdate({ _id: userId }, { $pull: { artworks: artworkId } });
};

const searchUsersByName = async (keyword, page, perPage) => {
  return await User.find({ userName: { $regex: keyword, $options: 'i' } })
    .populate('collections')
    .populate('artworks')
    .limit(parseInt(perPage))
    .skip(page * perPage);
};

const getUsersByMostArtworks = async () => {
  let data = await Stats.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $match: {
        $and: [
          {
            'user.role': 'artist',
          },
          {
            soldArts: { $gt: 0 },
          },
        ],
      },
    },
    {
      $sort: {
        soldArts: -1,
      },
    },
    {
      $unwind: '$user',
    },
  ]).limit(5);

  for (let i = 0; i < data.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    const updatedUser = await User.findOne(data[i].user._id).populate('artworks');
    data[i].user = updatedUser;
  }
  return data;
};

const fetchLeadingCollectors = async () => {
  return await Stats.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $match: {
        purchasedArts: { $gt: 0 },
      },
    },
    {
      $sort: {
        purchasedArts: -1,
      },
    },
    {
      $unwind: '$user',
    },
  ]).limit(5);
};

const getUserStats = async (userId) => {
  return await Stats.findOne({ user: userId }).lean();
};

const getSingleFavouriteArtWork = async (userId) => {
  const result = await User.findOne({ _id: userId });
  return result;
};
const getAllUsers = async (page, perPage) => {
  const users = await User.find({})
    .sort({ _id: -1 })
    .limit(parseInt(perPage))
    .skip(page * perPage);
  console.log(users);
  return users;
};
const removeCollection = async (collectionId, userId) => {
  const response = User.findOneAndUpdate({ _id: userId }, { $pull: { collections: collectionId } });
  return response;
};
const searchUsersByNameTotal = async (keyword, page, perPage) => {
  return await User.find({ userName: { $regex: keyword, $options: 'i' } }).countDocuments();
};
const getAllUsersCount = async () => {
  return await User.find().countDocuments();
};
const removeOwnedArtworks = async (userId) => {
  // eslint-disable-next-line no-return-await
  return await Stats.findOneAndUpdate({ user: userId }, { $inc: { ownedArts: -1 } });
};
module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  getUserByAddress,
  addArtworkToFavourites,
  removeArtworkFromFavourite,
  getFavouriteArtworks,
  followOtherUser,
  unFollowUser,
  getUserFollowers,
  getUserFollowing,
  removeArtwork,
  searchUsersByName,
  getUsersByMostArtworks,
  fetchLeadingCollectors,
  getUserStats,
  getSingleFavouriteArtWork,
  getAllUsers,
  removeCollection,
  searchUsersByNameTotal,
  getAllUsersCount,
  removeOwnedArtworks,
};
