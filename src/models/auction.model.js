const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { AUCTION_STATUS } = require('../utils/enums');

const auctionSchema = mongoose.Schema(
  {
    artwork: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Artwork',
      required: true,
    },
    initialPrice: {
      type: Number,
      required: true,
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    creater: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    endTime: {
      type: Date,
      required: false,
    },
    contractAucId: {
      type: String,
      required: false,
    },
    auctionWinner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: false,
    },
    bidAmount: {
      type: String,
      required: false
    },
    nftClaim: {
      type: Boolean,
      required: false,
      default: false,
    },
    cancelled: {
      type: Boolean,
      required: false,
      default: false,
    },
    ownerclaim: {
      type: Boolean,
      required: false,
      default: false,
    },
    bids: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Bid',
      },
    ],
    status: {
      type: String,
      default: AUCTION_STATUS.OPEN,
    },
    bidders: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

auctionSchema.plugin(toJSON);

/**
 * @typedef Token
 */
const Auction = mongoose.model('Auction', auctionSchema);

module.exports = Auction;
