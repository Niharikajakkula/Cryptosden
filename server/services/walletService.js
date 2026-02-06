const crypto = require('crypto');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

class WalletService {
  // Supported cryptocurrencies with their configurations
  static SUPPORTED_CRYPTOS = {
    BTC: {
      name: 'Bitcoin',
      decimals: 8,
      minDeposit: 0.0001,
      minWithdrawal: 0.001,
      withdrawalFee: 0.0005,
      confirmations: 6
    },
    ETH: {
      name: 'Ethereum',
      decimals: 18,
      minDeposit: 0.001,
      minWithdrawal: 0.01,
      withdrawalFee: 0.005,
      confirmations: 12
    },
    USDT: {
      name: 'Tether',
      decimals: 6,
      minDeposit: 1,
      minWithdrawal: 10,
      withdrawalFee: 5,
      confirmations: 12
    },
    BNB: {
      name: 'Binance Coin',
      decimals: 18,
      minDeposit: 0.01,
      minWithdrawal: 0.1,
      withdrawalFee: 0.01,
      confirmations: 15
    }
  };

  // Generate a new wallet address (simplified - in production use proper crypto libraries)
  static generateWalletAddress(cryptocurrency) {
    const prefix = this.getAddressPrefix(cryptocurrency);
    const randomBytes = crypto.randomBytes(20);
    const address = prefix + randomBytes.toString('hex');
    return address;
  }

  // Get address prefix for different cryptocurrencies
  static getAddressPrefix(cryptocurrency) {
    const prefixes = {
      BTC: '1',
      ETH: '0x',
      USDT: '0x',
      BNB: 'bnb'
    };
    return prefixes[cryptocurrency] || '0x';
  }

  // Generate private key (simplified - use proper crypto libraries in production)
  static generatePrivateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate seed phrase (simplified - use BIP39 in production)
  static generateSeedPhrase() {
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'
    ];
    
