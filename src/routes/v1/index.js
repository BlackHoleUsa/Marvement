const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const collectionRoute = require('./collection.route');
const artworkRoute = require('./artwork.route');
const salesRoute = require('./sales.route');
const auctionRoute = require('./auction.route');
const generalRoute = require('./general.route');
const musicRoute = require('./musicAlbum.route');

const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/collection',
    route: collectionRoute,
  },
  {
    path: '/artwork',
    route: artworkRoute,
  },
  {
    path: '/sales',
    route: salesRoute,
  },
  {
    path: '/auction',
    route: auctionRoute,
  },
  {
    path: '/general',
    route: generalRoute,
  },
  {
    path: '/album',
    route: musicRoute,
  }
];

const devRoutes = [
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
