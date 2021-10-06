const { User, Collection, Artwork, Auction, BuySell } = require('../models');
const { getUserByAddress } = require('../services/user.service');
const { AUCTION_CONTRACT_INSTANCE } = require('../config/contract.config');
const LISTENERS = require('../controllers/listeners.controller');
const { auctionService, bidService } = require('../services');
const EVENT = require('../triggers/custom-events').customEvent;
const { HISTORY_TYPE, TRANSACTION_TYPE, TRANSACTION_ACTIVITY_TYPE, AUCTION_STATUS, SALE_STATUS } = require('../utils/enums');

const updateCollectionAddress = async (CollectionAddress, owner, colName) => {
  const user = await User.findOne({ address: owner });

  const collection = await Collection.findOneAndUpdate(
    { owner: user._id, name: colName },
    {
      collectionAddress: CollectionAddress,
    }
  );

  await Artwork.findOneAndUpdate(
    { collectionId: collection._id },
    {
      tokenId: 1,
    }
  );
  console.log('collection address and artwork token id updated successfully');
};

const handleNewAuction = async (colAddress, tokenId, aucId) => {
  try {
    const collection = await Collection.findOne({ collectionAddress: colAddress });
    const artwork = await Artwork.findOne({ collectionId: collection._id, tokenId: tokenId });

    if (await auctionService.artworkExistsInAuction(artwork._id)) {
      console.log('Artwork is already on auction');
      return;
    }
    let auctionData = await AUCTION_CONTRACT_INSTANCE.methods.AuctionList(aucId).call();
    const { endTime, startPrice } = auctionData;
    const { owner, creater } = artwork;
    const params = {
      initialPrice: startPrice,
      artwork: artwork._id,
      endTime: new Date(endTime * 1000),
      owner,
      creater,
      contractAucId: aucId,
    };

    const auction = await Auction.create(params);
    await User.findOneAndUpdate({ _id: owner }, { $pull: artwork._id });
    await Artwork.findOneAndUpdate({ _id: artwork._id }, { owner: null });
    LISTENERS.openArtworkAuction({ artworkId: artwork._id, auction: auction._id });
  } catch (err) {
    console.log(err);
  }
};

const handleNewSale = async (saleFromContract) => {
  const { colAddress, tokenId, saleId, price } = saleFromContract;
  try {
    const collection = await Collection.findOne({ collectionAddress: colAddress });
    const artwork = await Artwork.findOne({ collectionId: collection._id, tokenId: tokenId });
    if (!artwork.openForSale) {
      const { owner } = artwork;
      const params = {
        price: price,
        artwork: artwork._id,
        owner,
        contractSaleId: saleId,
      };

      const sale = await BuySell.create(params);
      await User.findOneAndUpdate({ _id: owner }, { $pull: artwork._id });
      await Artwork.findOneAndUpdate({ _id: artwork._id }, { owner: null, sale: sale._id, openForSale: true });
    } else {
      console.log('Artwork is already on sale');
    }
  } catch (err) {
    console.log(err);
  }
};

const handleCancelSale = async (saleFromContract) => {
  const { saleId } = saleFromContract;
  try {
    const sale = await BuySell.findOneAndUpdate({ contractSaleId: saleId }, { status: SALE_STATUS.CANCELLED }).populate('artwork');
    const { artwork } = sale;
    const usr = await User.findOneAndUpdate({ _id: sale.owner }, { $push: artwork._id });
    await Artwork.findOneAndUpdate({ _id: artwork._id }, {
      owner: sale.owner,
      isAuctionOpen: false,
      openForSale: false,
      auction: null,
      sale: null,
      auctionMintStatus: null
    });
  } catch (err) {
    console.log(err);
  }
};

const handleSaleComplete = async (saleFromContract) => {
  const { saleId } = saleFromContract;
  try {
    const { owner } = await AUCTION_CONTRACT_INSTANCE.methods.SaleList(saleId).call();
    const sale = await BuySell.findOneAndUpdate({ contractSaleId: saleId }, { status: SALE_STATUS.COMPLETED }).populate('artwork');
    const { artwork } = sale;
    const usr = await User.findOneAndUpdate({ _id: sale.owner }, { $pull: artwork._id });
    const newArtworkOwner = await User.findOneAndUpdate({ address: owner }, { $push: artwork._id });
    await Artwork.findOneAndUpdate({ _id: artwork._id }, {
      owner: newArtworkOwner._id,
      isAuctionOpen: false,
      openForSale: false,
      auction: null,
      sale: null,
      auctionMintStatus: null
    });
  } catch (err) {
    console.log(err);
  }
};

