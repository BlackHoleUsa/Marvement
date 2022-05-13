const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Web3 = require('web3');
const web3 = new Web3();
const {
  authService,
  userService,
  tokenService,
  emailService,
  collectionService,
  artworkService,
  bidService,
  auctionService,
  historyService,
  priceService,
} = require('../services');
const EVENT = require('../triggers/custom-events').customEvent;
const { addFilesToIPFS, pinMetaDataToIPFS } = require('../utils/helpers');
const { HISTORY_TYPE, NOTIFICATION_TYPE, STATS_UPDATE_TYPE } = require('../utils/enums');
const { MusicAlbum } = require('../models');
const ADMIN_DETAILS = {
  ADMIN_PRIVATE_KEY: 'c3982c0de5b9e25fb0953663584f52474c673a79dfc6184652791acdbd63b9cd',
  ADMIN_ADDRESS: '0x192DDbb00E5aA7E3107f82030C4C8AAB1EB903B7',
};


const saveArtwork = catchAsync(async (req, res) => {
  const { body } = req;
  const { files } = req;
  const { name, description, creater, collectionId, isAudioNFT } = body;
  let imgData;
  let thumbNailData;
  if (files.length > 0) {
    imgData = await addFilesToIPFS(files[0].buffer, 'image');
    body.artwork_url = imgData;
    if (isAudioNFT) {
      thumbNailData = await addFilesToIPFS(files[1].buffer, 'artwork_thumbnail_image');
    }
  }
  if (req.body.albumId) {
    const album = await MusicAlbum.findById(req.body.albumId);
    body.isInAlbum = true;
    if (album.tracks <= album.artworks.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Album is full');
      res.status(httpStatus.BAD_REQUEST).send('Album is full');
      return;
    }
  }
  body.owner = body.creater;
  body.basePrice = body.price;
  body.thumbNail_url = thumbNailData;
  const user = await userService.getUserById(creater);

  const artwork = await artworkService.saveArtwork(body);
  let metaUrl;
  if (isAudioNFT) {
    metaUrl = await pinMetaDataToIPFS({
      // eslint-disable-next-line object-shorthand
      name: name,
      // eslint-disable-next-line object-shorthand
      description: description,
      animation_url: imgData,
      image: thumbNailData,
      artist_name: user.name,
      artist_description: user.description,
      artist_url: user.profilePic,
      creater: {
        name: user.userName,
        id: user._id,
      },
      collectionId,
      artwork_url: imgData,
    });
  } else {
    metaUrl = await pinMetaDataToIPFS({
      // eslint-disable-next-line object-shorthand
      name: name,
      // eslint-disable-next-line object-shorthand
      description: description,
      image: imgData,
      artist_name: user.name,
      artist_description: user.description,
      artist_url: user.profilePic,
      creater: {
        name: user.userName,
        id: user._id,
      },
      collectionId,
      artwork_url: imgData,
    });
  }

  let price;
  EVENT.emit('increase-price-in-counter');
  if (user.isNewUser) {
    price = await artworkService.polyToUsd(20);
    price = price.toFixed(8);
    const newUser = await userService.updateUserStatus(user._id);
    console.log('New user price in meta', price);
  }
  else {
    price = await artworkService.polyToUsd(5);
    price = price.toFixed(8);
    console.log('price in meta', price)
    
  }
  console.log('req.body.isMeta', req.body.isMeta);
  
  if (user.isNewUser && req.body.isMeta) {
    price = await artworkService.ethToUsd(20);
    price = price.toFixed(8);
    const newUser = await userService.updateUserStatus(user._id);
  }
  else if (req.body.isMeta) {
    
    price = await artworkService.ethToUsd(5);
    price = price.toFixed(8);
  }

  let counter2 = await priceService.getPriceCounter();

  const priceHash = await artworkService.getSignatureHash(price, counter2.counter);
  const priceMessage = await artworkService.signMessage(priceHash, ADMIN_DETAILS.ADMIN_ADDRESS, ADMIN_DETAILS.ADMIN_PRIVATE_KEY);

  const priceSignature = priceMessage.signature;
  price = await web3.utils.toWei(price.toString(), 'ether');
  const updatedArtwork = await artworkService.updateArtworkMetaUrl(artwork._id, metaUrl);

  EVENT.emit('add-artwork-in-user', {
    artworkId: artwork._id,
    userId: body.creater,
  });
  EVENT.emit('add-artwork-in-collection', {
    artworkId: artwork._id,
    collectionId: body.collectionId,
  });

  EVENT.emit('update-artwork-history', {
    artwork: artwork._id,
    owner: body.creater,
    message: `${user.userName} created the artwork`,
    type: HISTORY_TYPE.ARTWORK_CREATED,
  });
  if (req.body.albumId) {
    EVENT.emit('insert-artwork-in album', {
      albumId: body.albumId,
      artwork: artwork._id,
    });
  }
  console.log("co")
  const { counter } = await priceService.getPriceCounter();
  res.status(httpStatus.OK).send({ status: true, message: 'artwork saved successfully', updatedArtwork, price, "priceSignature": priceSignature, txIdentifier: counter });
});

