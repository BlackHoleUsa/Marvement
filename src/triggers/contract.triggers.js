const { MINT_CONTRACT_INSTANCE, AUCTION_CONTRACT_INSTANCE, MINT_CONTRACT_INSTANCE_POLY, AUCTION_CONTRACT_INSTANCE_POLY } = require('../config/contract.config');
const { contractController, contractPolyController } = require('../controllers');
const { MINT_CONTRACT_EVENTS, AUC_CONTRACT_EVENTS } = require('../utils/enums');

MINT_CONTRACT_INSTANCE.events.allEvents(async (err, ev) => {
  if (err) {
    console.error('Error', err);
    return;
  }

  console.log('Event', ev);

  switch (ev.event) {
    case MINT_CONTRACT_EVENTS.NEW_COLLECTION:
      const { CollectionAddress, owner, colName } = ev.returnValues;
      console.log("Mint return values", ev.returnValues);
      contractController.updateCollectionAddress(CollectionAddress, owner, colName);
      break;
    case MINT_CONTRACT_EVENTS.TRANSFER:
      console.log(ev.returnValues);
      contractController.transfer(ev.returnValues);
      break;

    default:
      console.log('In Mint events');
  }
});

AUCTION_CONTRACT_INSTANCE.events.allEvents(async (err, ev) => {
  if (err) {
    console.error('Error', err);
    return;
  }

  console.log('Event', ev);

  switch (ev.event) {
    case AUC_CONTRACT_EVENTS.NEW_AUCTION:
      console.log('Event', ev);
      let { colAddress, tokenId, aucId } = ev.returnValues;
      contractController.handleNewAuction(colAddress, tokenId, aucId);
      break;
    case AUC_CONTRACT_EVENTS.NEW_BID:
      contractController.handleNewBid(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.CLAIM_SALE:
      console.log('Event', ev);
      contractController.handleNFTSale(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.NFT_CLAIM:
      contractController.handleNFTClaim(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.CLAIM_BACK:
      contractController.handleClaimBack(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.NEW_SALE:
      contractController.handleNewSale(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.SALE_CANCELLED:
      contractController.handleCancelSale(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.SALE_COMPLETED:
      contractController.handleSaleComplete(ev.returnValues);
      break;
  }
});


MINT_CONTRACT_INSTANCE_POLY.events.allEvents(async (err, ev) => {
  if (err) {
    console.error('Error', err);
    return;
  }

  console.log('Event', ev);

  switch (ev.event) {
    case MINT_CONTRACT_EVENTS.NEW_COLLECTION:
      const { CollectionAddress, owner, colName } = ev.returnValues;
      console.log("Mint return values", ev.returnValues);
      contractPolyController.updateCollectionAddress(CollectionAddress, owner, colName);
      break;
    case MINT_CONTRACT_EVENTS.TRANSFER:
      console.log(ev.returnValues);
      contractPolyController.transfer(ev.returnValues);
      break;

    default:
      console.log('In Mint events');
  }
});

AUCTION_CONTRACT_INSTANCE_POLY.events.allEvents(async (err, ev) => {
  if (err) {
    console.error('Error', err);
    return;
  }

  console.log('Event', ev);

  switch (ev.event) {
    case AUC_CONTRACT_EVENTS.NEW_AUCTION:
      console.log('Event', ev);
      let { colAddress, tokenId, aucId } = ev.returnValues;
      contractPolyController.handleNewAuction(colAddress, tokenId, aucId);
      break;
    case AUC_CONTRACT_EVENTS.NEW_BID:
      contractPolyController.handleNewBid(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.CLAIM_SALE:
      console.log('Event', ev);
      contractPolyController.handleNFTSale(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.NFT_CLAIM:
      contractPolyController.handleNFTClaim(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.CLAIM_BACK:
      contractPolyController.handleClaimBack(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.NEW_SALE:
      contractPolyController.handleNewSale(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.SALE_CANCELLED:
      contractPolyController.handleCancelSale(ev.returnValues);
      break;
    case AUC_CONTRACT_EVENTS.SALE_COMPLETED:
      contractPolyController.handleSaleComplete(ev.returnValues);
      break;
  }
});
