const { userService, artworkService, collectionService, historyService, notificationService } = require('../services');
const EVENT = require('../triggers/custom-events').customEvent;
const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const { SEARCH_FILTERS } = require('../utils/enums');

const handleSearch = catchAsync(async (req, res) => {
  const { keyword, filter, page, perPage } = req.query;

  if (keyword) {
    const users = await userService.searchUsersByName(keyword, page, perPage);
    let usersCount = await userService.searchUsersByNameTotal(keyword);
    const artworks = await artworkService.searchArtworkByName(keyword, page, perPage);
    let artworksCount = await artworkService.searchArtworkByNameTotal(keyword);
    let musicArtwork = await artworkService.searchArtworkByMusic(keyword, page, perPage);
    let videoArtwork = await artworkService.searchArtworkByVideo(keyword, page, perPage);

    let count = 0;
    let data = {};

    switch (filter) {
      case SEARCH_FILTERS.USERS:
        data.users = users;
        count = usersCount;
        break;

      case SEARCH_FILTERS.ARTWORKS:
        data.artworks = artworks;
        count = artworksCount;
        break;

      case SEARCH_FILTERS.AUDIO:
        data.artworks = musicArtwork;
        count = musicArtwork.length;
        break;

      case SEARCH_FILTERS.VIDEOS:
        data.artworks = videoArtwork;
        count = videoArtwork.length;
        break;


      default:
        data = {
          users,
          artworks,
        };
    }

    res.status(httpStatus.OK).send({
      status: true,
      message: 'Successfull',
      page,
      data,
      count,
    });
  } else {
    let users;
    let data = {};
    let artworks;
    let collections;
    let count;
    switch (filter) {
      case SEARCH_FILTERS.USERS:
        users = await userService.getAllUsers(page, perPage);
        data.users = users;
        count = await userService.getAllUsersCount();
        break;

      case SEARCH_FILTERS.ARTWORKS:
        artworks = await artworkService.getAllArtwork(page, perPage);
        data.artworks = artworks;
        count = await artworkService.getAllArtworksCount1();
        break;

      case SEARCH_FILTERS.COLLECTIONS:
        collections = await collectionService.getAllCollectionsperPage(page, perPage);
        data.collections = collections;
        count = await collectionService.getAllCollectionsCount();
        break;

      case SEARCH_FILTERS.AUDIO:
        artworks = await artworkService.getAllArtworkOfMusic(page, perPage);
        data.artwork = artworks;
        count = await artworkService.getCountOfArtworkOfMusic();
        break;

      case SEARCH_FILTERS.VIDEOS:
        artworks = await artworkService.getAllArtworkOfVideo(page, perPage);
        data.artwork = artworks;
        count = await artworkService.getCountOfArtworkOfVideo();
        break;

      default:
        data = {
          users,
          artworks,
          collections,
        };
    }
    res.status(httpStatus.OK).send({
      status: true,
      message: 'Successfull',
      data,
      count,
    });
  }
});

const getAppActivity = catchAsync(async (req, res) => {
  const { page, perPage } = req.query;

  const histories = await artworkService.getAllArtworksPaginated(page, perPage);
  console.log(histories);
  res.status(httpStatus.OK).send({
    status: true,
    message: 'Successfull',
    data: histories,
  });
});

const getNotifications = catchAsync(async (req, res) => {
  const user = req.user;
  const { page, perPage } = req.query;

  const notifications = await notificationService.getUserNotifications(user._id, page, perPage);
  res.status(httpStatus.OK).send({
    status: true,
    message: 'Successfull',
    page,
    data: notifications,
  });
});

const getTransactions = catchAsync(async (req, res) => {
  const user = req.user;
  const { page, perPage } = req.query;

  const notifications = await notificationService.getUserNotifications(user._id, page, perPage);
  res.status(httpStatus.OK).send({
    status: true,
    message: 'Successfull',
    page,
    data: notifications,
  });
});

const getTranscendingArtists = catchAsync(async (req, res) => {
  const user = req.user;
  const { page, perPage } = req.query;

  const artists = await userService.getUsersByMostArtworks();
  res.status(httpStatus.OK).send({
    status: true,
    data: artists,
  });
});

const getLeadingCollectors = catchAsync(async (req, res) => {
  const user = req.user;
  const { page, perPage } = req.query;

  const artists = await userService.fetchLeadingCollectors();
  res.status(httpStatus.OK).send({
    status: true,
    data: artists,
  });
});

const tempUdateUser = catchAsync(async (req, res) => {
  EVENT.emit('create-stats', {
    userId: req.query.userId
  });
  res.status(httpStatus.CREATED).send({
    status: true
  });
});

module.exports = {
  handleSearch,
  getAppActivity,
  getTranscendingArtists,
  getNotifications,
  tempUdateUser,
  getLeadingCollectors
};
