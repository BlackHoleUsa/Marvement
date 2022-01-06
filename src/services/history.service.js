const { Bid, History } = require('../models');
const { HISTORY_TYPE } = require('../utils/enums');

const getArtworkHistory = async (artworkId, page, perPage, fieldsToPopulate) => {
  return await History.find({ artwork: artworkId })
    .populate(fieldsToPopulate)
    .sort({ _id: -1 })
    .limit(parseInt(perPage))
    .skip(page * perPage).lean();
};

const getAllHistoriesPaginated = async (page, perPage) => {
  return await History.find({
    $or: [{ type: HISTORY_TYPE.ARTWORK_CREATED }, { type: HISTORY_TYPE.AUCTION_STARTED }, { type: HISTORY_TYPE.BID_PLACED }]
  })
    .populate('artwork owner auction')
    .populate({
      path: 'bid',
      populate: 'bidder'
    })
    .limit(parseInt(perPage))
    .skip(page * perPage).lean();
};

module.exports = {
  getArtworkHistory,
  getAllHistoriesPaginated,
};
