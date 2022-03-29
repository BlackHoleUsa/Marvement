const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const generesSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

generesSchema.plugin(toJSON);

/**
 * @typedef Token
 */
const Generes = mongoose.model('Generes', generesSchema);

module.exports = Generes;
