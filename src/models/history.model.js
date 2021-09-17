const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const historySchema = mongoose.Schema(
  {
    artwork: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Artwork',
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    auction: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Auction',
    },
    collection: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Collection',
    },
    message: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

historySchema.plugin(toJSON);

const History = mongoose.model('History', historySchema);

module.exports = History;
