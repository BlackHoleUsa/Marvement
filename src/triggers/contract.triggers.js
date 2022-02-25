const { MINT_CONTRACT_INSTANCE, AUCTION_CONTRACT_INSTANCE } = require('../config/contract.config');
const { contractController } = require('../controllers');
const { MINT_CONTRACT_EVENTS, AUC_CONTRACT_EVENTS } = require('../utils/enums');
// var contractInfo = require('./contractInfo');
// const Web3 = require('web3')

// const infura = "wss://rinkeby.infura.io/ws/v3/c944b72ce9b74c77aac906c6a59f4e99"
// const web3 = new Web3(new Web3.providers.WebsocketProvider(infura));

// const contract = new web3.eth.Contract(contractInfo.marketMinterabi, contractInfo.marketMinterAddress);

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
      console.log("In Mint events")
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

// const transferEvent = async () => {

//   console.log("Listening for transfer on eth")

//   await contract.events.newCollection()
//     .on('data', (event) => {
//       console.log("Got Event on eth")
//       // if (event.returnValues.to) {

//       to = event.returnValues.CollectionAddress
//       from = event.returnValues.owner
//       // amount = event.returnValues.value

//       // if (to == process.env.SYSTEM_ADDRESS) {
//       //   mintTrx.mint(from, amount);
//       // }
//       // else {
//       //   console.log("Ignore others")
//       // }
//       // }
//     })
//     .on('error', console.error);

// }
// transferEvent();
