const { userService, musicAlbumService, artworkService, collectionService, historyService, notificationService } = require('../services');
const EVENT = require('../triggers/custom-events').customEvent;
const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const { SEARCH_FILTERS } = require('../utils/enums');
const { addFilesToIPFS, pinMetaDataToIPFS } = require('../utils/helpers');
var jwt = require("jsonwebtoken");

const createAlbum = catchAsync(async (req, res) => {
  const { user } = req;
  const getUser = await userService.getUserById(user._id);
  if (getUser) {

    if (req.files.length > 0) {
      const img = await addFilesToIPFS(req.files[0].buffer, 'image');
      req.body.coverImage = img;
    }

    const album = await musicAlbumService.createAlbum(req.body);
    // Add the album to the user's album collection
    EVENT.emit('add-Album-In-User', {
      userId: user._id,
      albumId: album._id,
    });
    res.status(httpStatus.OK).send({ status: true, message: 'ALbum created successfully', album });
  } else {
    res.status(httpStatus.BAD_REQUEST).send({ status: false, message: 'User not found' });
  }
});

const getSingleAlbum = catchAsync(async (req, res) => {
  const { albumId } = req.query;
  const album = await musicAlbumService.getSingleAlbum(albumId);
  res.status(httpStatus.OK).send({ status: true, message: 'ALbum fetched successfully', album });
});

const getUserAlbum = catchAsync(async (req, res) => {
  const { user } = req;
  const getUser = await userService.getUserById(user._id);
  if (getUser) {
    const albums = await musicAlbumService.getUserAlbums(user._id);
    res.status(httpStatus.OK).send({ status: true, message: 'ALbum created successfully', albums: albums });
  } else {
    res.status(httpStatus.BAD_REQUEST).send({ status: false, message: 'User not found' });
  }
});

const updateAlbum = catchAsync(async (req, res) => {
  const { albumId } = req.query;
  const { user } = req;
  const getUser = await userService.getUserById(user._id);
  if (getUser) {

    if (req.files.length > 0) {
      const img = await addFilesToIPFS(req.files[0].buffer, 'image');
      req.body.coverImage = img;
    }
    const album = await musicAlbumService.updateAlbum(albumId, req.body);
    res.status(httpStatus.OK).send({ status: true, message: 'ALbum updated successfully', album });
  } else {
    res.status(httpStatus.BAD_REQUEST).send({ status: false, message: 'User not found' });
  }
});

const getArtworksFromAlbum = catchAsync(async (req, res) => {
  const { albumId } = req.query;
  const artworks = await musicAlbumService.getArtworksFromAlbum(albumId);
  res.status(httpStatus.OK).send({ status: true, message: 'Artworks fetched successfully', artworks });
});



module.exports = {
  createAlbum,
  getSingleAlbum,
  getUserAlbum,
  updateAlbum,
  getArtworksFromAlbum,
};

