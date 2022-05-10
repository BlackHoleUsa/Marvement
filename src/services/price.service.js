const { Price } = require('../models');

const addPriceCounter = async () => {
  return await Price.create({ counter: 0 });
};

const incrementPriceCounter = async () => {
  let prices = await Price.find().lean();
  const price = prices[0];
  return await Price.findOneAndUpdate({ _id: price._id }, { $inc: { counter: 1 } });
};

const getPriceCounter = async () => {
  let prices = await Price.find();
  const price = prices[0];
  return price;
};
module.exports = {
  addPriceCounter,
  incrementPriceCounter,
  getPriceCounter,
};
