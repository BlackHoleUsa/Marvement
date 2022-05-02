const { userService, musicAlbumService, artworkService, collectionService, historyService, notificationService } = require('../services');
const EVENT = require('../triggers/custom-events').customEvent;
const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const { SEARCH_FILTERS } = require('../utils/enums');
const { addFilesToIPFS, pinMetaDataToIPFS } = require('../utils/helpers');
var jwt = require("jsonwebtoken");

const createPost = catchAsync(async (req, res) => {

  if (req.files.length > 0) {
    const img = await addFilesToIPFS(req.files[0].buffer, 'image');
    req.body.image_url = img;
  }

  const album = await musicAlbumService.createPost(req.body);
  res.status(httpStatus.OK).send({ status: true, message: 'ALbum created successfully', album });

});

const approvePost = catchAsync(async (req, res) => {
  const album = await musicAlbumService.approvePost(req.body.id);
  res.status(httpStatus.OK).send({ status: true, message: 'ALbum approved successfully', album });
});

const getAllApprovePosts = catchAsync(async (req, res) => {
  const posts = await musicAlbumService.getAllApprovePosts();
  res.status(httpStatus.OK).send({ status: true, message: 'ALbums found successfully', posts });
});

const getAllUnApprovePosts = catchAsync(async (req, res) => {
  const posts = await musicAlbumService.getAllUnApprovedPost();
  res.status(httpStatus.OK).send({ status: true, message: 'ALbums found successfully', posts });
});


const rejectPost = catchAsync(async (req, res) => {
  const album = await musicAlbumService.rejectPost(req.body.id, req.body.note);
  res.status(httpStatus.OK).send({ status: true, message: 'ALbum rejected successfully', album });
});

const getAllRejectPosts = catchAsync(async (req, res) => {
  const posts = await musicAlbumService.getAllRejectPosts();
  res.status(httpStatus.OK).send({ status: true, message: 'ALbums found successfully', posts });
});



module.exports = {
  createPost,
  approvePost,
  getAllApprovePosts,
  getAllUnApprovePosts,
  rejectPost,
  getAllRejectPosts

};

