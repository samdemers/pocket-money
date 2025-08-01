const request = require('supertest');
const { app } = require('../test-server');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

describe('Transactions API', () => {
  let authToken;
  let userId;
  let accountId;

  beforeEach(async () => {
    // Create a test user and get token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    authToken = signupResponse.body.token;
    userId = signupResponse.body.user.id;

    // Create a test account
    const account = new Account({
      user: userId,
      tinkAccountId: 'test-account-id',
      tinkCredentialId: 'test-credential-id',
      accountName: 'Test Account',
      bankName: 'Test Bank',
      accountType: 'CHECKING',
      balance: 1000
    });
    const savedAccount = await account.save();
    accountId = savedAccount._id;
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      // Create test transactions
      const transactions = [
        {
          user: userId,
          account: accountId,
          tinkTransactionId: 'tx1',
          tinkAccountId: 'test-account-id',
          amount: -50,
          currency: 'EUR',
          description: 'Grocery Store',
          date: new Date('2024-01-15'),
          type: 'DEBIT',
          category: 'FOOD'
        },
        {
          user: userId,
          account: accountId,
          tinkTransactionId: 'tx2',
          tinkAccountId: 'test-account-id',
          amount: 1000,
          currency: 'EUR',
          description: 'Salary',
          date: new Date('2024-01-01'),
          type: 'CREDIT',
          category: 'INCOME'
        },
        {
          user: userId,
          account: accountId,
          tinkTransactionId: 'tx3',
          tinkAccountId: 'test-account-id',
          amount: -25,
          currency: 'EUR',
          description: 'Coffee Shop',
          date: new Date('2024-01-10'),
          type: 'DEBIT',
          category: 'FOOD'
        }
      ];

      await Transaction.insertMany(transactions);
    });

    it('should return all transactions for user', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions).toHaveLength(3);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter transactions by date range', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({
          startDate: '2024-01-10',
          endDate: '2024-01-15'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.transactions).toHaveLength(2);
      // Should include transactions from Jan 10 and Jan 15
    });

    it('should filter transactions by account', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ accountId: accountId.toString() })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.transactions).toHaveLength(3);
      response.body.transactions.forEach(tx => {
        expect(tx.account._id).toBe(accountId.toString());
      });
    });

    it('should filter transactions by type', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ type: 'CREDIT' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0]).toHaveProperty('type', 'CREDIT');
    });

    it('should filter transactions by category', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ category: 'FOOD' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.transactions).toHaveLength(2);
      response.body.transactions.forEach(tx => {
        expect(tx.category).toBe('FOOD');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.pagination).toHaveProperty('totalPages', 2);
      expect(response.body.pagination).toHaveProperty('totalTransactions', 3);
    });

    it('should sort transactions by date desc by default', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const dates = response.body.transactions.map(tx => new Date(tx.date));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i] >= dates[i + 1]).toBe(true);
      }
    });

    it('should calculate summary statistics', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.summary).toHaveProperty('totalTransactions', 3);
      expect(response.body.summary).toHaveProperty('totalCredits', 1000);
      expect(response.body.summary).toHaveProperty('totalDebits', 75);
      expect(response.body.summary).toHaveProperty('netAmount', 925);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });

  describe('GET /api/transactions/summary', () => {
    beforeEach(async () => {
      // Create test transactions
      const transactions = [
        {
          user: userId,
          account: accountId,
          tinkTransactionId: 'tx1',
          tinkAccountId: 'test-account-id',
          amount: -100,
          currency: 'EUR',
          description: 'Expense',
          date: new Date('2024-01-15'),
          type: 'DEBIT'
        },
        {
          user: userId,
          account: accountId,
          tinkTransactionId: 'tx2',
          tinkAccountId: 'test-account-id',
          amount: 500,
          currency: 'EUR',
          description: 'Income',
          date: new Date('2024-01-01'),
          type: 'CREDIT'
        }
      ];

      await Transaction.insertMany(transactions);
    });

    it('should return transaction summary', async () => {
      const response = await request(app)
        .get('/api/transactions/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('totalTransactions', 2);
      expect(response.body.summary).toHaveProperty('totalCredits', 500);
      expect(response.body.summary).toHaveProperty('totalDebits', 100);
      expect(response.body.summary).toHaveProperty('netAmount', 400);
    });

    it('should filter summary by date range', async () => {
      const response = await request(app)
        .get('/api/transactions/summary')
        .query({
          startDate: '2024-01-15',
          endDate: '2024-01-15'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.summary).toHaveProperty('totalTransactions', 1);
      expect(response.body.summary).toHaveProperty('totalDebits', 100);
      expect(response.body.summary).toHaveProperty('totalCredits', 0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/transactions/summary')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });

  describe('GET /api/transactions/categories', () => {
    beforeEach(async () => {
      // Create transactions with different categories
      const transactions = [
        {
          user: userId,
          account: accountId,
          tinkTransactionId: 'tx1',
          tinkAccountId: 'test-account-id',
          amount: -50,
          currency: 'EUR',
          description: 'Food',
          date: new Date(),
          type: 'DEBIT',
          category: 'FOOD'
        },
        {
          user: userId,
          account: accountId,
          tinkTransactionId: 'tx2',
          tinkAccountId: 'test-account-id',
          amount: -30,
          currency: 'EUR',
          description: 'Transport',
          date: new Date(),
          type: 'DEBIT',
          category: 'TRANSPORT'
        }
      ];

      await Transaction.insertMany(transactions);
    });

    it('should return unique categories', async () => {
      const response = await request(app)
        .get('/api/transactions/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(response.body.categories).toContain('FOOD');
      expect(response.body.categories).toContain('TRANSPORT');
      expect(response.body.categories).toHaveLength(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/transactions/categories')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });

  describe('GET /api/transactions/:id', () => {
    let transactionId;

    beforeEach(async () => {
      const transaction = new Transaction({
        user: userId,
        account: accountId,
        tinkTransactionId: 'tx1',
        tinkAccountId: 'test-account-id',
        amount: -50,
        currency: 'EUR',
        description: 'Test Transaction',
        date: new Date(),
        type: 'DEBIT'
      });
      const savedTransaction = await transaction.save();
      transactionId = savedTransaction._id;
    });

    it('should return single transaction', async () => {
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction).toHaveProperty('description', 'Test Transaction');
      expect(response.body.transaction).toHaveProperty('amount', -50);
    });

    it('should return 404 for non-existent transaction', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/transactions/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Transaction not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });
});