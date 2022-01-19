const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const collectionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    coverImage: {
      type: String,
      required: false,
      trim: true,
    },
    collectionAddress: {
      type: String,
      required: false,
      trim: true,
    },
    symbol: {
      type: String,
      required: false,
      trim: true,
    },
    profileImage: {
      type: String,
      required: false,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    royality: {
      type: Number,
      required: false,
    },
    artworks: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Artwork',
        required: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
collectionSchema.plugin(toJSON);

/**
 * @typedef Token
 */
const Collection = mongoose.model('Collection', collectionSchema);

module.exports = Collection;
