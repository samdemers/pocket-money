const cron = require('node-cron');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const tinkService = require('./tinkService');

class SyncService {
  constructor(io) {
    this.io = io; // Socket.io instance for real-time updates
    this.isRunning = false;
  }

  // Start the sync service
  start() {
    if (this.isRunning) {
      console.log('Sync service is already running');
      return;
    }

    console.log('Starting sync service...');
    
    // Run sync every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.syncAllUsers();
    });

    // Run a full sync every hour
    cron.schedule('0 * * * *', () => {
      this.fullSyncAllUsers();
    });

    this.isRunning = true;
    console.log('Sync service started successfully');
  }

  // Sync all users' transactions
  async syncAllUsers() {
    try {
      console.log('Starting periodic sync for all users...');
      
      const users = await User.find({ 
        tinkUserId: { $exists: true, $ne: null } 
      });

      for (const user of users) {
        try {
          await this.syncUserTransactions(user);
        } catch (error) {
          console.error(`Error syncing user ${user._id}:`, error);
        }
      }

      console.log(`Completed periodic sync for ${users.length} users`);
    } catch (error) {
      console.error('Error in periodic sync:', error);
    }
  }

  // Full sync with account updates
  async fullSyncAllUsers() {
    try {
      console.log('Starting full sync for all users...');
      
      const users = await User.find({ 
        tinkUserId: { $exists: true, $ne: null } 
      });

      for (const user of users) {
        try {
          await this.fullSyncUser(user);
        } catch (error) {
          console.error(`Error in full sync for user ${user._id}:`, error);
        }
      }

      console.log(`Completed full sync for ${users.length} users`);
    } catch (error) {
      console.error('Error in full sync:', error);
    }
  }

  // Sync transactions for a specific user
  async syncUserTransactions(user) {
    try {
      const accounts = await Account.find({ 
        user: user._id, 
        isActive: true 
      });

      let newTransactionsCount = 0;

      for (const account of accounts) {
        try {
          // Get transactions from the last sync date
          const lastSyncDate = account.lastSyncedAt || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
          
          const transactionData = await tinkService.getTransactions(
            user.tinkUserId,
            account.tinkAccountId
          );

          for (const tinkTransaction of transactionData.transactions) {
            // Only process transactions newer than last sync
            const transactionDate = new Date(tinkTransaction.date);
            if (transactionDate <= lastSyncDate) continue;

            // Check if transaction already exists
            const existingTransaction = await Transaction.findOne({
              tinkTransactionId: tinkTransaction.id
            });

            if (!existingTransaction) {
              const transaction = new Transaction({
                user: user._id,
                account: account._id,
                tinkTransactionId: tinkTransaction.id,
                tinkAccountId: account.tinkAccountId,
                amount: tinkTransaction.amount,
                currency: tinkTransaction.currencyCode || 'EUR',
                description: tinkTransaction.description,
                date: transactionDate,
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
              newTransactionsCount++;

              // Emit real-time update to user
              if (this.io) {
                this.io.to(`user_${user._id}`).emit('new_transaction', {
                  transaction: transaction.toObject(),
                  account: {
                    _id: account._id,
                    accountName: account.accountName,
                    bankName: account.bankName
                  }
                });
              }
            }
          }

          // Update last synced timestamp
          account.lastSyncedAt = new Date();
          await account.save();

        } catch (accountError) {
          console.error(`Error syncing account ${account.tinkAccountId}:`, accountError);
        }
      }

      if (newTransactionsCount > 0) {
        console.log(`Synced ${newTransactionsCount} new transactions for user ${user._id}`);
        
        // Emit summary update
        if (this.io) {
          this.io.to(`user_${user._id}`).emit('sync_complete', {
            newTransactions: newTransactionsCount,
            timestamp: new Date()
          });
        }
      }

    } catch (error) {
      console.error(`Error syncing transactions for user ${user._id}:`, error);
      throw error;
    }
  }

  // Full sync including account updates
  async fullSyncUser(user) {
    try {
      // First sync accounts
      const tinkAccounts = await tinkService.getAccounts(user.tinkUserId);
      
      for (const tinkAccount of tinkAccounts) {
        let account = await Account.findOne({ 
          tinkAccountId: tinkAccount.id 
        });

        if (account) {
          // Update existing account
          account.balance = tinkAccount.balance || account.balance;
          account.availableBalance = tinkAccount.availableBalance || account.availableBalance;
          account.accountName = tinkAccount.name || account.accountName;
          account.bankName = tinkAccount.financialInstitutionName || account.bankName;
          await account.save();
        }
      }

      // Then sync transactions
      await this.syncUserTransactions(user);

    } catch (error) {
      console.error(`Error in full sync for user ${user._id}:`, error);
      throw error;
    }
  }

  // Manual sync trigger for a specific user
  async manualSyncUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.tinkUserId) {
        throw new Error('User not found or no Tink user ID');
      }

      await this.fullSyncUser(user);
      
      return {
        success: true,
        message: 'Manual sync completed successfully'
      };
    } catch (error) {
      console.error(`Error in manual sync for user ${userId}:`, error);
      throw error;
    }
  }

  // Stop the sync service
  stop() {
    this.isRunning = false;
    console.log('Sync service stopped');
  }
}

module.exports = SyncService;