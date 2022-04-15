const { Artwork } = require('../models');
const { MINT_STATUS } = require('../utils/enums');
const axios = require('axios');
const Web3 = require('web3');

const web3 = new Web3();

const getPopulatedArtwork = async (artworkId, fieldsToPopulate) => {
  return await Artwork.findOne({ _id: artworkId }).populate(fieldsToPopulate).lean();
};

const saveArtwork = async (params) => {
  const art = await Artwork.create(params);
  return art.toObject();
};

const getUserArtworks = async (userId, page, perPage) => {
  return await Artwork.find({ owner: userId })
    .populate('auction')
    .populate('sale')
    .populate('owner')
    .sort({ _id: -1 })
    .limit(parseInt(perPage))
    .skip(page * perPage)
    .lean();
};

const increaseArtworkViews = async (artworkId) => {
  return await Artwork.findOneAndUpdate({ _id: artworkId }, { $inc: { views: 1 } }, { new: true }).lean();
};

const increaseArtworkLikes = async (artworkId) => {
  return await Artwork.findOneAndUpdate({ _id: artworkId }, { $inc: { numberOfLikes: 1 } }, { new: true }).lean();
};

const decreaseArtworkLikes = async (artworkId) => {
  return await Artwork.findOneAndUpdate({ _id: artworkId }, { $inc: { numberOfLikes: -1 } }, { new: true }).lean();
};

const updateArtwork = async (id, fieldToUpdate, value) => {
  return await Artwork.findOneAndUpdate({ _id: id }, { fieldToUpdate: value }, { new: true }).lean();
};

const updateArtworkMetaUrl = async (id, value) => {
  return await Artwork.findOneAndUpdate({ _id: id }, { meta_url: value }, { new: true }).lean();
};

const getArtworkById = async (id) => {
  return await Artwork.findOne({ _id: id }).lean();
};

const closeArtworkAuction = async (artworkId) => {
  return await Artwork.findOneAndUpdate({ _id: artworkId }, { isAuctionOpen: false, auction: null, bids: [] }).lean();
};

const deleteArtworksByCollection = async (collectionId) => {
  return await Artwork.deleteMany({ collectionId });
};

const updateArtworkTokenId = async (artworkId, tokenId) => {
  return await Artwork.findOneAndUpdate({ _id: artworkId }, { tokenId }, { new: true }).lean();
};

const getArtworksByCollection = async (collectionId) => {
  return await Artwork.find({ collectionId }).sort({ _id: -1 }).populate('owner').populate('sale').populate('auction').lean();
};

const changeArtworkAuctionStatus = async (artworkId, status) => {
  return await Artwork.findOneAndUpdate(
    { _id: artworkId },
    {
      auctionMintStatus: status,
      isAuctionOpen: status == MINT_STATUS.PENDING && true,
    },
    { new: true }
  ).lean();
};

const deleteArtworkById = async (artworkId) => {
  await Artwork.findOneAndDelete({ _id: artworkId });
};

const searchArtworkByName = async (keyword, page, perPage, artist, min, max) => {
  const query = {};
  if (keyword) {
    query.name = { $regex: keyword, $options: 'i' };
  }
  if (artist) {
    query.owner = artist;
  }
  if (min && max) {
    query.$and = [
      {
        price: { $gte: parseInt(min) },
      },
      {
        price: { $lte: parseInt(max) },
      },
    ];
  }

  return await Artwork.find(query)
    .limit(parseInt(perPage))
    .skip(page * perPage);
};

const getLatestArtworks = async () => {
  console.log("a");
  return await Artwork.find()
    .populate('owner')
    .populate('creater')
    .populate('auction')
    .populate('sale')
    .sort({ _id: -1 });
};

const getAuctionOpenArtworks = async (userId, page, perPage) => {
  return await Artwork.find({ isAuctionOpen: true, owner: userId }).sort({ _id: -1 }).limit(parseInt(perPage))
    .skip(page * perPage);;
};

