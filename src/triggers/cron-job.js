// var cron = require('node-cron');
const cron = require('node-cron');
const { artworkService } = require('../services');
const config = require('../config/config');
const logger = require('../config/logger');

module.exports = () => {
  var nodeCron = cron.schedule('* * * * *', async () => {
    console.log('cronjob ready for Etherium');
    artworkService.ethValue();
    console.log('-----------------------------------------');
    console.log('cronjob ready for POly');
    artworkService.polyValue();
  });
};
