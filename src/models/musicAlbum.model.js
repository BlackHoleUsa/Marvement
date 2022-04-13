const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const musicAlbum = mongoose.Schema(
  {
    coverImage: {
      type: String,

    },
    name: {
      type: String,
    },
    tracks: {
      type: Number,
    },
    genre: {
      type: String,
    },
    artworks: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Artwork',
      },
    ],
    creater: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

musicAlbum.plugin(toJSON);

/**
 * @typedef Token
 */
const MusicAlbum = mongoose.model('MusicAlbum', musicAlbum);

module.exports = MusicAlbum;
