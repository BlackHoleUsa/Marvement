const express = require('express');
const { generalController } = require('../../controllers');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { generalValidation } = require('../../validations');

const router = express.Router();

router.get('/search', generalController.handleSearch);
router.get('/getAppActivity', validate(generalValidation.getActivityVS), generalController.getAppActivity);

router.get('/getNotifications', [auth('manageUsers')], generalController.getNotifications);

router.get('/getTranscendingArtists', [], generalController.getTranscendingArtists);

router.get('/getLeadingCollectors', [], generalController.getLeadingCollectors);

router.get('/tempUdateUser', [], generalController.tempUdateUser);

module.exports = router;
