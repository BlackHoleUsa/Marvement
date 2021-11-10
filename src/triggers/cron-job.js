// var cron = require('node-cron');
const { auctionService } = require('../services');
const config = require('../config/config');
const logger = require('../config/logger');
// cron.schedule('* * * * *', async () => {
// await auctionService.checkAndCompleteAuctionStatus();
// });
const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);
mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
  logger.info('Connected to MongoDB');
  try {
    await auctionService.checkAndCompleteAuctionStatus();
  } catch (e) {
    console.log(e);
  }
});