const getUserArtworks = catchAsync(async (req, res) => {
  const { page, perPage, userId } = req.query;

  const artworks = await artworkService.getUserArtworks(userId, page, perPage);
  const count = await artworkService.getUserArtworksCount(userId);
  res.status(httpStatus.OK).send({ status: true, message: 'successfull', data: artworks, count });
});

const addToFavourite = catchAsync(async (req, res) => {
  const { artworkId } = req.body;
  const { user } = req;
  const userObject = await userService.getSingleFavouriteArtWork(user._id);
  const { favouriteArtworks } = userObject;
  if (!favouriteArtworks.includes(artworkId)) {
    await userService.addArtworkToFavourites(user._id, artworkId);
    await artworkService.increaseArtworkLikes(artworkId);
  }
  res.status(httpStatus.OK).send({ status: true, message: 'artwork added in favourites successfully' });
});

const removeFromFavourites = catchAsync(async (req, res) => {
  const { artworkId } = req.body;
  const { user } = req;

  const updatedUser = await userService.removeArtworkFromFavourite(user._id, artworkId);
  await artworkService.decreaseArtworkLikes(artworkId);
  res.status(httpStatus.OK).send({ status: true, message: 'artwork removed from favourites successfully' });
});

const getFavouriteArtworks = catchAsync(async (req, res) => {
  const { userId, page, perPage } = req.query;

  const artworks = await userService.getFavouriteArtworks(userId, page, perPage);
  const count = await userService.getFavouriteArtworksCount(userId);
  res.status(httpStatus.OK).send({ status: true, message: 'successfull', data: artworks, count });
});

const increaseArtworkViews = catchAsync(async (req, res) => {
  const { artworkId } = req.body;

  const artwork = await artworkService.increaseArtworkViews(artworkId);
  res.status(httpStatus.OK).send({ status: true, message: 'Artwork view increased successfully', data: artwork });
});

const createAuction = catchAsync(async (req, res) => {
  const { artwork } = req.body;
  if (await auctionService.artworkExistsInAuction(artwork)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Artwork is already on auction');
  }
  const { body } = req;
  const { owner, creater } = await artworkService.getArtworkById(artwork);
  body.owner = owner;
  body.creater = creater;

  const auction = await auctionService.saveAuction(body);

  EVENT.emit('open-artwork-auction', {
    artworkId: artwork,
    auction: auction._id,
  });
  EVENT.emit('update-artwork-history', {
    artwork: artwork._id,
    message: `artwork placed on auction`,
    auction: auction._id,
    type: HISTORY_TYPE.AUCTION_STARTED,
  });

  res.status(httpStatus.OK).send({ status: true, message: 'Artwork placed on auction successfully', data: auction });
});

