const { User, Collection, Artwork, Auction, BuySell } = require('../models');
const { getUserByAddress } = require('../services/user.service');
const { AUCTION_CONTRACT_INSTANCE } = require('../config/contract.config');
const LISTENERS = require('./listeners.controller');
const { auctionService, bidService, artworkService } = require('../services');
const EVENT = require('../triggers/custom-events').customEvent;
const {
  HISTORY_TYPE,
  TRANSACTION_TYPE,
  TRANSACTION_ACTIVITY_TYPE,
  AUCTION_STATUS,
  NOTIFICATION_TYPE,
  SALE_STATUS,
  STATS_UPDATE_TYPE,
} = require('../utils/enums');

const updateCollectionAddress = async (CollectionAddress, owner, colName) => {
  const user = await User.findOne({ address: owner });

  const collection = await Collection.findOneAndUpdate(
    { owner: user._id, name: colName },
    {
      collectionAddress: CollectionAddress,
    }
  );
  console.log(collection._id);
  const artwork = await Artwork.findOneAndUpdate(
    { collectionId: collection._id },
    {
      tokenId: 1,
    }
  );
  console.log(artwork);
  EVENT.emit('stats-artwork-mint', {
    userId: user._id,
    type: STATS_UPDATE_TYPE.ownedArts,
  });
  console.log('collection address and artwork token id updated successfully');
};

const handleNewAuction = async (colAddress, tokenId, aucId) => {
  try {
    const collection = await Collection.findOne({ collectionAddress: colAddress });
    const artwork = await Artwork.findOne({ collectionId: collection._id, tokenId });

    if (await auctionService.artworkExistsInAuction(artwork._id)) {
      console.log('Artwork is already on auction');
      return;
    }
    const auctionData = await AUCTION_CONTRACT_INSTANCE.methods.AuctionList(aucId).call();
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
    await User.findOneAndUpdate({ _id: owner }, { $pull: { artworks: artwork._id } });
    await Artwork.findOneAndUpdate({ _id: artwork._id }, { owner, isAuctionOpen: true, endTime: new Date(endTime * 1000) });
    // await Artwork.findOneAndUpdate({ _id: artwork._id }, { owner: null });
    LISTENERS.openArtworkAuction({ artworkId: artwork._id, auction: auction._id });
  } catch (err) {
    console.log(err);
  }
};

