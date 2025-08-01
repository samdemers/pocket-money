const express = require('express');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/transactions - Get user's transactions with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      accountId, 
      type, 
      category,
      page = 1, 
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = { user: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    // Account filter
    if (accountId) {
      filter.account = accountId;
    }

    // Transaction type filter
    if (type && ['DEBIT', 'CREDIT'].includes(type.toUpperCase())) {
      filter.type = type.toUpperCase();
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Fetch transactions
    const transactions = await Transaction.find(filter)
      .populate('account', 'accountName bankName accountType currency')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(filter);

    // Calculate running balances for the filtered transactions
    const transactionsWithBalance = await calculateRunningBalances(transactions, filter);

    // Calculate summary statistics
    const summary = await calculateSummary(filter);

    res.json({
      transactions: transactionsWithBalance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTransactions / parseInt(limit)),
        totalTransactions,
        hasNext: skip + transactions.length < totalTransactions,
        hasPrevious: parseInt(page) > 1
      },
      summary
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/transactions/summary - Get transaction summary for date range
router.get('/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate, accountId } = req.query;

    const filter = { user: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    // Account filter
    if (accountId) {
      filter.account = accountId;
    }

    const summary = await calculateSummary(filter);

    res.json({ summary });
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    res.status(500).json({ error: 'Failed to fetch transaction summary' });
  }
});

// GET /api/transactions/categories - Get transaction categories
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Transaction.distinct('category', { user: req.user._id });
    res.json({ categories: categories.filter(cat => cat && cat !== '') });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/transactions/:id - Get single transaction
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('account', 'accountName bankName accountType currency');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Helper function to calculate running balances
async function calculateRunningBalances(transactions, filter) {
  // Get the starting balance by finding the earliest transaction before the filter period
  let runningBalance = 0;
  
  if (filter.date && filter.date.$gte) {
    const earlierTransactions = await Transaction.find({
      user: filter.user,
      account: filter.account || { $exists: true },
      date: { $lt: filter.date.$gte }
    }).sort({ date: 1 });

    runningBalance = earlierTransactions.reduce((balance, tx) => balance + tx.amount, 0);
  }

  // Calculate running balance for each transaction
  return transactions.map(transaction => {
    runningBalance += transaction.amount;
    return {
      ...transaction.toObject(),
      runningBalance: parseFloat(runningBalance.toFixed(2))
    };
  });
}

// Helper function to calculate summary statistics
async function calculateSummary(filter) {
  const pipeline = [
    { $match: filter },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalCredits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'CREDIT'] }, '$amount', 0]
          }
        },
        totalDebits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'DEBIT'] }, { $abs: '$amount' }, 0]
          }
        },
        netAmount: { $sum: '$amount' },
        avgTransactionAmount: { $avg: '$amount' },
        maxTransaction: { $max: '$amount' },
        minTransaction: { $min: '$amount' }
      }
    }
  ];

  const result = await Transaction.aggregate(pipeline);
  
  if (result.length === 0) {
    return {
      totalTransactions: 0,
      totalCredits: 0,
      totalDebits: 0,
      netAmount: 0,
      avgTransactionAmount: 0,
      maxTransaction: 0,
      minTransaction: 0
    };
  }

  const summary = result[0];
  
  return {
    totalTransactions: summary.totalTransactions,
    totalCredits: parseFloat(summary.totalCredits.toFixed(2)),
    totalDebits: parseFloat(summary.totalDebits.toFixed(2)),
    netAmount: parseFloat(summary.netAmount.toFixed(2)),
    avgTransactionAmount: parseFloat(summary.avgTransactionAmount.toFixed(2)),
    maxTransaction: parseFloat(summary.maxTransaction.toFixed(2)),
    minTransaction: parseFloat(summary.minTransaction.toFixed(2))
  };
}

module.exports = router;