const getopenForSaleArtworks = async (userId, page, perPage) => {
  return await Artwork.find({ openForSale: true, owner: userId }).sort({ _id: -1 }).limit(parseInt(perPage))
    .skip(page * perPage);
};

const getUserFilteredArtworks = async (userId, page, perPage) => {
  return await Artwork.find({ owner: userId }).sort({ _id: -1 }).limit(parseInt(perPage))
    .skip(page * perPage);
};
const getAllArtworksPaginated = async (page, perPage) => {
  const artworks = await Artwork.find({ isInAlbum: 'false' }).sort({ _id: -1 }).populate('owner').populate('group').populate('sale').populate('auction').limit(parseInt(perPage))
    .populate('creater')
    .populate('owner')
    .populate('auction')
    .populate('sale')
    .populate('albumDetails')
    .sort({ _id: -1 })
    .limit(parseInt(perPage))
    .skip(page * perPage)
    .lean();

  const count = await Artwork.find({ isInAlbum: 'false' }).countDocuments();
  return { artworks, count };
};
const getAllArtworks = async (
  page,
  perPage,
  isAuctionOpen = undefined,
  openForSale = undefined,
  artwork_type = undefined
) => {
  if (artwork_type != undefined) {
    return await Artwork.find({ artwork_type })
      .populate('owner')
      .populate('creater')
      .populate('auction')
      .populate('sale')
      .populate('albumDetails')
      .sort({ _id: -1 })
      .limit(parseInt(perPage))
      .skip(page * perPage);
  }
  if (isAuctionOpen != undefined) {
    return await Artwork.find({ isAuctionOpen: true })
      .populate('owner')
      .populate('creater')
      .populate('auction')
      .populate('sale')
      .sort({ _id: -1 })
      .limit(parseInt(perPage))
      .skip(page * perPage);
  }
  if (openForSale != undefined) {
    return await Artwork.find({ openForSale: true })
      .populate('owner')
      .populate('creater')
      .populate('auction')
      .populate('sale')
      .populate('albumDetails')
      .sort({ _id: -1 })
      .limit(parseInt(perPage))
      .skip(page * perPage);
  }
  return await Artwork.find({ isInAlbum: 'false' })
    .populate('creater')
    .populate('auction')
    .populate('sale')
    .populate('albumDetails')
    .sort({ _id: -1 })
    .limit(parseInt(perPage))
    .skip(page * perPage);
};

const getAllArtworksCount = async (
  isAuctionOpen = undefined,
  openForSale = undefined,
  artwork_type = undefined
) => {
  if (artwork_type != undefined) {
    return await Artwork.find({ artwork_type })
      .populate('owner').countDocuments();
  }
  if (isAuctionOpen != undefined) {
    return await Artwork.find({ isAuctionOpen: true })
      .populate('owner').countDocuments();
  }
  if (openForSale != undefined) {
    return await Artwork.find({ openForSale: true })
      .populate('owner').countDocuments();
  }
  return await Artwork.find({})
    .populate('owner').countDocuments();
};
const searchArtworkByNameTotal = async (keyword, page, perPage, artist, min, max) => {
  const query = {};
  if (keyword) {
    query.name = { $regex: keyword, $options: 'i' };
  }
  if (artist) {
    query.owner = artist;
  }
  if (min && max) {
    query.$and = [
      {
        price: { $gte: parseInt(min) },
      },
      {
        price: { $lte: parseInt(max) },
      },
    ];
  }

  return await Artwork.find(query)
    .populate('sale')
    .populate('auction').countDocuments();
};
const getAllArtworksCount1 = async () => {
  return await Artwork.find().countDocuments();
};
const getAllArtwork = async (page, perPage) => {
  return await Artwork.find().sort({ _id: -1 }).populate('owner').populate('group').populate('sale').populate('auction').limit(parseInt(perPage))
    .skip(page * perPage);
};
const getUserArtworksCount = async (userId) => {
  return await Artwork.find({ owner: userId }).countDocuments();
};

