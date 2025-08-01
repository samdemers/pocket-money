const request = require('supertest');
const { app } = require('../test-server');
const User = require('../models/User');
const Account = require('../models/Account');

describe('Accounts API', () => {
  let authToken;
  let userId;

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
  });

  describe('GET /api/accounts', () => {
    it('should return empty array when no accounts exist', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('accounts');
      expect(response.body.accounts).toEqual([]);
    });

    it('should return user accounts when they exist', async () => {
      // Create a test account
      const account = new Account({
        user: userId,
        tinkAccountId: 'test-account-id',
        tinkCredentialId: 'test-credential-id',
        accountName: 'Test Checking Account',
        bankName: 'Test Bank',
        accountType: 'CHECKING',
        balance: 1000,
        availableBalance: 900
      });
      await account.save();

      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.accounts).toHaveLength(1);
      expect(response.body.accounts[0]).toHaveProperty('accountName', 'Test Checking Account');
      expect(response.body.accounts[0]).toHaveProperty('bankName', 'Test Bank');
      expect(response.body.accounts[0]).toHaveProperty('balance', 1000);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    it('should only return active accounts', async () => {
      // Create active account
      const activeAccount = new Account({
        user: userId,
        tinkAccountId: 'active-account-id',
        tinkCredentialId: 'test-credential-id',
        accountName: 'Active Account',
        bankName: 'Test Bank',
        accountType: 'CHECKING',
        balance: 1000,
        isActive: true
      });
      await activeAccount.save();

      // Create inactive account
      const inactiveAccount = new Account({
        user: userId,
        tinkAccountId: 'inactive-account-id',
        tinkCredentialId: 'test-credential-id',
        accountName: 'Inactive Account',
        bankName: 'Test Bank',
        accountType: 'SAVINGS',
        balance: 500,
        isActive: false
      });
      await inactiveAccount.save();

      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.accounts).toHaveLength(1);
      expect(response.body.accounts[0]).toHaveProperty('accountName', 'Active Account');
    });
  });

  describe('POST /api/accounts/link-url', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/accounts/link-url')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });

  describe('DELETE /api/accounts/:accountId', () => {
    let accountId;

    beforeEach(async () => {
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

    it('should deactivate account successfully', async () => {
      const response = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Account unlinked successfully');

      // Verify account is deactivated
      const account = await Account.findById(accountId);
      expect(account.isActive).toBe(false);
    });

    it('should return 404 for non-existent account', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/accounts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Account not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });

  describe('POST /api/accounts/:accountId/reactivate', () => {
    let accountId;

    beforeEach(async () => {
      // Create a deactivated test account
      const account = new Account({
        user: userId,
        tinkAccountId: 'test-account-id',
        tinkCredentialId: 'test-credential-id',
        accountName: 'Test Account',
        bankName: 'Test Bank',
        accountType: 'CHECKING',
        balance: 1000,
        isActive: false
      });
      const savedAccount = await account.save();
      accountId = savedAccount._id;
    });

    it('should reactivate account successfully', async () => {
      const response = await request(app)
        .post(`/api/accounts/${accountId}/reactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Account reactivated successfully');

      // Verify account is reactivated
      const account = await Account.findById(accountId);
      expect(account.isActive).toBe(true);
    });

    it('should return 404 for non-existent account', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post(`/api/accounts/${fakeId}/reactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Account not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/accounts/${accountId}/reactivate`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });
});