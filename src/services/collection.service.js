const { Collection, Artwork } = require('../models');

const saveCollection = async (params) => {
  return await Collection.create(params);
};

const getCollectionById = async (id) => {
  return await Collection.findOne({ _id: id }).lean();
};

const getCollectionsByUserId = async (userId) => {
  return await Collection.find({ owner: userId }).lean();
};

const getPaginatedCollections = async (page, perPage, userId) => {
  return await Collection.find({ owner: userId })
    .limit(parseInt(perPage))
    .skip(page * perPage)
    .lean();
};

const getPopulatedCollection = async (userId, collectionId) => {
  return await Collection.findOne({ _id: collectionId }).populate({
    path: 'artworks',
    match: {
      isAuctionOpen: false,
      openForSale: false,
      owner: userId
    }
  }).lean();
};

const updateCollectionImages = async (collectionId, profileImage, coverImage) => {
  return await Collection.findOneAndUpdate({ _id: collectionId }, { profileImage, coverImage }, { new: true }).lean();
};

const updateCollectioById = async (collectionId, updateBody) => {
  const collection = await Collection.findByIdAndUpdate(collectionId, updateBody, {
    new: true,
  }).lean();
  return collection;
};

const collectionExists = async (userId, colName) => {
  const collection = await Collection.find({ owner: userId, name: colName });
  return collection.length > 0;
};

const deleteCollectionById = async (collectionId) => {
  return await Collection.findOneAndDelete({ _id: collectionId });
};

const getAllCollections = async () => {
  return await Collection.find({}).lean();
};

const removeArtwork = async (artworkId, collectionId) => {
  return await Collection.findOneAndUpdate(
    {
      _id: collectionId,
    },
    {
      $pull: { artworks: artworkId },
    }
  ).lean();
};

const searchCollectionByName = async (keyword, page, perPage) => {
  return await Collection.find({ name: { $regex: keyword, $options: 'i' } })
    .populate('artworks')
    .limit(parseInt(perPage))
    .skip(page * perPage);
};
const collectionExistsWithSymbol = async (owner, symbol) => {
  const collection = await Collection.find({ owner, symbol });
  return collection.length > 0;
};
const getAllCollectionsperPage = async (page, perPage) => {
  return await Collection.find()
    .limit(parseInt(perPage))
    .skip(page * perPage);
};
const getAllCollectionsCount = async () => {
  return await Collection.find().countDocuments();
};
module.exports = {
  saveCollection,
  getCollectionById,
  getPaginatedCollections,
  getPopulatedCollection,
  updateCollectionImages,
  updateCollectioById,
  getCollectionsByUserId,
  collectionExists,
  deleteCollectionById,
  getAllCollections,
  removeArtwork,
  searchCollectionByName,
  collectionExistsWithSymbol,
  getAllCollectionsperPage,
  getAllCollectionsCount,
};