const handleNewSale = async (saleFromContract) => {
  const { colAddress, tokenId, saleId, price } = saleFromContract;
  try {
    const collection = await Collection.findOne({ collectionAddress: colAddress });
    const artwork = await Artwork.findOne({ collectionId: collection._id, tokenId });
    if (!artwork.openForSale) {
      const { owner } = artwork;
      const params = {
        price,
        artwork: artwork._id,
        owner,
        contractSaleId: saleId,
      };

      const sale = await BuySell.create(params);
      await User.findOneAndUpdate({ _id: owner }, { $pull: { artworks: artwork._id } });
      await Artwork.findOneAndUpdate({ _id: artwork._id }, { owner: owner, sale: sale._id, openForSale: true });
      // await Artwork.findOneAndUpdate({ _id: artwork._id }, { owner: null, sale: sale._id, openForSale: true });
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
    const sale = await BuySell.findOneAndUpdate({ contractSaleId: saleId }, { status: SALE_STATUS.CANCELLED }).populate(
      'artwork'
    );
    const { artwork } = sale;
    const usr = await User.findOneAndUpdate({ _id: sale.owner }, { $push: { artworks: artwork._id } });
    await Artwork.findOneAndUpdate(
      { _id: artwork._id },
      {
        owner: sale.owner,
        isAuctionOpen: false,
        openForSale: false,
        auction: null,
        sale: null,
        auctionMintStatus: null,
      }
    );
  } catch (err) {
    console.log(err);
  }
};

const handleSaleComplete = async (saleFromContract) => {
  const { saleId, newOwner } = saleFromContract;
  console.log(saleFromContract);
  try {
    const sale = await BuySell.findOneAndUpdate({ contractSaleId: saleId }, { status: SALE_STATUS.COMPLETED }).populate(
      'artwork'
    );
    const { artwork } = sale;
    const usr = await User.findOneAndUpdate({ _id: sale.owner }, { $pull: { artworks: artwork._id } });
    EVENT.emit('update-artwork-history', {
      artwork: artwork._id,
      message: `${usr.userName} was the owner`,
      type: HISTORY_TYPE.OWNERSHIP,
    });
    const newArtworkOwner = await User.findOneAndUpdate({ address: newOwner }, { $push: { artworks: artwork._id } });
    const artwork1 = await Artwork.findOne({ _id: artwork._id });
    console.log("artwork1", artwork1);
    const collection1 = await Collection.findOne({ _id: artwork1.collection });
    console.log("collection1", collection1);
    const response = await Collection.findOneAndUpdate(
      { _id: artwork1.collection },
      { $pull: { artworks: artwork1._id } },
      { new: true }
    );
    console.log('artwork removed from collection successfully', response);
    await Artwork.findOneAndUpdate(
      { _id: artwork._id },
      {
        owner: newArtworkOwner._id,
        basePrice: artwork.price,
        price: sale.price,
        isAuctionOpen: false,
        openForSale: false,
        auction: null,
        sale: null,
        auctionMintStatus: null,
      }
    );
    await BuySell.findOneAndUpdate({ _id: sale._id }, { buyer: newArtworkOwner._id });
    console.log('NFT Sale complete');
    EVENT.emit('record-transaction', {
      user: newArtworkOwner._id,
      type: TRANSACTION_TYPE.DEBIT,
      amount: sale.price,
      extraData: {
        activityType: TRANSACTION_ACTIVITY_TYPE.BUY_OP,
        sale: sale._id,
      },
    });
    EVENT.emit('record-transaction', {
      user: sale.owner,
      type: TRANSACTION_TYPE.CREDIT,
      amount: sale.price,
      extraData: {
        activityType: TRANSACTION_ACTIVITY_TYPE.BUY_OP,
        sale: sale._id,
      },
    });
    EVENT.emit('stats-artwork-mint', {
      userId: newArtworkOwner._id,
      type: STATS_UPDATE_TYPE.purchasedArts,
      amount: sale.price,
    });
    EVENT.emit('stats-artwork-mint', {
      userId: sale.owner,
      type: STATS_UPDATE_TYPE.soldArts,
      amount: sale.price,
    });
    EVENT.emit('send-and-save-notification', {
      receiver: sale.owner,
      type: NOTIFICATION_TYPE.NFT_BUY,
      message: `${newArtworkOwner.userName} has bought the artwork`,
      extraData: {
        sale: sale._id,
      },
    });
  } catch (err) {
    console.log(err);
  }
};

const handleNewBid = async (par) => {
  const { bid, bidder, aucId } = par;

  const auctionData = await AUCTION_CONTRACT_INSTANCE.methods.AuctionList(aucId).call();
  const { colAddress, owner, tokenId } = auctionData;
  const dbBidder = await User.findOne({ address: bidder });
  const dbOwner = await User.findOne({ address: owner });
  const collection = await Collection.findOne({ collectionAddress: colAddress });
  const artwork = await Artwork.findOne({ collectionId: collection._id, tokenId });
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
    message: `${dbBidder.userName} has placed the bid`,
    auction: auction._id,
    bid: dbBid._id,
    type: HISTORY_TYPE.BID_PLACED,
  });

  EVENT.emit('send-and-save-notification', {
    receiver: dbOwner._id,
    type: NOTIFICATION_TYPE.NEW_BID,
    message: `${dbBidder.userName} has placed the bid`,
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
  EVENT.emit('update-artwork-history', {
    artwork: artwork._id,
    message: `${usr.userName} was the owner`,
    type: HISTORY_TYPE.OWNERSHIP,
  });
  const newArtworkOwner = await User.findOneAndUpdate({ address: newOwner }, { $push: { artworks: artwork._id } });
  const artwork1 = Artwork.findOne({ _id: artwork._id });
  console.log("artwork1", artwork1);
  const collection1 = await Collection.findOne({ _id: artwork1.collection });
  console.log("collection1", collection1);
  const response = await Collection.findOneAndUpdate(
    { _id: artwork1.collection },
    { $pull: { artworks: artwork1._id } },
    { new: true }
  );
  console.log('artwork removed from collection successfully', response);
  await Artwork.findOneAndUpdate(
    { _id: artwork._id },
    {
      owner: newArtworkOwner._id,
      basePrice: artwork.price,
      price: latestBid,
      isAuctionOpen: false,
      auction: null,
      auctionMintStatus: null,
      sale: null,
      openForSale: false,
    }
  );
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

  EVENT.emit('stats-artwork-mint', {
    userId: newArtworkOwner._id,
    type: STATS_UPDATE_TYPE.purchasedArts,
    amount: latestBid,
  });

  EVENT.emit('send-and-save-notification', {
    receiver: auction.owner,
    message: `${newArtworkOwner.userName} has claimed the artwork`,
    type: NOTIFICATION_TYPE.AUCTION_WIN,
    extraData: {
      auction: auction._id,
    },
  });
};

const handleNFTSale = async (values) => {
  const { aucId, owner, amount } = values;
  const auction = await Auction.findOneAndUpdate({ contractAucId: aucId }, { ownerclaim: true }).populate('artwork');
  const { artwork } = auction;
  const user = await User.findOneAndUpdate({ address: owner }, { $pull: artwork._id });

  EVENT.emit('record-transaction', {
    user: user._id,
    type: TRANSACTION_TYPE.CREDIT,
    amount,
    extraData: {
      activityType: TRANSACTION_ACTIVITY_TYPE.NFT_SALE,
      auction: auction._id,
    },
  });

  EVENT.emit('stats-artwork-mint', {
    userId: user._id,
    type: STATS_UPDATE_TYPE.soldArts,
    amount,
  });
  console.log('NFT claimed successfully');
};

const handleClaimBack = async (values) => {
  const { aucId } = values;
  const auction = await Auction.findOneAndUpdate(
    { contractAucId: aucId },
    { cancelled: true, status: AUCTION_STATUS.CLOSED }
  ).populate('artwork');
  const usr = await User.findOneAndUpdate({ _id: auction.owner }, { $push: { artworks: auction.artwork } });
  const artwork1 = Artwork.findOne({ _id: auction.artwork });
  const response = await Collection.findOneAndUpdate(
    { _id: artwork1.collection },
    { $pull: { artworks: artwork1._id } },
    { new: true }
  );
  console.log('artwork removed from collection successfully', response);
  await Artwork.findOneAndUpdate(
    { _id: auction.artwork },
    {
      owner: auction.owner,
      isAuctionOpen: false,
      auction: null,
      auctionMintStatus: null,
      sale: null,
      openForSale: false,
    }
  );
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
  handleSaleComplete,
};
