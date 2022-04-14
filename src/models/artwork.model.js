const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { ARTWORK_TYPE } = require('../utils/enums');

const artworkSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    creater: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    artwork_url: {
      type: String,
      required: false,
      trim: true,
    },
    youtubeLink: {
      type: String,
      required: false,
      trim: true,
    },
    spotifyLink: {
      type: String,
      required: false,
      trim: true,
    },
    websiteLink: {
      type: String,
      required: false,
      trim: true,
    },
    ituneLink: {
      type: String,
      required: false,
      trim: true,
    },
    thumbNail_url: {
      type: String,
      required: false,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    basePrice: {
      type: Number,
      required: false,
    },
    tokenId: {
      type: String,
      required: false,
    },
    collectionId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Collection',
    },
    views: {
      type: Number,
      required: false,
      default: 0,
    },
    artwork_type: {
      type: String,
      required: false,
      default: ARTWORK_TYPE.IMAGE,
    },
    meta_url: {
      type: String,
      required: false,
      trim: true,
    },
    isAuctionOpen: {
      type: Boolean,
      default: false,
    },
    openForSale: {
      type: Boolean,
      default: false,
    },
    isAudionNFT: {
      type: Boolean,
      default: false,
    },
    numberOfLikes: {
      type: Number,
      default: 0,
      required: false,
    },
    sale: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'BuySell',
    },
    auction: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Auction',
    },
    auctionMintStatus: {
      type: String,
      default: 'closed',
    },
    genre: {
      type: String,
    },
    isAuctionOpen: {
      type: Boolean,
      default: false,
    },
    isMeta: {
      type: Boolean,
    },
    isAlbum: {
      type: Boolean,
      default: false,
    },
    albumDetails: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'MusicAlbum',
    },
  },
  {
    timestamps: true,
  }
);

artworkSchema.plugin(toJSON);

/**
 * @typedef Token
 */
const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork;