    const seedPhrase = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = crypto.randomInt(0, words.length);
      seedPhrase.push(words[randomIndex]);
    }
    
    return seedPhrase.join(' ');
  }

  // Create a new wallet for a user
  static async createWallet(userId, cryptocurrency, label = null, password) {
    try {
      // Validate cryptocurrency
      if (!this.SUPPORTED_CRYPTOS[cryptocurrency]) {
        throw new Error(`Unsupported cryptocurrency: ${cryptocurrency}`);
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate wallet credentials
      const address = this.generateWalletAddress(cryptocurrency);
      const privateKey = this.generatePrivateKey();
      const seedPhrase = this.generateSeedPhrase();

      // Encrypt private key and seed phrase
      const encryptedPrivateKey = this.encryptData(privateKey, password);
      const encryptedSeedPhrase = this.encryptData(seedPhrase, password);

      // Check if this is the first wallet of this cryptocurrency for the user
      const existingWallets = await Wallet.find({ userId, cryptocurrency, isActive: true });
      const isDefault = existingWallets.length === 0;

      // Create wallet
      const wallet = new Wallet({
        userId,
        cryptocurrency,
        address,
        privateKeyEncrypted: JSON.stringify(encryptedPrivateKey),
        seedPhraseEncrypted: JSON.stringify(encryptedSeedPhrase),
        label: label || `${cryptocurrency} Wallet`,
        isDefault,
        requiresConfirmation: true,
        dailyLimit: this.SUPPORTED_CRYPTOS[cryptocurrency].minWithdrawal * 1000
      });

      await wallet.save();

      // Return wallet without sensitive data
      return {
        id: wallet._id,
        cryptocurrency: wallet.cryptocurrency,
        address: wallet.address,
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        label: wallet.label,
        isDefault: wallet.isDefault,
        backupStatus: wallet.backupStatus,
        createdAt: wallet.createdAt,
        seedPhrase: seedPhrase // Return once for backup
      };
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  // Get user wallets
  static async getUserWallets(userId) {
    try {
      const wallets = await Wallet.findUserWallets(userId);
      
      return wallets.map(wallet => ({
        id: wallet._id,
        cryptocurrency: wallet.cryptocurrency,
        address: wallet.address,
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        lockedBalance: wallet.lockedBalance,
        label: wallet.label,
        isDefault: wallet.isDefault,
        isActive: wallet.isActive,
        backupStatus: wallet.backupStatus,
        lastActivity: wallet.lastActivity,
        createdAt: wallet.createdAt
      }));
    } catch (error) {
      throw new Error(`Failed to get user wallets: ${error.message}`);
    }
  }

  // Get wallet by ID
  static async getWalletById(walletId, userId) {
    try {
      const wallet = await Wallet.findOne({ _id: walletId, userId, isActive: true });
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      return {
        id: wallet._id,
        cryptocurrency: wallet.cryptocurrency,
        address: wallet.address,
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        lockedBalance: wallet.lockedBalance,
        label: wallet.label,
        isDefault: wallet.isDefault,
        backupStatus: wallet.backupStatus,
        dailyLimit: wallet.dailyLimit,
        lastActivity: wallet.lastActivity,
        createdAt: wallet.createdAt
      };
    } catch (error) {
      throw new Error(`Failed to get wallet: ${error.message}`);
    }
  }

  // Process deposit
  static async processDeposit(address, amount, txHash, confirmations = 0) {
    try {
      const wallet = await Wallet.findByAddress(address);
      if (!wallet) {
        throw new Error('Wallet not found for address');
      }

      // Check if transaction already exists
      const existingTx = await Transaction.findOne({ txHash });
      if (existingTx) {
        // Update confirmations
        return await existingTx.updateConfirmations(confirmations);
      }

      // Create deposit transaction
      const transaction = new Transaction({
        userId: wallet.userId,
        walletId: wallet._id,
        type: 'deposit',
        cryptocurrency: wallet.cryptocurrency,
        amount: amount,
        fee: 0,
        netAmount: amount,
        status: confirmations >= this.SUPPORTED_CRYPTOS[wallet.cryptocurrency].confirmations ? 'confirmed' : 'pending',
        txHash,
        confirmations,
        requiredConfirmations: this.SUPPORTED_CRYPTOS[wallet.cryptocurrency].confirmations,
        toAddress: address,
        description: `${wallet.cryptocurrency} deposit`
      });

      await transaction.save();

      // Update wallet balance if confirmed
      if (transaction.status === 'confirmed') {
        await wallet.updateBalance(amount, 'add');
      }

      return transaction;
    } catch (error) {
      throw new Error(`Failed to process deposit: ${error.message}`);
    }
  }

  // Process withdrawal
  static async processWithdrawal(userId, walletId, toAddress, amount, password) {
    try {
      const wallet = await Wallet.findOne({ _id: walletId, userId, isActive: true });
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const cryptoConfig = this.SUPPORTED_CRYPTOS[wallet.cryptocurrency];
      
      // Validate amount
      if (amount < cryptoConfig.minWithdrawal) {
        throw new Error(`Minimum withdrawal amount is ${cryptoConfig.minWithdrawal} ${wallet.cryptocurrency}`);
      }

      const fee = cryptoConfig.withdrawalFee;
      const totalAmount = amount + fee;

      // Check available balance
      if (wallet.availableBalance < totalAmount) {
        throw new Error('Insufficient balance');
      }

      // Lock the amount
      await wallet.lockBalance(totalAmount);

      try {
        // Create withdrawal transaction
        const transaction = new Transaction({
          userId,
          walletId,
          type: 'withdrawal',
          cryptocurrency: wallet.cryptocurrency,
          amount: amount,
          fee: fee,
          netAmount: amount,
          status: 'pending',
          fromAddress: wallet.address,
          toAddress: toAddress,
          description: `${wallet.cryptocurrency} withdrawal to ${toAddress}`
        });

        await transaction.save();

        // In a real implementation, this would interact with blockchain
        // For now, we'll simulate the withdrawal process
        setTimeout(async () => {
          try {
            // Simulate blockchain transaction
            const txHash = crypto.randomBytes(32).toString('hex');
            await transaction.markAsConfirmed(txHash);
            
            // Update wallet balance
            await wallet.updateBalance(totalAmount, 'subtract');
            await wallet.unlockBalance(totalAmount);
          } catch (error) {
            await transaction.markAsFailed(error.message);
            await wallet.unlockBalance(totalAmount);
          }
        }, 5000); // Simulate 5 second processing time

        return transaction;
      } catch (error) {
        // Unlock balance if transaction creation failed
        await wallet.unlockBalance(totalAmount);
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to process withdrawal: ${error.message}`);
    }
  }

  // Process internal transfer
  static async processInternalTransfer(fromUserId, fromWalletId, toAddress, amount) {
    try {
      const fromWallet = await Wallet.findOne({ _id: fromWalletId, userId: fromUserId, isActive: true });
      if (!fromWallet) {
        throw new Error('Source wallet not found');
      }

      const toWallet = await Wallet.findByAddress(toAddress);
      if (!toWallet) {
        throw new Error('Destination wallet not found');
      }

      if (fromWallet.cryptocurrency !== toWallet.cryptocurrency) {
        throw new Error('Cannot transfer between different cryptocurrencies');
      }

      // Check available balance
      if (fromWallet.availableBalance < amount) {
        throw new Error('Insufficient balance');
      }

      // Lock the amount in source wallet
      await fromWallet.lockBalance(amount);

      try {
        // Create transfer transaction
        const transaction = new Transaction({
          userId: fromUserId,
          walletId: fromWalletId,
          type: 'transfer',
          cryptocurrency: fromWallet.cryptocurrency,
          amount: amount,
          fee: 0,
          netAmount: amount,
          status: 'confirmed', // Internal transfers are instant
          fromAddress: fromWallet.address,
          toAddress: toWallet.address,
          toWalletId: toWallet._id,
          toUserId: toWallet.userId,
          description: `Internal transfer to ${toWallet.address}`,
          confirmedAt: new Date()
        });

        await transaction.save();

        // Update balances
        await fromWallet.updateBalance(amount, 'subtract');
        await fromWallet.unlockBalance(amount);
        await toWallet.updateBalance(amount, 'add');

        return transaction;
      } catch (error) {
        // Unlock balance if transfer failed
        await fromWallet.unlockBalance(amount);
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to process internal transfer: ${error.message}`);
    }
  }

  // Encrypt sensitive data
  static encryptData(data, password) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt sensitive data
  static decryptData(encryptedData, password) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(password, 'salt', 32);
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Get supported cryptocurrencies
  static getSupportedCryptocurrencies() {
    return Object.keys(this.SUPPORTED_CRYPTOS).map(symbol => ({
      symbol,
      name: this.SUPPORTED_CRYPTOS[symbol].name,
      decimals: this.SUPPORTED_CRYPTOS[symbol].decimals,
      minDeposit: this.SUPPORTED_CRYPTOS[symbol].minDeposit,
      minWithdrawal: this.SUPPORTED_CRYPTOS[symbol].minWithdrawal,
      withdrawalFee: this.SUPPORTED_CRYPTOS[symbol].withdrawalFee
    }));
  }
}

module.exports = WalletService;