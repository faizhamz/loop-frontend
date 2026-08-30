import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDescription, setWalletDescription] = useState('');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loop_token');
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    
    const term = searchTerm.toLowerCase().trim();
    return users.filter(user =>
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.phone?.includes(term) ||
      user.refId?.toLowerCase().includes(term) ||
      user.referralCode?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // ============================================
  // EXPORT FUNCTIONALITY
  // ============================================
  const exportCSV = () => {
    const headers = ['Ref ID', 'Name', 'Email', 'Phone', 'Gender', 'Orders', 'Total Spent', 'Wallet Balance', 'Status', 'Joined'];
    const rows = filteredUsers.map(user => [
      user.refId || 'N/A',
      user.name || 'N/A',
      user.email || 'N/A',
      user.phone || 'N/A',
      user.gender || 'Not set',
      user.orderIds?.length || 0,
      user.totalSpent || 0,
      user.wallet?.balance || 0,
      user.isActive ? 'Active' : 'Inactive',
      new Date(user.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const data = filteredUsers.map(user => ({
      'Ref ID': user.refId || 'N/A',
      'Name': user.name || 'N/A',
      'Email': user.email || 'N/A',
      'Phone': user.phone || 'N/A',
      'Gender': user.gender || 'Not set',
      'Orders': user.orderIds?.length || 0,
      'Total Spent': user.totalSpent || 0,
      'Wallet Balance': user.wallet?.balance || 0,
      'Status': user.isActive ? 'Active' : 'Inactive',
      'Joined': new Date(user.createdAt).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `users-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ============================================
  // REST OF THE COMPONENT
  // ============================================
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('loop_token');
      await axios.patch(`${API_URL}/api/users/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleAddWalletCredit = async () => {
    if (!walletAmount) return;
    try {
      const token = localStorage.getItem('loop_token');
      await axios.post(`${API_URL}/api/users/${selectedUser._id}/wallet`, {
        amount: Number(walletAmount),
        description: walletDescription || 'Admin credit'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowWalletModal(false);
      setWalletAmount('');
      setWalletDescription('');
      fetchUsers();
    } catch (error) {
      console.error('Error adding wallet credit:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('loop_token');
      await axios.delete(`${API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUserForDetails(user);
    setShowUserDetailsModal(true);
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    suspended: users.filter(u => !u.isActive).length,
    totalSpent: users.reduce((sum, u) => sum + (u.totalSpent || 0), 0)
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>👥 User Management ({users.length})</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={exportCSV}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📄 CSV
          </button>
          <button
            onClick={exportExcel}
            style={{
              padding: '8px 16px',
              background: '#0066FF',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📊 Excel
          </button>
          <button 
            onClick={() => window.location.href = '/admin/users/add'}
            style={{ background: '#D4AF37', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}
          >
            + Add User
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card"><h3>{stats.total}</h3><p>Total Users</p></div>
        <div className="stat-card"><h3>{stats.active}</h3><p>Active</p></div>
        <div className="stat-card"><h3>{stats.suspended}</h3><p>Suspended</p></div>
        <div className="stat-card"><h3>₹{stats.totalSpent.toLocaleString()}</h3><p>Total Spent</p></div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Search by Name, Email, Phone, Ref ID, Referral Code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '12px',
            background: '#222',
            border: '1px solid #333',
            color: 'white',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕ Clear
          </button>
        )}
        <span style={{ color: '#666', fontSize: '13px' }}>
          {filteredUsers.length} results
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Ref ID</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Orders</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Wallet</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #333' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <strong>{user.refId || 'N/A'}</strong>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>{user.name}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>{user.email}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>{user.orderIds?.length || 0}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>₹{user.wallet?.balance || 0}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: user.isActive ? '#28a745' : '#ff4444',
                    color: '#fff',
                    fontSize: '12px'
                  }}>
                    {user.isActive ? '✅ Active' : '⛔ Suspended'}
                  </span>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <button 
                    onClick={() => viewUserDetails(user)}
                    style={{ marginRight: '5px', background: '#8B5CF6', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                    title="View Details"
                  >
                    👁️
                  </button>
                  <button 
                    onClick={() => { setSelectedUser(user); setShowWalletModal(true); }}
                    style={{ marginRight: '5px', background: '#D4AF37', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: '#000' }}
                    title="Add Wallet Credit"
                  >
                    💰
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(user._id, user.isActive)}
                    style={{ marginRight: '5px', background: user.isActive ? '#ff8800' : '#28a745', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                  >
                    {user.isActive ? '⏸️' : '▶️'}
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user._id)}
                    style={{ background: '#ff4444', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ background: '#111', padding: '30px', borderRadius: '8px', width: '400px' }}>
            <h3>💰 Add Wallet Credit</h3>
            <p style={{ color: '#888', marginBottom: '15px' }}>User: {selectedUser?.name} ({selectedUser?.refId})</p>
            <input
              type="number"
              placeholder="Amount (₹)"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={walletDescription}
              onChange={(e) => setWalletDescription(e.target.value)}
              style={{ width: '100%', padding: '12px', margin: '10px 0', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleAddWalletCredit} style={{ background: '#D4AF37', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Add Credit
              </button>
              <button onClick={() => setShowWalletModal(false)} style={{ background: '#333', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal - Simplified */}
      {showUserDetailsModal && selectedUserForDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ background: '#111', padding: '30px', borderRadius: '12px', width: '500px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#D4AF37' }}>👤 User Details</h3>
              <button onClick={() => setShowUserDetailsModal(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><strong style={{ color: '#888' }}>Name:</strong> <span style={{ color: '#fff' }}>{selectedUserForDetails.name}</span></div>
              <div><strong style={{ color: '#888' }}>Email:</strong> <span style={{ color: '#fff' }}>{selectedUserForDetails.email}</span></div>
              <div><strong style={{ color: '#888' }}>Phone:</strong> <span style={{ color: '#fff' }}>{selectedUserForDetails.phone || 'N/A'}</span></div>
              <div><strong style={{ color: '#888' }}>Gender:</strong> <span style={{ color: '#fff' }}>{selectedUserForDetails.gender || 'Not set'}</span></div>
              <div><strong style={{ color: '#888' }}>Ref ID:</strong> <span style={{ color: '#fff' }}>{selectedUserForDetails.refId}</span></div>
              <div><strong style={{ color: '#888' }}>Orders:</strong> <span style={{ color: '#fff' }}>{selectedUserForDetails.orderIds?.length || 0}</span></div>
              <div><strong style={{ color: '#888' }}>Total Spent:</strong> <span style={{ color: '#D4AF37' }}>₹{selectedUserForDetails.totalSpent || 0}</span></div>
              <div><strong style={{ color: '#888' }}>Wallet:</strong> <span style={{ color: '#D4AF37' }}>₹{selectedUserForDetails.wallet?.balance || 0}</span></div>
              <div><strong style={{ color: '#888' }}>Referrals:</strong> <span style={{ color: '#fff' }}>{selectedUserForDetails.referrals?.length || 0}</span></div>
              <div><strong style={{ color: '#888' }}>Status:</strong> <span style={{ color: selectedUserForDetails.isActive ? '#28a745' : '#ff4444' }}>
                {selectedUserForDetails.isActive ? '✅ Active' : '⛔ Suspended'}
              </span></div>
              <div><strong style={{ color: '#888' }}>Joined:</strong> <span style={{ color: '#fff' }}>{new Date(selectedUserForDetails.createdAt).toLocaleDateString()}</span></div>
              <div><strong style={{ color: '#888' }}>Last Login:</strong> <span style={{ color: '#fff' }}>{selectedUserForDetails.lastLogin ? new Date(selectedUserForDetails.lastLogin).toLocaleDateString() : 'Never'}</span></div>
            </div>
            
            {selectedUserForDetails.wallet?.transactions && selectedUserForDetails.wallet.transactions.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '12px' }}>
                <h4 style={{ color: '#D4AF37', fontSize: '14px' }}>Recent Wallet Transactions</h4>
                {selectedUserForDetails.wallet.transactions.slice(-5).reverse().map((tx, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #222', fontSize: '13px' }}>
                    <span style={{ color: '#888' }}>{tx.description}</span>
                    <span style={{ color: tx.type === 'credit' ? '#28a745' : '#ff4444' }}>
                      {tx.type === 'credit' ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowUserDetailsModal(false)} style={{ flex: 1, padding: '10px', background: '#333', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPanel;