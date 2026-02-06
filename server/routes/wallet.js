const express = require('express');
const WalletService = require('../services/walletService');
const Transaction = require('../models/Transaction');
const { 
  authenticateToken, 
  requireTrader, 
  requireVerification,
  requireKYC 
} = require('../middleware/auth');
const router = express.Router();

// Get supported cryptocurrencies
router.get('/supported-cryptos', (req, res) => {
  try {
    const supportedCryptos = WalletService.getSupportedCryptocurrencies();
    res.json(supportedCryptos);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user wallets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const wallets = await WalletService.getUserWallets(req.user._id);
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get wallets', error: error.message });
  }
});

// Get specific wallet
router.get('/:walletId', authenticateToken, async (req, res) => {
  try {
    const { walletId } = req.params;
    const wallet = await WalletService.getWalletById(walletId, req.user._id);
    res.json(wallet);
  } catch (error) {
    res.status(404).json({ message: 'Wallet not found', error: error.message });
  }
});

// Create new wallet (requires trader role)
router.post('/create', requireTrader, async (req, res) => {
  try {
    const { cryptocurrency, label, password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password required for wallet encryption' });
    }

    const wallet = await WalletService.createWallet(
      req.user._id, 
      cryptocurrency.toUpperCase(), 
      label, 
      password
    );
    
    res.status(201).json({
      message: 'Wallet created successfully',
      wallet: {
        ...wallet,
        seedPhrase: wallet.seedPhrase // Include seed phrase for backup
      },
      warning: 'Please backup your seed phrase securely. This is the only time it will be shown.'
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create wallet', error: error.message });
  }
});

// Process withdrawal (requires KYC for large amounts)
router.post('/:walletId/withdraw', authenticateToken, requireVerification, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { toAddress, amount, password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password required for withdrawal' });
    }

    // Require KYC for withdrawals over $1000 equivalent
    if (amount > 1000) {
      if (req.user.kycStatus !== 'approved') {
        return res.status(403).json({ 
          message: 'KYC verification required for large withdrawals',
          kycStatus: req.user.kycStatus,
          action: 'complete_kyc'
        });
      }
    }

    const transaction = await WalletService.processWithdrawal(
      req.user._id,
      walletId,
      toAddress,
      parseFloat(amount),
      password
    );

    res.json({
      message: 'Withdrawal initiated successfully',
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        fee: transaction.fee,
        netAmount: transaction.netAmount,
        status: transaction.status,
        toAddress: transaction.toAddress,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to process withdrawal', error: error.message });
  }
});

// Process internal transfer
router.post('/:walletId/transfer', authenticateToken, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { toAddress, amount } = req.body;

    const transaction = await WalletService.processInternalTransfer(
      req.user._id,
      walletId,
      toAddress,
      parseFloat(amount)
    );

    res.json({
      message: 'Transfer completed successfully',
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to process transfer', error: error.message });
  }
});

// Get wallet transaction history
router.get('/:walletId/transactions', authenticateToken, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { 
      type, 
      status, 
      limit = 50, 
      skip = 0,
      startDate,
      endDate 
    } = req.query;

    // Verify wallet belongs to user
    const wallet = await WalletService.getWalletById(walletId, req.user._id);
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    const transactions = await Transaction.find({
      $or: [
        { walletId: walletId },
        { toWalletId: walletId }
      ]
    })
    .populate('walletId', 'cryptocurrency address label')
    .populate('toWalletId', 'cryptocurrency address label')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      cryptocurrency: tx.cryptocurrency,
      amount: tx.amount,
      fee: tx.fee,
      netAmount: tx.netAmount,
      status: tx.status,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      txHash: tx.txHash,
      confirmations: tx.confirmations,
      description: tx.description,
      createdAt: tx.createdAt,
      confirmedAt: tx.confirmedAt
    }));

    res.json({
      transactions: formattedTransactions,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        total: transactions.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get transaction history', error: error.message });
  }
});

// Get user's complete transaction history
router.get('/transactions/all', authenticateToken, async (req, res) => {
  try {
    const { 
      type, 
      status, 
      cryptocurrency,
      limit = 50, 
      skip = 0,
      startDate,
      endDate 
    } = req.query;

    const transactions = await Transaction.getUserTransactions(req.user._id, {
      type,
      status,
      cryptocurrency,
      limit: parseInt(limit),
      skip: parseInt(skip),
      startDate,
      endDate
    });

    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      cryptocurrency: tx.cryptocurrency,
      amount: tx.amount,
      fee: tx.fee,
      netAmount: tx.netAmount,
      status: tx.status,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      txHash: tx.txHash,
      confirmations: tx.confirmations,
      description: tx.description,
      wallet: tx.walletId ? {
        id: tx.walletId._id,
        address: tx.walletId.address,
        label: tx.walletId.label
      } : null,
      createdAt: tx.createdAt,
      confirmedAt: tx.confirmedAt
    }));

    res.json({
      transactions: formattedTransactions,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get transaction history', error: error.message });
  }
});

// Get user transaction volume statistics
router.get('/stats/volume', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const volumeStats = await Transaction.getUserVolume(req.user._id, parseInt(days));
    
    res.json({
      period: `${days} days`,
      volumeByAsset: volumeStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get volume statistics', error: error.message });
  }
});

// Webhook endpoint for deposit confirmations (would be called by blockchain monitoring service)
router.post('/webhook/deposit', async (req, res) => {
  try {
    const { address, amount, txHash, confirmations, blockNumber } = req.body;
    
    // Verify webhook authenticity (implement proper verification in production)
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ message: 'Unauthorized webhook' });
    }

    const transaction = await WalletService.processDeposit(
      address,
      parseFloat(amount),
      txHash,
      parseInt(confirmations)
    );

    res.json({
      message: 'Deposit processed successfully',
      transactionId: transaction._id,
      status: transaction.status
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to process deposit', error: error.message });
  }
});

module.exports = router;