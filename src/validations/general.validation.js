const Joi = require('joi');
const { password } = require('./custom.validation');

const getActivityVS = {
  // query: Joi.object().keys({
  //   // page: Joi.string().required(),
  //   // perPage: Joi.string().required(),
  // }),
};

module.exports = {
  getActivityVS,
};
