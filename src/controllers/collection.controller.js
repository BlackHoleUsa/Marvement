const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService, collectionService, artworkService } = require('../services');
const { User } = require('../models');
const helpers = require('../utils/helpers');
const EVENT = require('../triggers/custom-events').customEvent;
const ApiError = require('../utils/ApiError');

const createCollection = catchAsync(async (req, res) => {
  const { owner, name, symbol } = req.body;
  const files = req.files;
  if (await collectionService.collectionExistsWithSymbol(owner, symbol)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Collection with symbol already exists');
  }
  console.log(req.body);
  let col = await collectionService.saveCollection(req.body);
  let cover, profile;
  if (files.length > 0) {
    for (let file of files) {
      if (file.fieldname == 'profileImage') {
        profile = await helpers.uploadToAws(file.buffer, `/collections/${col._id}/profile`);
      } else if (file.fieldname == 'coverImage') {
        cover = await helpers.uploadToAws(file.buffer, `/collections/${col._id}/cover`);
      }
    }
    col = await collectionService.updateCollectionImages(col._id, profile.Location, cover.Location);
  }
  const data = await collectionService.getCollectionById(col._id);
  EVENT.emit('add-collection-in-user', {
    collectionId: col._id,
    userId: owner,
  });
  res.status(httpStatus.OK).send({ status: true, message: 'collection created successfully', data });
});

const getUserCollections = catchAsync(async (req, res) => {
  const { userId, page, perPage } = req.query;

  const data = await collectionService.getPaginatedCollections(page, perPage, userId);
  res.status(httpStatus.OK).send({ status: true, message: 'successfull', page, data });
});

const getAllUserCollection = catchAsync(async (req, res) => {
  const { userId } = req.query;
  const data = await collectionService.getCollectionsByUserId(userId);
  res.status(httpStatus.OK).send({ status: true, message: 'successfull', data });
});

const getCollectionDetails = catchAsync(async (req, res) => {
  const { collectionId } = req.query;
  const data = await collectionService.getPopulatedCollection(req.user._id, collectionId);
  res.status(httpStatus.OK).send({ status: true, message: 'successfull', data });
});

const updateCollection = catchAsync(async (req, res) => {
  const files = req.files;
  let body = req.body;
  const { collectionId } = body;
  let profile, cover;
  if (files.length > 0) {
    for (let file of files) {
      if (file.fieldname == 'profileImage') {
        await helpers.deleteFromAWS(`/collections/${collectionId}/profile`);
        profile = await helpers.uploadToAws(file.buffer, `/collections/${collectionId}/profile`);
        body.profileImage = profile.Location;
      } else if (file.fieldname == 'coverImage') {
        await helpers.deleteFromAWS(`/collections/${collectionId}/cover`);
        cover = await helpers.uploadToAws(file.buffer, `/collections/${collectionId}/cover`);
        body.coverImage = cover.Location;
      }
    }
  }
  const collection = await collectionService.updateCollectioById(collectionId, body);
  res.send({ status: true, message: 'collection updated successfully', collection });
});

const deleteCollection = catchAsync(async (req, res) => {
  const { user } = req;
  const { collectionId } = req.body;

  await collectionService.deleteCollectionById(collectionId);
  await artworkService.deleteArtworksByCollection(collectionId);
  await userService.removeCollection(collectionId, user._id);
  res.send({ status: true, message: 'collection deleted successfully' });
});

const getAllCollections = catchAsync(async (req, res) => {
  const collections = await collectionService.getAllCollections();

  res.send({ status: true, message: 'successfull', data: collections });
});

module.exports = {
  createCollection,
  getUserCollections,
  getCollectionDetails,
  updateCollection,
  getAllUserCollection,
  deleteCollection,
  getAllCollections,
};
