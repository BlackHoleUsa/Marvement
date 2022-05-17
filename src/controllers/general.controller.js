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
    let albumSearch = await artworkService.searchArtworkByAlbum(keyword, page, perPage);
    let count = 0;
    let data = {};

    switch (filter) {
      case SEARCH_FILTERS.USERS:
        data.users = users;
        count = usersCount;
        break;

      case SEARCH_FILTERS.ARTWORKS:
        data.artwork = artworks.artwork;
        count = artworks.count;
        break;

      case SEARCH_FILTERS.AUDIO:
        data.artwork = musicArtwork;
        count = musicArtwork.length;
        break;

      case SEARCH_FILTERS.VIDEOS:
        data.artwork = videoArtwork;
        count = videoArtwork.length;
        break;

      case SEARCH_FILTERS.ALBUM:
        data.artwork = albumSearch.albums;
        count = albumSearch.count;
        break;



      default:
        data = {
          users,
          artwork,
        };
    }

    res.status(httpStatus.OK).send({
      status: true,
      message: 'Successfull',
      data,
      count,
    });
  } else {
    let users;
    let data = {};
    let artwork;
    let collections;
    let count;
    switch (filter) {
      case SEARCH_FILTERS.USERS:
        users = await userService.getAllUsers(page, perPage);
        data.users = users;
        count = await userService.getAllUsersCount();
        break;

      case SEARCH_FILTERS.ARTWORKS:
        artwork = await artworkService.getAllArtworkSearch(page, perPage);
        data.artwork = artwork.artwork;
        count = artwork.count;
        break;

      case SEARCH_FILTERS.COLLECTIONS:
        collections = await collectionService.getAllCollectionsperPage(page, perPage);
        data.collections = collections;
        count = await collectionService.getAllCollectionsCount();
        break;

      case SEARCH_FILTERS.AUDIO:
        artwork = await artworkService.getAllArtworkOfMusic(page, perPage);
        data.artwork = artwork;
        count = await artworkService.getCountOfArtworkOfMusic();
        break;

      case SEARCH_FILTERS.VIDEO:
        artwork = await artworkService.getAllArtworkOfVideo(page, perPage);
        data.artwork = artwork;
        count = await artworkService.getCountOfArtworkOfVideo();
        break;

      case SEARCH_FILTERS.ALBUM:
        artwork = await artworkService.getAllArtworkOfAlbum(page, perPage);
        data.artwork = artwork;
        count = await artworkService.getAllArtworkOfAlbumCount();
        break;

      default:
        data = {
          users,
          artwork,
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
