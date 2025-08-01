const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  tinkTransactionId: {
    type: String,
    required: true,
    unique: true
  },
  tinkAccountId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'EUR'
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  bookedDate: {
    type: Date
  },
  valueDate: {
    type: Date
  },
  category: {
    type: String,
    default: 'OTHER'
  },
  categoryCode: {
    type: String
  },
  merchantName: {
    type: String
  },
  reference: {
    type: String
  },
  type: {
    type: String,
    enum: ['DEBIT', 'CREDIT'],
    required: true
  },
  status: {
    type: String,
    enum: ['BOOKED', 'PENDING'],
    default: 'BOOKED'
  },
  balance: {
    type: Number
  },
  runningBalance: {
    type: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ account: 1, date: -1 });
transactionSchema.index({ tinkTransactionId: 1 });
transactionSchema.index({ date: 1 });
transactionSchema.index({ user: 1, date: 1, account: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);