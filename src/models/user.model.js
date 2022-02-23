const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
  {
    userName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    profilePic: {
      type: String,
      required: false,
      trim: true,
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    bio: {
      type: String,
      required: false,
    },
    // password: {
    //   type: String,
    //   required: true,
    //   trim: true,
    //   minlength: 8,
    //   validate(value) {
    //     if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    //       throw new Error('Password must contain at least one letter and one number');
    //     }
    //   },
    //   private: true, // used by the toJSON plugin
    // },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    stats: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Stats',
    },
    collections: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Collection',
      },
    ],
    artworks: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Artwork',
      },
    ],
    favouriteArtworks: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Artwork',
      },
    ],
    followers: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
      },
    ],
    creations: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Artwork',
      },
    ],
    platformfee: {
      type: Number,
      required: false,
      default: 0,
    },
    royality: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 *
 * @param {string} address
 * @param {ObjectId} excludeUserId
 * @returns {Promise<boolean>}
 */
userSchema.statics.isAddressTaken = async function (address, excludeUserId) {
  const user = await this.findOne({ address, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 *
 * @param {string} userName
 * @param {ObjectId} excludeUserId
 * @returns {Promise<boolean>}
 */

userSchema.statics.isUsernameTaken = async function (userName, excludeUserId) {
  const user = await this.findOne({ userName, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
