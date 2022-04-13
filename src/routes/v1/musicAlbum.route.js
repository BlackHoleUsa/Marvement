const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const musicAlbumController = require('../../controllers/musicAlbum.controller');
const { albumValidation } = require('../../validations');


const router = express.Router();

router.post('/createAlbum', [auth('manageUsers'),
validate(albumValidation.createAlbum)],
  musicAlbumController.createAlbum);
router.get('/getUserAlbum', [auth('manageUsers')], musicAlbumController.getUserAlbum);
router.get('/getSingleAlbum', validate(albumValidation.getSingleAlbum), musicAlbumController.getSingleAlbum);
router.post('/updateAlbum', [auth('manageUsers'), validate(albumValidation.updateAlbum)], musicAlbumController.updateAlbum);
router.get('/getArtworksFromAlbum', validate(albumValidation.getArtworksFromAlbum), musicAlbumController.getArtworksFromAlbum);


module.exports = router;
