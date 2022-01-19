const Joi = require('joi');
const { password } = require('./custom.validation');

const createCollectionVS = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    owner: Joi.string().required(),
    coverImage: Joi.string().optional(),
    profileImage: Joi.string().optional(),
    royality: Joi.number().optional(),
    symbol: Joi.string().optional(),
  }),
};

const updateCollectionVS = {
  body: Joi.object().keys({
    collectionId: Joi.string().required(),
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    coverImage: Joi.string().optional(),
    royality: Joi.number().optional(),
    profileImage: Joi.string().optional(),
  }),
};

const getCollectionVS = {
  query: Joi.object().keys({
    userId: Joi.string().required(),
    page: Joi.string().required(),
    perPage: Joi.string().required(),
  }),
};

const singleCollectionVS = {
  query: Joi.object().keys({
    collectionId: Joi.string().required(),
  }),
};

const getAllCollectionsVS = {
  query: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const deleteCollectionsVS = {
  body: Joi.object().keys({
    collectionId: Joi.string().required(),
  }),
};

module.exports = {
  createCollectionVS,
  getCollectionVS,
  singleCollectionVS,
  updateCollectionVS,
  getAllCollectionsVS,
  deleteCollectionsVS,
};
