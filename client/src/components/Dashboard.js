import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  Add,
  Sync,
  AccountCircle,
  Logout,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountsAPI, transactionsAPI, syncAPI } from '../services/api';
import socketService from '../services/socket';
import TransactionList from './TransactionList';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    setupSocketListeners();

    return () => {
      socketService.removeAllListeners();
    };
  }, []); // Empty dependency array to run only once

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load accounts and recent transactions in parallel
      const [accountsResponse, transactionsResponse] = await Promise.all([
        accountsAPI.getAccounts(),
        transactionsAPI.getTransactions({ limit: 10, sortBy: 'date', sortOrder: 'desc' })
      ]);

      setAccounts(accountsResponse.data.accounts);
      setTransactions(transactionsResponse.data.transactions);
      setSummary(transactionsResponse.data.summary);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.onNewTransaction((data) => {
      console.log('New transaction received:', data);
      setTransactions(prev => [data.transaction, ...prev.slice(0, 9)]);
      setSuccess('New transaction synced!');
      setTimeout(() => setSuccess(''), 3000);
    });

    socketService.onSyncComplete((data) => {
      console.log('Sync completed:', data);
      loadDashboardData();
      setSuccess(`Sync completed! ${data.newTransactions} new transactions.`);
      setTimeout(() => setSuccess(''), 5000);
      setSyncing(false);
    });

    socketService.onSyncStarted(() => {
      setSyncing(true);
      setSuccess('Sync started...');
    });

    socketService.onSyncError((error) => {
      console.error('Sync error:', error);
      setError(error.error || 'Sync failed');
      setTimeout(() => setError(''), 5000);
      setSyncing(false);
    });
  };

  const handleLinkAccount = async () => {
    try {
      const response = await accountsAPI.generateLinkUrl();
      const linkUrl = response.data.linkUrl;
      
      // Open Tink Link in a new window
      const popup = window.open(linkUrl, 'tink-link', 'width=600,height=700');
      
      // Listen for the popup to close
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Refresh accounts after linking
          setTimeout(() => {
            loadDashboardData();
          }, 1000);
        }
      }, 1000);
    } catch (error) {
      console.error('Error generating link URL:', error);
      setError('Failed to generate account linking URL');
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setError('');
      await syncAPI.manualSync();
      setSuccess('Manual sync started...');
    } catch (error) {
      console.error('Error starting manual sync:', error);
      setError('Failed to start manual sync');
      setSyncing(false);
    }
  };

  const handleUnlinkAccount = async (accountId) => {
    try {
      await accountsAPI.unlinkAccount(accountId);
      setAccounts(accounts.filter(acc => acc._id !== accountId));
      setSuccess('Account unlinked successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error unlinking account:', error);
      setError('Failed to unlink account');
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'CREDIT_CARD':
        return <CreditCard />;
      default:
        return <AccountBalance />;
    }
  };

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'CREDIT_CARD':
        return 'warning';
      case 'SAVINGS':
        return 'success';
      case 'CHECKING':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Banking Dashboard
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user?.firstName}
          </Typography>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={handleMenuOpen}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Summary Cards */}
          {summary && (
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Balance
                      </Typography>
                      <Typography variant="h5" component="div">
                        {formatCurrency(summary.netAmount)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Income
                      </Typography>
                      <Typography variant="h5" component="div" color="success.main">
                        {formatCurrency(summary.totalCredits)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Expenses
                      </Typography>
                      <Typography variant="h5" component="div" color="error.main">
                        {formatCurrency(summary.totalDebits)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Transactions
                      </Typography>
                      <Typography variant="h5" component="div">
                        {summary.totalTransactions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Accounts Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Connected Accounts
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={syncing ? <CircularProgress size={16} /> : <Refresh />}
                    onClick={handleManualSync}
                    disabled={syncing}
                    sx={{ mr: 1 }}
                  >
                    {syncing ? 'Syncing...' : 'Sync'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleLinkAccount}
                  >
                    Link Account
                  </Button>
                </Box>
              </Box>

              {accounts.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    No accounts connected yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Click "Link Account" to connect your bank accounts
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {accounts.map((account) => (
                    <Card key={account._id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          {getAccountTypeIcon(account.accountType)}
                          <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                            {account.accountName}
                          </Typography>
                          <Chip
                            label={account.accountType}
                            color={getAccountTypeColor(account.accountType)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {account.bankName}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(account.balance, account.currency)}
                        </Typography>
                        {account.availableBalance !== account.balance && (
                          <Typography variant="body2" color="textSecondary">
                            Available: {formatCurrency(account.availableBalance, account.currency)}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleUnlinkAccount(account._id)}
                        >
                          Unlink
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Recent Transactions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Recent Transactions
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/transactions')}
                >
                  View All
                </Button>
              </Box>
              <TransactionList
                transactions={transactions}
                showAccountName={true}
                maxHeight={400}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Dashboard;