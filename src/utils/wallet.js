import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

// ============================================
// WALLET UTILITY FUNCTIONS
// ============================================

// Get current wallet balance
export const getWalletBalance = async () => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) return 0;

    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data?.wallet?.balance || 0;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return 0;
  }
};

// Get wallet transaction history
export const getWalletTransactions = async () => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) return [];

    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data?.wallet?.transactions || [];
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return [];
  }
};

// Check if wallet has sufficient balance
export const hasSufficientWalletBalance = async (amount) => {
  const balance = await getWalletBalance();
  return balance >= amount;
};

// Format wallet amount for display
export const formatWalletAmount = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

// Get wallet summary for checkout
export const getWalletSummary = async () => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) {
      return {
        balance: 0,
        hasBalance: false,
        transactions: [],
        totalEarned: 0,
        totalSpent: 0
      };
    }

    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const transactions = response.data?.wallet?.transactions || [];
    const balance = response.data?.wallet?.balance || 0;

    const totalEarned = transactions
      .filter(t => t.type === 'credit' || t.type === 'reward')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      balance,
      hasBalance: balance > 0,
      transactions,
      totalEarned,
      totalSpent
    };
  } catch (error) {
    console.error('Error fetching wallet summary:', error);
    return {
      balance: 0,
      hasBalance: false,
      transactions: [],
      totalEarned: 0,
      totalSpent: 0
    };
  }
};

// Calculate wallet payment options
export const getWalletPaymentOptions = (cartTotal) => {
  return async () => {
    const summary = await getWalletSummary();
    const { balance } = summary;

    const options = [];

    if (balance > 0) {
      // Full payment option
      if (balance >= cartTotal) {
        options.push({
          label: `Pay full ₹${cartTotal} from wallet`,
          value: 'full',
          amount: cartTotal,
          remaining: 0,
          usesFullWallet: true
        });
      }

      // Partial payment option
      if (balance > 0 && balance < cartTotal) {
        options.push({
          label: `Use ₹${balance} from wallet, pay remaining ₹${cartTotal - balance}`,
          value: 'partial',
          amount: balance,
          remaining: cartTotal - balance,
          usesFullWallet: false
        });
      }

      // Custom amount option
      options.push({
        label: 'Use custom amount from wallet',
        value: 'custom',
        amount: 0,
        remaining: cartTotal,
        usesFullWallet: false,
        isCustom: true
      });
    }

    return {
      balance,
      options,
      hasBalance: balance > 0,
      canPayFull: balance >= cartTotal
    };
  };
};

// Process wallet payment (called from checkout)
export const processWalletPayment = async (orderData) => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) {
      throw new Error('Please login to use wallet');
    }

    const response = await axios.post(
      `${API_URL}/api/orders`,
      {
        ...orderData,
        useWallet: true,
        walletUsed: orderData.walletAmount || 0
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (error) {
    console.error('Wallet payment error:', error);
    throw error;
  }
};

// Admin: Add wallet balance
export const addWalletBalance = async (userId, amount, description = 'Admin credit') => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post(
      `${API_URL}/api/users/${userId}/wallet`,
      { amount, description },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (error) {
    console.error('Error adding wallet balance:', error);
    throw error;
  }
};

// Admin: Get user wallet details
export const getUserWalletDetails = async (userId) => {
  try {
    const token = localStorage.getItem('loop_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get(`${API_URL}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      balance: response.data?.wallet?.balance || 0,
      transactions: response.data?.wallet?.transactions || []
    };
  } catch (error) {
    console.error('Error fetching user wallet:', error);
    return { balance: 0, transactions: [] };
  }
};

// Export wallet history as CSV
export const exportWalletHistory = async (transactions) => {
  if (!transactions || transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  const headers = ['Date', 'Type', 'Amount', 'Description', 'Order ID'];
  const rows = transactions.map(t => [
    new Date(t.createdAt).toLocaleString(),
    t.type || 'unknown',
    t.amount || 0,
    t.description || '',
    t.orderId || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wallet-history-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export default {
  getWalletBalance,
  getWalletTransactions,
  hasSufficientWalletBalance,
  formatWalletAmount,
  getWalletSummary,
  getWalletPaymentOptions,
  processWalletPayment,
  addWalletBalance,
  getUserWalletDetails,
  exportWalletHistory
};