const placeBid = catchAsync(async (req, res) => {
  const { body } = req;
  const { user } = req;

  const { artwork, auctionId } = body;
  const bid = await bidService.saveBid(body);

  EVENT.emit('save-bid-in-artwork', {
    artworkId: artwork,
    bidId: bid._id,
    auctionId,
  });

  // EVENT.emit('update-artwork-history', {
  //   artwork,
  //   message: `Bid placed on artwork`,
  //   auction: auctionId,
  //   bid: bid._id,
  //   type: HISTORY_TYPE.BID_PLACED,
  // });

  EVENT.emit('send-and-save-notification', {
    receiver: user._id,
    type: NOTIFICATION_TYPE.NEW_BID,
    extraData: {
      bid: bid._id,
    },
  });

  res.status(httpStatus.OK).send({ status: true, message: 'Your bid has been placed successfully', data: bid });
});

const getSingleArtwork = catchAsync(async (req, res) => {
  const { artworkId } = req.query;

  const artwork = await artworkService.getPopulatedArtwork(artworkId, 'auction creater owner collectionId bids sale');
  res.status(httpStatus.OK).send({ status: true, message: 'Successfull', data: artwork });
});

const getAuctionDetails = catchAsync(async (req, res) => {
  const { artworkId } = req.query;

  const artwork = await artworkService.getPopulatedArtwork(artworkId, 'auction creater owner collectionId bids');
  res.status(httpStatus.OK).send({ status: true, message: 'Successfull', data: artwork });
});

const getAuctionBids = catchAsync(async (req, res) => {
  const { auctionId } = req.query;

  const bids = await bidService.getAuctionBidsPopulated(auctionId, 'bidder owner auction');
  res.status(httpStatus.OK).send({ status: true, message: 'Successfull', data: bids });
});

const updateTokenId = catchAsync(async (req, res) => {
  const { artworkId, tokenId } = req.body;
  const artwork = await artworkService.updateArtworkTokenId(artworkId, tokenId);

  EVENT.emit('stats-artwork-mint', {
    userId: artwork.owner,
    type: STATS_UPDATE_TYPE.ownedArts,
  });

  res.status(httpStatus.OK).send({
    status: true,
    message: 'token id updated successfully',
    data: artwork,
  });
});

const getArtworksByCollection = catchAsync(async (req, res) => {
  const { collectionId } = req.query;
  const artworks = await artworkService.getArtworksByCollection(collectionId);

  res.status(httpStatus.OK).send({ status: true, message: 'successfull', data: artworks });
});

const changeAuctionStatus = catchAsync(async (req, res) => {
  const { artworkId, status } = req.body;
  const artwork = await artworkService.changeArtworkAuctionStatus(artworkId, status);
  res.status(httpStatus.OK).send({ status: true, message: 'successfull', data: artwork });
});

const deleteArtwork = catchAsync(async (req, res) => {
  const { artworkId } = req.body;
  const artwork = await artworkService.getArtworkById(artworkId);
  if (!artwork) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Artwork does not exist');
  }

  EVENT.emit('update-artwork-history', {
    artwork: artworkId,
    message: `Artwork deleted`,
    type: HISTORY_TYPE.ARTWORK_DELETED,
  });

  await collectionService.removeArtwork(artworkId, artwork.collectionId);
  await userService.removeArtwork(artwork.creater, artworkId);
  await userService.removeOwnedArtworks(artwork.creater);
  await artworkService.deleteArtworkById(artworkId);

  res.status(httpStatus.OK).send({ status: true, message: 'artwork deleted successfully', data: artworkId });
});

const getArtworkHistory = catchAsync(async (req, res) => {
  const { artworkId, page, perPage } = req.query;
  const history = await historyService.getArtworkHistory(artworkId, page, perPage, 'artwork owner');
  res.status(httpStatus.OK).send({ status: true, message: 'Successfull', data: history });
});

const getAllArtworks = catchAsync(async (req, res) => {
  const { artwork_type, page, perPage, isAuctionOpen, openForSale } = req.query;
  if (!artwork_type) {
    const artWorks = await artworkService.getAllArtworks(page, perPage, isAuctionOpen, openForSale);
    const count = await artworkService.getAllArtworksCount(isAuctionOpen, openForSale);
    res.status(httpStatus.OK).send({ status: true, message: 'Successfull', data: artWorks, count });
  } else {
    const artWorks = await artworkService.getAllArtworks(page, perPage, undefined, undefined, artwork_type);
    const count = await artworkService.getAllArtworksCount(undefined, undefined, artwork_type);
    res.status(httpStatus.OK).send({ status: true, message: 'Successfull', data: artWorks, count });
  }
});

