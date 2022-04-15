const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    // PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    DB_NAME: Joi.string().required().description('DB Name'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    // SMTP_HOST: Joi.string().description('server that will send the emails'),
    // SMTP_PORT: Joi.number().description('port to connect to the email server'),
    // SMTP_USERNAME: Joi.string().description('username for email server'),
    // SMTP_PASSWORD: Joi.string().description('password for email server'),
    SG_API_KEY: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    PINATA_API_KEY: Joi.string().description('Pinata api key'),
    PINATA_API_SECRET: Joi.string().description('Pinata api secret'),
    PINATA_API_JWT: Joi.string().description('Pinata api jwt'),
    AWS_ACCESS_KEY_ID: Joi.string().description('aws access key'),
    AWS_SECRET_ACCESS_KEY: Joi.string().description('aws secret access key'),
    AWS_BUCKET: Joi.string().description('aws bucket'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL,
    options: {
      dbName: envVars.DB_NAME,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    // smtp: {
    //   host: envVars.SMTP_HOST,
    //   port: envVars.SMTP_PORT,
    //   auth: {
    //     user: envVars.SMTP_USERNAME,
    //     pass: envVars.SMTP_PASSWORD,
    //   },
    // },
    from: envVars.EMAIL_FROM,
    sendGridApiKey: envVars.SG_API_KEY,
  },
  pinata: {
    api_key: envVars.PINATA_API_KEY,
    api_secret: envVars.PINATA_API_SECRET,
    api_jwt: envVars.PINATA_API_JWT,
  },
  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    bucket: envVars.AWS_BUCKET,
  },
  ETH_CONTRACTS: {
    MINT_NFT_CONTRACT_ADDRESS: '0xcD115512cd665D50D4d0157b1198D308672fE7b5',    // ERC 721 address
    AUCTION_CONTRACT_ADDRESS: '0xad2fB2710eC42297FB159fb502d6251a11FA896c',    // Auction address
    MINT_NFT_ABI: [
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_to",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "_tokenURI",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "mintPrice",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "name": "mintNFT",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_signerAddress",
            "type": "address"
          }
        ],
        "name": "updateSignerAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "mvmtAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_signer",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes",
            "name": "",
            "type": "bytes"
          }
        ],
        "name": "usedSignatures",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    AUC_ABI: [
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "aucId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "collection",
            "type": "address"
          }
        ],
        "name": "NFTclaim",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "aucId",
            "type": "uint256"
          }
        ],
        "name": "auctionCancelled",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "aucId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "collectAuctionAmount",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "colAddress",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "aucId",
            "type": "uint256"
          }
        ],
        "name": "newAuction",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "aucId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "bidder",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "bid",
            "type": "uint256"
          }
        ],
        "name": "newBid",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "colAddress",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "saleId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          }
        ],
        "name": "newSale",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "saleId",
            "type": "uint256"
          }
        ],
        "name": "saleCancelled",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "saleId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "saleCompleted",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "aucId",
            "type": "uint256"
          }
        ],
        "name": "Bid",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "saleId",
            "type": "uint256"
          }
        ],
        "name": "buyNFTsale",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "aucId",
            "type": "uint256"
          }
        ],
        "name": "cancelAuction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "saleId",
            "type": "uint256"
          }
        ],
        "name": "cancelSale",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "aucId",
            "type": "uint256"
          }
        ],
        "name": "claimAuction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "aucId",
            "type": "uint256"
          }
        ],
        "name": "claimNFT",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "aucId",
            "type": "uint256"
          }
        ],
        "name": "collectETH",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "collectionAddress_",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId_",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "startTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "startPrice",
            "type": "uint256"
          }
        ],
        "name": "NewAuction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "collectionAddress_",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId_",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "price_",
            "type": "uint256"
          }
        ],
        "name": "SaleNFT",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address payable",
            "name": "admin_",
            "type": "address"
          }
        ],
        "name": "setAdminWallet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "percentage_",
            "type": "uint256"
          }
        ],
        "name": "setPlatformFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "percentage_",
            "type": "uint256"
          }
        ],
        "name": "setRoyalty",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "AuctionList",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "auctionid",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "startTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endTime",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "colAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "startPrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "latestBid",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "bidderAdd",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "nftClaim",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "cancelled",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "ownerclaim",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user_",
            "type": "address"
          }
        ],
        "name": "getRoyalty",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "latestAucId",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "latestSaleId",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "platformFee",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "SaleList",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "saleId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "colAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "ended",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    WEB_SOCKET_INFURA_URL: 'wss://mainnet.infura.io/ws/v3/a3b23a55e0f04ba6bb97420b6bdd284c',
  },
  ADMIN_DETAILS: {
    ADMIN_PRIVATE_KEY: 'c3982c0de5b9e25fb0953663584f52474c673a79dfc6184652791acdbd63b9cd',
    ADMIN_ADDRESS: '0x192DDbb00E5aA7E3107f82030C4C8AAB1EB903B7'
  }
};
