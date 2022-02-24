const { Bid } = require('../models');

const saveBid = async (params) => {
  const bid = await Bid.create(params);
  return bid.toObject();
};

const getAuctionBidsPopulated = async (auctionId, fieldsToPopulate) => {
  return await Bid.find({ auction: auctionId }).populate(fieldsToPopulate).lean();
};

const getAuctionBids = async (auctionId) => {
  return await Bid.find({ auction: auctionId }).lean();
};

module.exports = {
  saveBid,
  getAuctionBidsPopulated,
  getAuctionBids,
};