const getWinnedAuctions = catchAsync(async (req, res) => {
  const { page, perPage } = req.query;

  const winnedAuctions = await auctionService.getClosedAuctions(req.user._id, page, perPage);
  res.status(httpStatus.OK).send({ status: true, message: 'Successfull', data: winnedAuctions });
});

const getSoldItems = catchAsync(async (req, res) => {
  const { page, perPage } = req.query;

  const winnedAuctions = await auctionService.getSoldAuctions(req.user._id, page, perPage);
  res.status(httpStatus.OK).send({ status: true, message: 'Successfull', data: winnedAuctions });
});

const getTimeoutItems = catchAsync(async (req, res) => {
  const { page, perPage } = req.query;
  const winnedAuctions = await auctionService.getTimeoutAuctions(req.user._id, page, perPage);
  res.status(httpStatus.OK).send({ status: true, message: 'Successfull', data: winnedAuctions });
});

const getLatestArtWorks = catchAsync(async (req, res) => {
  const artWorks = await artworkService.getLatestArtworks();
  res.status(httpStatus.OK).send(artWorks);
});

const getFilteredArtworks = catchAsync(async (req, res) => {
  const { isAuctionOpen, openForSale, owner, page, perPage } = req.body;
  if (isAuctionOpen) {
    const artWorks = await artworkService.getAuctionOpenArtworks(owner, page, perPage);
    res.status(httpStatus.OK).send(artWorks);
  } else if (openForSale) {
    const artWorks = await artworkService.getopenForSaleArtworks(owner, page, perPage);
    res.status(httpStatus.OK).send(artWorks);
  } else {
    const artWorks = await artworkService.getUserFilteredArtworks(owner, page, perPage);
    res.status(httpStatus.OK).send(artWorks);
  }
});
const setAuctionBidders = catchAsync(async (req, res) => {
  const { artworkId } = req.query;
  const { userId, aucId } = req.body;
  const response = await auctionService.setAuctionBidders(artworkId, userId);
  let bids = await bidService.getAuctionBids(aucId);
  const amount = Math.max.apply(null, bids?.map(bid => bid?.bid_amount));
  await auctionService.setmaxBid(artworkId, amount);
  res.status(httpStatus.CREATED).send(response);
});


const getArtworkByGenre = catchAsync(async (req, res) => {
  let = { genre, page, perPage, keyword } = req.query;
  genre = genre.toLowerCase();
  const artworkss = await artworkService.getArtworkByGenre(genre, page, perPage);
  let artworks = artworkss.art;

  let count = artworkss.count;
  if (artworks.length === 0) {
    res.status(httpStatus.OK).send({ status: true, message: 'Artwork is not found', artworks });
    return;
  }
  if (keyword) {


    artworks = artworkss.filter((art) => art.name.toLowerCase().includes(keyword.toLowerCase()));
    count = artwork.length;
    res.status(httpStatus.OK).send({ artworks, count });
    return;
  }
  res.status(httpStatus.OK).send({ status: true, message: 'Successfull', artworks, count });
  return;


});

const artworkForAdmin = catchAsync(async (req, res) => {
  const { page, perPage } = req.query;
  const artWorks = await artworkService.getAllArtworkForAdmin(page, perPage);
  res.status(httpStatus.OK).send({ status: true, message: 'Successfull', data: artWorks });
});


module.exports = {
  saveArtwork,
  getUserArtworks,
  addToFavourite,
  removeFromFavourites,
  getFavouriteArtworks,
  increaseArtworkViews,
  placeBid,
  createAuction,
  getSingleArtwork,
  getAuctionBids,
  updateTokenId,
  getArtworksByCollection,
  changeAuctionStatus,
  deleteArtwork,
  getWinnedAuctions,
  getSoldItems,
  getArtworkHistory,
  getTimeoutItems,
  getLatestArtWorks,
  getFilteredArtworks,
  getAllArtworks,
  setAuctionBidders,
  getArtworkByGenre,
  artworkForAdmin,
};
