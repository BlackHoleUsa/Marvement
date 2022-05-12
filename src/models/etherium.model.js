const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const ethSchema = mongoose.Schema({
  eth: {
    type: Number,
    required: false,
  },
});

ethSchema.plugin(toJSON);

const Etherium = mongoose.model('Eth', ethSchema);

module.exports = Etherium;
