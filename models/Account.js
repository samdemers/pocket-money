const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tinkAccountId: {
    type: String,
    required: true,
    unique: true
  },
  tinkCredentialId: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    sparse: true
  },
  bankName: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'OTHER'],
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  balance: {
    type: Number,
    default: 0
  },
  availableBalance: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
accountSchema.index({ user: 1, isActive: 1 });
accountSchema.index({ tinkAccountId: 1 });

module.exports = mongoose.model('Account', accountSchema);