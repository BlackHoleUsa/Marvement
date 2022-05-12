const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const polySchema = mongoose.Schema({
  poly: {
    type: Number,
    required: false,
  },
});

polySchema.plugin(toJSON);

const Poly = mongoose.model('POLY', polySchema);

module.exports = Poly;
