const { User, Collection, Artwork, Auction, BuySell } = require('../models');
const { getUserByAddress } = require('../services/user.service');
const { AUCTION_CONTRACT_INSTANCE } = require('../config/contract.config');
const LISTENERS = require('./listeners.controller');
const { auctionService, bidService, artworkService } = require('../services');
const EVENT = require('../triggers/custom-events').customEvent;
const Web3 = require('web3');
const {
  HISTORY_TYPE,
  TRANSACTION_TYPE,
  TRANSACTION_ACTIVITY_TYPE,
  AUCTION_STATUS,
  NOTIFICATION_TYPE,
  SALE_STATUS,
  STATS_UPDATE_TYPE,
} = require('../utils/enums');

const convertFromWei = (amount) => {
  console.log('converttoWei');
  return Web3.utils.fromWei(`${amount}`, 'ether');
};

const transfer = async (transferContract) => {
  let { from, to, tokenId } = transferContract;
  from = from.toLowerCase();
  to = to.toLowerCase();
  console.log("transferContract", transferContract);
  let auctionContractAddress = "0xad2fB2710eC42297FB159fb502d6251a11FA896c";
  auctionContractAddress = auctionContractAddress.toLowerCase();
  let mintContractAddress = "0xF610A19aBF2C4035650b11d9CD0E0ff9cE448f5e";
  mintContractAddress = mintContractAddress.toLowerCase();
  const result = await User.find({ address: to });
  console.log(result);
  try {
    if (
      from.toString() !== '0x0000000000000000000000000000000000000000' &&
      result.length === 0 &&
      to.toString() !== auctionContractAddress && // auction contract
      from.toString() !== mintContractAddress // mint contract
    ) {
      const artwork = await Artwork.findOne({ tokenId });
      await User.findOneAndUpdate({ address: from }, { $pull: { artworks: artwork._id } });
      await Auction.findOneAndDelete({ artwork: artwork._id });
      await BuySell.findOneAndDelete({ artwork: artwork._id });
      await Artwork.findOneAndDelete({ _id: artwork._id });
      console.log('transfer event called unregistered');
    } else {
      console.log('mint');
    }
  } catch (error) {
    console.log(error);
  }
};
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
    const artwork = await Artwork.findOne({ tokenId });

    if (await auctionService.artworkExistsInAuction(artwork._id)) {
      console.log('Artwork is already on auction');
      return;
    }
    const auctionData = await AUCTION_CONTRACT_INSTANCE.methods.AuctionList(aucId).call();
    const { endTime, startPrice } = auctionData;
    const { owner, creater } = artwork;
    const params = {
      initialPrice: convertFromWei(startPrice),
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
    const artwork = await Artwork.findOne({ tokenId });
    if (!artwork.openForSale) {
      const { owner } = artwork;
      const params = {
        price: convertFromWei(price),
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
  let { saleId, newOwner } = saleFromContract;
  newOwner = newOwner.toLowerCase();
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
  let { bid, bidder, aucId } = par;
  bidder = bidder.toLowerCase();
  const auctionData = await AUCTION_CONTRACT_INSTANCE.methods.AuctionList(aucId).call();
  let { colAddress, owner, tokenId } = auctionData;
  owner = owner.toLowerCase();
  const dbBidder = await User.findOne({ address: bidder });
  console.log("dbBidder", dbBidder);
  const dbOwner = await User.findOne({ address: owner });
  const collection = await Collection.findOne({ collectionAddress: colAddress });
  const artwork = await Artwork.findOne({ tokenId });
  const auction = await Auction.findOne({ artwork: artwork._id, contractAucId: aucId });

  const params = {
    bidder: dbBidder._id,
    artwork: artwork._id,
    bid_amount: convertFromWei(bid),
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
  console.log(`${dbBidder.userName} has placed the bid`);
};

const handleNFTClaim = async (values) => {
  let { aucId, newOwner } = values;
  newOwner = newOwner.toLowerCase();
  const { latestBid } = await AUCTION_CONTRACT_INSTANCE.methods.AuctionList(aucId).call();
  const auction = await Auction.findOneAndUpdate(
    { contractAucId: aucId },
    { nftClaim: true, status: AUCTION_STATUS.CLOSED }
  ).populate('artwork');
  const { artwork } = auction;
  const usr = await User.findOneAndUpdate({ _id: artwork.owner }, { $pull: artwork._id });
  EVENT.emit('update-artwork-history', {
    artwork: artwork._id,
    message: `${usr.userName} was the owner`,
    type: HISTORY_TYPE.OWNERSHIP,
  });
  const newArtworkOwner = await User.findOneAndUpdate({ address: newOwner }, { $push: { artworks: artwork._id } });
  await Artwork.findOneAndUpdate(
    { _id: artwork._id },
    {
      owner: newArtworkOwner._id,
      basePrice: artwork.price,
      price: convertFromWei(latestBid),
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
    amount: convertFromWei(latestBid),
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
  let { aucId, owner, amount } = values;
  owner = owner.toLowerCase();
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
  transfer,
};