const handleNewBid = async (par) => {
  let { bid, bidder, aucId } = par;

  let auctionData = await AUCTION_CONTRACT_INSTANCE.methods.AuctionList(aucId).call();
  const { colAddress, owner, tokenId } = auctionData;
  const dbBidder = await User.findOne({ address: bidder });
  const dbOwner = await User.findOne({ address: owner });
  const collection = await Collection.findOne({ collectionAddress: colAddress });
  const artwork = await Artwork.findOne({ collectionId: collection._id, tokenId: tokenId });
  const auction = await Auction.findOne({ artwork: artwork._id, contractAucId: aucId });

  const params = {
    bidder: dbBidder._id,
    artwork: artwork._id,
    bid_amount: bid,
    owner: dbOwner._id,
    auction: auction._id,
  };

  const dbBid = await bidService.saveBid(params);

  EVENT.emit('save-bid-in-artwork', {
    artworkId: artwork._id,
    bidId: dbBid._id,
    auctionId: auction._id,
  });

  EVENT.emit('update-artwork-history', {
    artwork: artwork._id,
    message: `Bid placed on artwork`,
    auction: auction._id,
    bid: dbBid._id,
    type: HISTORY_TYPE.BID_PLACED,
  });

  EVENT.emit('send-and-save-notification', {
    receiver: dbOwner._id,
    type: NOTIFICATION_TYPE.NEW_BID,
    extraData: {
      bid: dbBid._id,
    },
  });
};

const handleNFTClaim = async (values) => {
  const { aucId, newOwner, collection } = values;
  const { latestBid } = await AUCTION_CONTRACT_INSTANCE.methods.AuctionList(aucId).call();
  const auction = await Auction.findOneAndUpdate({ contractAucId: aucId }, { nftClaim: true }).populate('artwork');
  const { artwork } = auction;
  const usr = await User.findOneAndUpdate({ _id: artwork.owner }, { $pull: artwork._id });
  const newArtworkOwner = await User.findOneAndUpdate({ address: newOwner }, { $push: artwork._id });
  await Artwork.findOneAndUpdate({ _id: artwork._id }, {
    owner: newArtworkOwner._id,
    isAuctionOpen: false,
    auction: null,
    auctionMintStatus: null,
    sale: null,
    openForSale: false,
  });
  console.log('NFT claimed successfully');

  EVENT.emit('record-transaction', {
    user: newArtworkOwner._id,
    type: TRANSACTION_TYPE.DEBIT,
    amount: latestBid,
    extraData: {
      activityType: TRANSACTION_ACTIVITY_TYPE.NFT_CLAIM,
      auction: auction._id,
    },
  });

  //call debit transaction
};

const handleNFTSale = async (values) => {
  const { aucId, owner, amount } = values;
  const auction = await Auction.findOneAndUpdate({ contractAucId: aucId }, { ownerclaim: true }).populate('artwork');
  const { artwork } = auction;
  const user = await User.findOneAndUpdate({ address: owner }, { $pull: artwork._id });

  EVENT.emit('record-transaction', {
    user: user._id,
    type: TRANSACTION_TYPE.CREDIT,
    amount: amount,
    extraData: {
      activityType: TRANSACTION_ACTIVITY_TYPE.NFT_SALE,
      auction: auction._id,
    },
  });
  console.log('NFT claimed successfully');
};

const handleClaimBack = async (values) => {
  const { aucId } = values;
  const auction = await Auction.findOneAndUpdate({ contractAucId: aucId }, { cancelled: true, status: AUCTION_STATUS.CLOSED }).populate('artwork');
  const { artwork } = auction;
  const usr = await User.findOneAndUpdate({ _id: auction.owner }, { $push: artwork._id });
  await Artwork.findOneAndUpdate({ _id: artwork._id }, {
    owner: auction.owner,
    isAuctionOpen: false,
    auction: null,
    auctionMintStatus: null,
    sale: null,
    openForSale: false,
  });
  console.log('NFT claimed back successfully');
};

module.exports = {
  updateCollectionAddress,
  handleNewAuction,
  handleNewBid,
  handleNFTClaim,
  handleNFTSale,
  handleClaimBack,
  handleNewSale,
  handleCancelSale,
  handleSaleComplete
};
