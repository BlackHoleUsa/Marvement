const { Artwork } = require('../models');
const { MINT_STATUS } = require('../utils/enums');

const getPopulatedArtwork = async (artworkId, fieldsToPopulate) => {
  return await Artwork.findOne({ _id: artworkId }).populate(fieldsToPopulate).lean();
};

const saveArtwork = async (params) => {
  const art = await Artwork.create(params);
  return art.toObject();
};

const getUserArtworks = async (userId, page, perPage) => {
  return await Artwork.find({ owner: userId })
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
  return await Artwork.find({ collectionId }).lean();
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
  return await Artwork.find().sort({ _id: -1 });
};

const getAuctionOpenArtworks = async (userId, page, perPage) => {
  return await Artwork.find({ isAuctionOpen: true, owner: userId }).limit(parseInt(perPage))
    .skip(page * perPage);;
};

const getopenForSaleArtworks = async (userId, page, perPage) => {
  return await Artwork.find({ openForSale: true, owner: userId }).limit(parseInt(perPage))
    .skip(page * perPage);
};

const getUserFilteredArtworks = async (userId, page, perPage) => {
  return await Artwork.find({ owner: userId }).limit(parseInt(perPage))
    .skip(page * perPage);
};
const getAllArtworksPaginated = async (page, perPage) => {
  const artworks = await Artwork.find()
    .populate('creater')
    .populate('auction')
    .limit(parseInt(perPage))
    .skip(page * perPage)
    .lean();

  const count = await Artwork.find().countDocuments();
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
      .limit(parseInt(perPage))
      .skip(page * perPage);
  }
  if (isAuctionOpen != undefined) {
    return await Artwork.find({ isAuctionOpen: true })
      .populate('owner')
      .populate('auction')
      .limit(parseInt(perPage))
      .skip(page * perPage);
  }
  if (openForSale != undefined) {
    return await Artwork.find({ openForSale: true })
      .populate('owner')
      .populate('sale')
      .limit(parseInt(perPage))
      .skip(page * perPage);
  }
  return await Artwork.find({})
    .populate('owner')
    .populate('sale')
    .populate('auction')
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
};
