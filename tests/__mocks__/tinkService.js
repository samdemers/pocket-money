// Mock Tink service for testing
const mockTinkService = {
  getClientCredentialsToken: jest.fn().mockResolvedValue('mock-client-token'),
  
  createUser: jest.fn().mockResolvedValue('mock-tink-user-id'),
  
  getUserAccessToken: jest.fn().mockResolvedValue('mock-user-token'),
  
  generateTinkLinkUrl: jest.fn().mockResolvedValue('https://link.tink.com/mock-url'),
  
  getAccounts: jest.fn().mockResolvedValue([
    {
      id: 'mock-account-1',
      credentialsId: 'mock-credential-1',
      name: 'Mock Checking Account',
      accountNumber: 'XXXX1234',
      financialInstitutionName: 'Mock Bank',
      type: 'CHECKING',
      currencyCode: 'EUR',
      balance: 1000,
      availableBalance: 900
    }
  ]),
  
  getTransactions: jest.fn().mockResolvedValue({
    transactions: [
      {
        id: 'mock-tx-1',
        amount: -50,
        currencyCode: 'EUR',
        description: 'Mock Transaction',
        date: '2024-01-15',
        dates: {
          booked: '2024-01-15',
          value: '2024-01-15'
        },
        categoryCode: 'FOOD',
        merchantName: 'Mock Store',
        reference: 'REF123',
        status: 'BOOKED'
      }
    ],
    nextPageToken: null
  }),
  
  getAllTransactions: jest.fn().mockResolvedValue([]),
  
  getCredentials: jest.fn().mockResolvedValue([
    {
      id: 'mock-credential-1',
      status: 'UPDATED'
    }
  ]),
  
  deleteCredential: jest.fn().mockResolvedValue(true)
};

module.exports = mockTinkService;