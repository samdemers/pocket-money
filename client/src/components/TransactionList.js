import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  TextField,
  Grid,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Pagination,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  FilterList,
  Search,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { transactionsAPI, accountsAPI } from '../services/api';

function TransactionList({ 
  transactions: propTransactions, 
  showAccountName = false, 
  maxHeight = null,
  showFilters = false 
}) {
  const [transactions, setTransactions] = useState(propTransactions || []);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    accountId: '',
    type: '',
    category: '',
    searchTerm: '',
  });
  
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Load data when filters change or when component mounts with showFilters
  useEffect(() => {
    if (showFilters) {
      loadTransactions();
      loadAccounts();
      loadCategories();
    }
  }, [showFilters]);

  // Use prop transactions when not showing filters
  useEffect(() => {
    if (!showFilters && propTransactions) {
      setTransactions(propTransactions);
    }
  }, [propTransactions, showFilters]);

  const loadTransactions = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: 20,
        sortBy: 'date',
        sortOrder: 'desc',
      };

      // Add filters to params
      if (filters.startDate) {
        params.startDate = filters.startDate.format('YYYY-MM-DD');
      }
      if (filters.endDate) {
        params.endDate = filters.endDate.format('YYYY-MM-DD');
      }
      if (filters.accountId) {
        params.accountId = filters.accountId;
      }
      if (filters.type) {
        params.type = filters.type;
      }
      if (filters.category) {
        params.category = filters.category;
      }

      const response = await transactionsAPI.getTransactions(params);
      
      setTransactions(response.data.transactions);
      setSummary(response.data.summary);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await accountsAPI.getAccounts();
      setAccounts(response.data.accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await transactionsAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadTransactions(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      accountId: '',
      type: '',
      category: '',
      searchTerm: '',
    });
    setCurrentPage(1);
    loadTransactions(1);
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    loadTransactions(page);
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date) => {
    return dayjs(date).format('MMM DD, YYYY');
  };

  const getTransactionIcon = (type, amount) => {
    if (type === 'CREDIT' || amount > 0) {
      return <TrendingUp color="success" />;
    }
    return <TrendingDown color="error" />;
  };

  const getTransactionColor = (type, amount) => {
    if (type === 'CREDIT' || amount > 0) {
      return 'success.main';
    }
    return 'error.main';
  };

  const getRunningBalanceColor = (balance) => {
    if (balance > 0) return 'success.main';
    if (balance < 0) return 'error.main';
    return 'text.primary';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Filters */}
        {showFilters && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <FilterList sx={{ mr: 1 }} />
              <Typography variant="h6">Filters</Typography>
            </Box>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(value) => handleFilterChange('startDate', value)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(value) => handleFilterChange('endDate', value)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={filters.accountId}
                    onChange={(e) => handleFilterChange('accountId', e.target.value)}
                    label="Account"
                  >
                    <MenuItem value="">All Accounts</MenuItem>
                    {accounts.map((account) => (
                      <MenuItem key={account._id} value={account._id}>
                        {account.accountName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="CREDIT">Income</MenuItem>
                    <MenuItem value="DEBIT">Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box mt={2} display="flex" gap={1}>
              <Button variant="contained" onClick={applyFilters} disabled={loading}>
                Apply Filters
              </Button>
              <Button variant="outlined" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Box>
            
            {/* Summary */}
            {summary && (
              <Box mt={2}>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">
                      Total Transactions
                    </Typography>
                    <Typography variant="h6">
                      {summary.totalTransactions}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">
                      Total Income
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(summary.totalCredits)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">
                      Total Expenses
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(summary.totalDebits)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">
                      Net Amount
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color={summary.netAmount >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(summary.netAmount)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        )}

        {/* Transaction List */}
        <Box sx={{ maxHeight: maxHeight, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : transactions.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="textSecondary">
                No transactions found
              </Typography>
            </Box>
          ) : (
            <List>
              {transactions.map((transaction, index) => (
                <React.Fragment key={transaction._id}>
                  <ListItem>
                    <ListItemIcon>
                      {getTransactionIcon(transaction.type, transaction.amount)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" noWrap>
                            {transaction.description}
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={getTransactionColor(transaction.type, transaction.amount)}
                            sx={{ ml: 2 }}
                          >
                            {transaction.amount >= 0 ? '+' : ''}
                            {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" color="textSecondary">
                                {formatDate(transaction.date)}
                              </Typography>
                              {showAccountName && transaction.account && (
                                <Chip 
                                  label={transaction.account.accountName} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                              {transaction.category && transaction.category !== 'OTHER' && (
                                <Chip 
                                  label={transaction.category} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            {transaction.runningBalance !== undefined && (
                              <Typography 
                                variant="body2" 
                                color={getRunningBalanceColor(transaction.runningBalance)}
                                fontWeight="medium"
                              >
                                Balance: {formatCurrency(transaction.runningBalance, transaction.currency)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < transactions.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Pagination */}
        {showFilters && pagination && pagination.totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={pagination.totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default TransactionList;