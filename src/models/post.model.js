const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { ARTWORK_TYPE } = require('../utils/enums');

const postSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },

    image_url: {
      type: String,
      required: false,
      trim: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },
    isRejected: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      required: false,
    },

  },
  {
    timestamps: true,
  }
);

postSchema.plugin(toJSON);

/**
 * @typedef Token
 */
const Post = mongoose.model('Post', postSchema);

module.exports = Post;
