const express = require('express');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const tinkService = require('../services/tinkService');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/accounts - Get user's accounts
router.get('/', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ 
      user: req.user._id, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({ accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// POST /api/accounts/link-url - Generate Tink Link URL
router.post('/link-url', auth, async (req, res) => {
  try {
    if (!req.user.tinkUserId) {
      // Create Tink user if doesn't exist
      const tinkUserId = await tinkService.createUser(req.user._id.toString());
      await User.findByIdAndUpdate(req.user._id, { tinkUserId });
      req.user.tinkUserId = tinkUserId;
    }

    const redirectUri = `${process.env.CLIENT_URL}/accounts/callback`;
    const linkUrl = await tinkService.generateTinkLinkUrl(req.user.tinkUserId, redirectUri);

    res.json({ linkUrl });
  } catch (error) {
    console.error('Error generating link URL:', error);
    res.status(500).json({ error: 'Failed to generate account linking URL' });
  }
});

// POST /api/accounts/sync - Sync accounts and transactions from Tink
router.post('/sync', auth, async (req, res) => {
  try {
    if (!req.user.tinkUserId) {
      return res.status(400).json({ error: 'No Tink user ID found. Please link an account first.' });
    }

    // Fetch accounts from Tink
    const tinkAccounts = await tinkService.getAccounts(req.user.tinkUserId);
    
    let syncedAccounts = 0;
    let syncedTransactions = 0;

    for (const tinkAccount of tinkAccounts) {
      // Check if account already exists
      let account = await Account.findOne({ 
        tinkAccountId: tinkAccount.id 
      });

      if (!account) {
        // Create new account
        account = new Account({
          user: req.user._id,
          tinkAccountId: tinkAccount.id,
          tinkCredentialId: tinkAccount.credentialsId,
          accountName: tinkAccount.name,
          accountNumber: tinkAccount.accountNumber,
          bankName: tinkAccount.financialInstitutionName,
          accountType: tinkAccount.type || 'OTHER',
          currency: tinkAccount.currencyCode || 'EUR',
          balance: tinkAccount.balance || 0,
          availableBalance: tinkAccount.availableBalance || 0
        });

        await account.save();
        
        // Add account to user's accounts array
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { accounts: account._id }
        });

        syncedAccounts++;
      } else {
        // Update existing account
        account.balance = tinkAccount.balance || account.balance;
        account.availableBalance = tinkAccount.availableBalance || account.availableBalance;
        account.lastSyncedAt = new Date();
        await account.save();
      }

      // Sync transactions for this account
      try {
        const transactionData = await tinkService.getTransactions(
          req.user.tinkUserId, 
          tinkAccount.id
        );

        for (const tinkTransaction of transactionData.transactions) {
          // Check if transaction already exists
          const existingTransaction = await Transaction.findOne({
            tinkTransactionId: tinkTransaction.id
          });

          if (!existingTransaction) {
            const transaction = new Transaction({
              user: req.user._id,
              account: account._id,
              tinkTransactionId: tinkTransaction.id,
              tinkAccountId: tinkAccount.id,
              amount: tinkTransaction.amount,
              currency: tinkTransaction.currencyCode || 'EUR',
              description: tinkTransaction.description,
              date: new Date(tinkTransaction.date),
              bookedDate: tinkTransaction.dates?.booked ? new Date(tinkTransaction.dates.booked) : null,
              valueDate: tinkTransaction.dates?.value ? new Date(tinkTransaction.dates.value) : null,
              category: tinkTransaction.categoryCode || 'OTHER',
              merchantName: tinkTransaction.merchantName,
              reference: tinkTransaction.reference,
              type: tinkTransaction.amount >= 0 ? 'CREDIT' : 'DEBIT',
              status: tinkTransaction.status || 'BOOKED',
              metadata: {
                originalData: tinkTransaction
              }
            });

            await transaction.save();
            syncedTransactions++;
          }
        }
      } catch (transactionError) {
        console.error(`Error syncing transactions for account ${tinkAccount.id}:`, transactionError);
      }
    }

    res.json({
      message: 'Sync completed successfully',
      syncedAccounts,
      syncedTransactions
    });
  } catch (error) {
    console.error('Error syncing accounts:', error);
    res.status(500).json({ error: 'Failed to sync accounts and transactions' });
  }
});

// DELETE /api/accounts/:accountId - Unlink/deactivate account
router.delete('/:accountId', auth, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.accountId,
      user: req.user._id
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Deactivate account instead of deleting (to preserve transaction history)
    account.isActive = false;
    await account.save();

    // Try to delete the credential from Tink
    try {
      await tinkService.deleteCredential(req.user.tinkUserId, account.tinkCredentialId);
    } catch (tinkError) {
      console.error('Error deleting Tink credential:', tinkError);
      // Continue even if Tink deletion fails
    }

    res.json({ message: 'Account unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking account:', error);
    res.status(500).json({ error: 'Failed to unlink account' });
  }
});

// POST /api/accounts/:accountId/reactivate - Reactivate account
router.post('/:accountId/reactivate', auth, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.accountId,
      user: req.user._id
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    account.isActive = true;
    await account.save();

    res.json({ message: 'Account reactivated successfully', account });
  } catch (error) {
    console.error('Error reactivating account:', error);
    res.status(500).json({ error: 'Failed to reactivate account' });
  }
});

module.exports = router;