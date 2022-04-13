const httpStatus = require('http-status');
const web3 = require('web3');
const { userService } = require('.');
const { User, Stats } = require('../models');
const ApiError = require('../utils/ApiError');
const { MusicAlbum } = require('../models');


const createAlbum = async (userBody) => {

  const usr = await MusicAlbum.create(userBody);
  return usr.toObject();
};

const getSingleAlbum = async (id) => {
  const usr = await MusicAlbum.findById(id);
  return usr.toObject();
};
const getUserAlbums = async (userId) => {
  const usr = await User.find({ _id: userId }).populate('musicAlbum');
  return usr;
};

const updateAlbum = async (id, userBody) => {
  const album = await MusicAlbum.findByIdAndUpdate(id, userBody, { new: true });
  return album;
};

const getArtworksFromAlbum = async (id) => {
  const artworks = await MusicAlbum.findById(id).populate('artworks');
  return artworks;
};
module.exports = {
  createAlbum,
  getSingleAlbum,
  getUserAlbums,
  updateAlbum,
  getArtworksFromAlbum,
};
