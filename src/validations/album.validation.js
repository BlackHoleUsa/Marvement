const Joi = require('joi');
const { password } = require('./custom.validation');

const createAlbum = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    coverImage: Joi.string().optional(),
    tracks: Joi.number().required(),
    genre: Joi.string().required(),
  }),
};

const updateAlbum = {
  body: Joi.object().keys({
    name: Joi.string().optional(),
    coverImage: Joi.string().optional(),
    track: Joi.number().optional(),
    genre: Joi.string().optional(),
  }),
};

const getArtworksFromAlbum = {
  query: Joi.object().keys({
    albumId: Joi.string().required(),
    page: Joi.number().required(),
    perPage: Joi.number().required(),
  }),
};

const getSingleAlbum = {
  query: Joi.object().keys({
    albumId: Joi.string().required()
  }),
};






module.exports = {
  createAlbum,
  updateAlbum,
  getArtworksFromAlbum,
  getSingleAlbum,
};
