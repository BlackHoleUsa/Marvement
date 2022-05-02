const httpStatus = require('http-status');
const web3 = require('web3');
const { userService } = require('.');
const { User, Stats } = require('../models');
const ApiError = require('../utils/ApiError');
const { MusicAlbum, Post } = require('../models');
const artworkService = require('./artwork.service');

function paginate(array, page_size, page_number) {
  // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
  return array.slice(page_number * page_size, page_number * page_size + page_size);
}

const createPost = async (userBody) => {
  const post = await Post.create(userBody);
  return post.toObject();
}

const approvePost = async (id) => {
  const post = await Post.findByIdAndUpdate({ _id: id }, { $set: { isApproved: 'true', isRejected: 'false' } }, { new: true });
  return post;
}

const getAllApprovePosts = async () => {
  const posts = await Post.find({ isApproved: 'true' });
  return posts
}

const getAllUnApprovedPost = async () => {
  const posts = await Post.find({ isApproved: 'false' });
  return posts
}

const rejectPost = async (id, reason) => {
  const post = await Post.findByIdAndUpdate({ _id: id }, { $set: { isRejected: 'true', note: reason } }, { new: true });
  return post;
}

const getAllRejectPosts = async () => {
  const posts = await Post.find({ isRejected: 'true' });
  return posts
}


const createAlbum = async (userBody) => {

  const usr = await MusicAlbum.create(userBody);
  let albumArt = {
    isAlbum: true,
    name: userBody.name,
    description: null,
    creater: userBody.creater,
    price: 0,
    image: userBody.coverImage,
    artwork_url: userBody.coverImage,
    collectionId: null,
    artwork_type: null,
    artwork_thumbnail_image: null,
    albumDetails: usr._id,
    genre: usr.genre,
    owner: userBody.creater,
  }
  await artworkService.saveArtwork(albumArt);

  return usr.toObject();
};

const getSingleAlbum = async (id) => {
  const usr = await MusicAlbum.findById(id).populate({
    path: 'artworks',

    populate: [
      {
        path: 'creater',
        model: 'User',
      },

      {

        path: 'owner',
        model: 'User',
      },
      {
        path: 'sale',
        model: 'BuySell',
      },
      {
        path: 'auction',
        model: 'Auction',
      }

    ],
  }).lean();
  return usr;
};
const getUserAlbums = async (userId) => {
  const usr = await MusicAlbum.find({ creater: userId }).populate('creater').lean();
  return usr;
};

const getUserAlbumsCount = async (userId) => {
  const usr = await MusicAlbum.find({ creater: userId }).count();
  return usr;
};


const updateAlbum = async (id, userBody) => {
  const album = await MusicAlbum.findByIdAndUpdate(id, userBody, { new: true });
  return album;
};

const getArtworksFromAlbum = async (id, perPage, page) => {
  const artworks = await MusicAlbum.findById(id).populate({
    path: 'artworks',

    populate: [
      {
        path: 'creater',
        model: 'User',
      },
      {

        path: 'owner',
        model: 'User',
      },
      {
        path: 'sale',
        model: 'BuySell',
      },
      {
        path: 'auction',
        model: 'Auction',
      }

    ],
  }).lean();
  let count = artworks.artworks.length;
  const paginateArtworks = paginate(artworks.artworks, perPage, page);
  let result = {
    count: count,
    artworks: paginateArtworks,
  };
  return result;
};

const deleteAlbum = async (id) => {
  const album = await MusicAlbum.findById(id);
  let artworks = album.artworks;
  if (artworks.length > 0) {
    return false;
  }
  else {
    const artwork = await artworkService.findArtworkAsAlbum(album._id);
    await artworkService.deleteArtworkById(artwork._id);
    await MusicAlbum.findByIdAndDelete(id);
    return true;
  }
}

module.exports = {
  createAlbum,
  getSingleAlbum,
  getUserAlbums,
  updateAlbum,
  getArtworksFromAlbum,
  getUserAlbumsCount,
  deleteAlbum,
  createPost,
  approvePost,
  getAllUnApprovedPost,
  getAllApprovePosts,
  rejectPost,
  getAllRejectPosts,
};
