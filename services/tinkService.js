const axios = require('axios');

class TinkService {
  constructor() {
    this.baseURL = process.env.TINK_BASE_URL;
    this.clientId = process.env.TINK_CLIENT_ID;
    this.clientSecret = process.env.TINK_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get client credentials access token
  async getClientCredentialsToken() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post(`${this.baseURL}/api/v1/oauth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        scope: 'user:create'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting client credentials token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Tink API');
    }
  }

  // Create a Tink user
  async createUser(externalUserId) {
    try {
      const token = await this.getClientCredentialsToken();
      
      const response = await axios.post(`${this.baseURL}/api/v1/user/create`, {
        external_user_id: externalUserId,
        market: 'SE', // Sweden market, adjust as needed
        locale: 'en_US'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.user_id;
    } catch (error) {
      console.error('Error creating Tink user:', error.response?.data || error.message);
      throw new Error('Failed to create Tink user');
    }
  }

  // Get user access token
  async getUserAccessToken(tinkUserId) {
    try {
      const token = await this.getClientCredentialsToken();
      
      const response = await axios.post(`${this.baseURL}/api/v1/oauth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        scope: `user:read,accounts:read,transactions:read,credentials:read,credentials:refresh,credentials:write`,
        actor_client_id: 'df05e4b379934cd09963197cc855bfe9', // Tink Console client ID
        external_user_id: tinkUserId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting user access token:', error.response?.data || error.message);
      throw new Error('Failed to get user access token');
    }
  }

  // Generate Tink Link URL for account connection
  async generateTinkLinkUrl(tinkUserId, redirectUri) {
    try {
      const userToken = await this.getUserAccessToken(tinkUserId);
      
      const response = await axios.post(`${this.baseURL}/link/v1/authorize`, {
        client_id: this.clientId,
        redirect_uri: redirectUri,
        market: 'SE',
        locale: 'en_US',
        scope: 'accounts:read,transactions:read',
        state: `user_${tinkUserId}_${Date.now()}`
      }, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.url;
    } catch (error) {
      console.error('Error generating Tink Link URL:', error.response?.data || error.message);
      throw new Error('Failed to generate Tink Link URL');
    }
  }

  // Get user accounts
  async getAccounts(tinkUserId) {
    try {
      const userToken = await this.getUserAccessToken(tinkUserId);
      
      const response = await axios.get(`${this.baseURL}/data/v2/accounts`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      return response.data.accounts || [];
    } catch (error) {
      console.error('Error fetching accounts:', error.response?.data || error.message);
      throw new Error('Failed to fetch accounts');
    }
  }

  // Get transactions for an account
  async getTransactions(tinkUserId, accountId, pageSize = 1000, pageToken = null) {
    try {
      const userToken = await this.getUserAccessToken(tinkUserId);
      
      let url = `${this.baseURL}/data/v2/transactions?accountIdIn=${accountId}&pageSize=${pageSize}`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      return {
        transactions: response.data.transactions || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error fetching transactions:', error.response?.data || error.message);
      throw new Error('Failed to fetch transactions');
    }
  }

  // Get all transactions for a user (across all accounts)
  async getAllTransactions(tinkUserId, startDate = null, endDate = null) {
    try {
      const userToken = await this.getUserAccessToken(tinkUserId);
      
      let url = `${this.baseURL}/data/v2/transactions?pageSize=1000`;
      
      if (startDate) {
        url += `&startDate=${startDate}`;
      }
      if (endDate) {
        url += `&endDate=${endDate}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      return response.data.transactions || [];
    } catch (error) {
      console.error('Error fetching all transactions:', error.response?.data || error.message);
      throw new Error('Failed to fetch transactions');
    }
  }

  // Get credentials (connected bank connections)
  async getCredentials(tinkUserId) {
    try {
      const userToken = await this.getUserAccessToken(tinkUserId);
      
      const response = await axios.get(`${this.baseURL}/data/v2/credentials`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      return response.data.credentials || [];
    } catch (error) {
      console.error('Error fetching credentials:', error.response?.data || error.message);
      throw new Error('Failed to fetch credentials');
    }
  }

  // Delete a credential (disconnect bank)
  async deleteCredential(tinkUserId, credentialId) {
    try {
      const userToken = await this.getUserAccessToken(tinkUserId);
      
      await axios.delete(`${this.baseURL}/data/v2/credentials/${credentialId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting credential:', error.response?.data || error.message);
      throw new Error('Failed to disconnect bank account');
    }
  }
}

module.exports = new TinkService();