const getArtworkByGenre = async (genre, page, perPage) => {
  const artwork = await Artwork.find({ genre: genre })
    .populate('creater')
    .limit(parseInt(perPage))
    .skip(page * perPage)
    .lean();

  return artwork;
};

const getAllArtworkOfMusic = async (page, perPage) => {  // get all artwork of music
  return await Artwork.find({ artwork_type: 'audio' })
    .populate('owner')
    .populate('creater')
    .populate('auction')
    .populate('sale')
    .sort({ _id: -1 })
    .limit(parseInt(perPage))
    .skip(page * perPage);

};

const getAllArtworkOfVideo = async (page, perPage) => {  // get all artwork of music
  return await Artwork.find({ artwork_type: 'videos' })
    .populate('owner')
    .populate('creater')
    .populate('auction')
    .populate('sale')
    .sort({ _id: -1 })
    .limit(parseInt(perPage))
    .skip(page * perPage);

};

const getCountOfArtworkOfMusic = async () => {  // get all artwork of music
  return await Artwork.find({ artwork_type: 'audio' }).countDocuments();
};

const getCountOfArtworkOfVideo = async () => {  // get all artwork of music
  return await Artwork.find({ artwork_type: 'video' }).countDocuments();
};


const searchArtworkByMusic = async (keyword, page, perPage) => {
  let query = {};
  if (keyword) {
    query.name = { $regex: keyword, $options: 'i' };
  }
  const musicArtwork = await Artwork.find(query);
  const musics = musicArtwork.filter((music) => {
    return music.artwork_type === 'audio';
  })
  return musics;
};

const searchArtworkByVideo = async (keyword, page, perPage) => {
  let query = {};
  if (keyword) {
    query.name = { $regex: keyword, $options: 'i' };
  }
  const videoArtwork = await Artwork.find(query);
  const videos = videoArtwork.filter((video) => {
    return video.artwork_type === 'videos';
  })
  return videos;
};

const ethToUsd = async (value) => {
  try {
    value = parseFloat(value);
    const response = await axios.get('https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD');
    if (response.status === 200) {
      let price = response.data.RAW.ETH.USD.PRICE;
      price = parseFloat(price);
      const dollorPrice = value / price;
      return dollorPrice;
    }
  } catch (error) {
    console.log(error);
  }

}


const getSignatureHash = async (userAddress, price, tokenUrl) => {
  price = await web3.utils.toWei(price.toString(), 'ether');
  const data = web3.utils.soliditySha3(userAddress, price, tokenUrl);
  return data;
};

const signMessage = async (msgHash, adminAddress, adminKey) => {
  web3.eth.defaultAccount = adminAddress;
  const signObj = web3.eth.accounts.sign(msgHash, adminKey);
  return signObj;
};
module.exports = {
  saveArtwork,
  getUserArtworks,
  increaseArtworkViews,
  updateArtwork,
  updateArtworkMetaUrl,
  getPopulatedArtwork,
  getArtworkById,
  closeArtworkAuction,
  deleteArtworksByCollection,
  updateArtworkTokenId,
  getArtworksByCollection,
  changeArtworkAuctionStatus,
  deleteArtworkById,
  searchArtworkByName,
  getLatestArtworks,
  getAuctionOpenArtworks,
  getopenForSaleArtworks,
  getUserFilteredArtworks,
  increaseArtworkLikes,
  decreaseArtworkLikes,
  getAllArtworksPaginated,
  getAllArtworks,
  getAllArtworksCount,
  searchArtworkByNameTotal,
  getAllArtworksCount1,
  getAllArtwork,
  getUserArtworksCount,
  getArtworkByGenre,
  getAllArtworkOfMusic,
  getAllArtworkOfVideo,
  getCountOfArtworkOfMusic,
  getCountOfArtworkOfVideo,
  searchArtworkByMusic,
  searchArtworkByVideo,
  ethToUsd,
  getSignatureHash,
  signMessage,
};
