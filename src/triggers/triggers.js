const CONFIG = require('../config/config');
const EVENT = require('./custom-events').customEvent;
const LISTENERS = require('../controllers/listeners.controller');

EVENT.addListener('add-collection-in-user', LISTENERS.addCollectionInUser);
EVENT.addListener('add-artwork-in-user', LISTENERS.addArtworkInUser);
EVENT.addListener('add-artwork-in-collection', LISTENERS.addArtworkInCollection);
EVENT.addListener('save-bid-in-artwork', LISTENERS.saveBidInArtwork);
EVENT.addListener('open-artwork-auction', LISTENERS.openArtworkAuction);
EVENT.addListener('update-artwork-history', LISTENERS.updateArtworkHistory);
EVENT.addListener('send-and-save-notification', LISTENERS.createNotification);
EVENT.addListener('record-transaction', LISTENERS.createTransaction);
EVENT.addListener('create-stats', LISTENERS.createStats);
EVENT.addListener('stats-artwork-mint', LISTENERS.userStatsUpdate);
EVENT.addListener('add-Album-In-User', LISTENERS.addAlbumInUser);
EVENT.addListener('insert-artwork-in album', LISTENERS.addArtworkInAlbum);
