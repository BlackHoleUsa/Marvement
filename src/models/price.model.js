const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const priceSchema = mongoose.Schema({
  counter: {
    type: Number,
    required: false,
  },
});

priceSchema.plugin(toJSON);

const Price = mongoose.model('Price', priceSchema);

module.exports = Price;
