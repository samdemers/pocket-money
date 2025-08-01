const request = require('supertest');
const { app } = require('../test-server');

describe('Integration Tests', () => {
  describe('Frontend-Backend Connection', () => {
    it('should allow user signup from frontend', async () => {
      const userData = {
        email: 'frontend@example.com',
        password: 'password123',
        firstName: 'Frontend',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .set('Content-Type', 'application/json')
        .set('Origin', 'http://localhost:3000')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/signup')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('environment', 'test');
    });

    it('should handle authentication flow', async () => {
      // Sign up
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'auth@example.com',
          password: 'password123',
          firstName: 'Auth',
          lastName: 'Test'
        })
        .expect(201);

      const token = signupResponse.body.token;

      // Sign in
      const signinResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'auth@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(signinResponse.body).toHaveProperty('token');

      // Get profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.user.email).toBe('auth@example.com');
    });

    it('should handle account operations', async () => {
      // Create user
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'accounts@example.com',
          password: 'password123',
          firstName: 'Account',
          lastName: 'Test'
        })
        .expect(201);

      const token = signupResponse.body.token;

      // Get accounts (should be empty)
      const accountsResponse = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(accountsResponse.body.accounts).toEqual([]);

      // Get transactions (should be empty)
      const transactionsResponse = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(transactionsResponse.body.transactions).toEqual([]);
    });
  });
});