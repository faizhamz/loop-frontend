import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://loop-backend-jwke.onrender.com';

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDescription, setWalletDescription] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ UPDATED: Added auth token
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

  // ✅ UPDATED: Added auth token
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

  // ✅ UPDATED: Added auth token
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

  // ✅ UPDATED: Added auth token
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

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.refId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2>User Management</h2>
        <button 
          onClick={() => window.location.href = '/admin/users/add'}
          style={{ background: '#D4AF37', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
        >
          + Add User
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card"><h3>{stats.total}</h3><p>Total Users</p></div>
        <div className="stat-card"><h3>{stats.active}</h3><p>Active</p></div>
        <div className="stat-card"><h3>{stats.suspended}</h3><p>Suspended</p></div>
        <div className="stat-card"><h3>₹{stats.totalSpent.toLocaleString()}</h3><p>Total Spent</p></div>
      </div>

      <input
        type="text"
        placeholder="Search by name, email, or Ref ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
      />

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
                    {user.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                  <button 
                    onClick={() => { setSelectedUser(user); setShowWalletModal(true); }}
                    style={{ marginRight: '5px', background: '#D4AF37', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Add Credit
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(user._id, user.isActive)}
                    style={{ marginRight: '5px', background: '#0066FF', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                  >
                    {user.isActive ? 'Suspend' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user._id)}
                    style={{ background: '#ff4444', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            <h3>Add Wallet Credit</h3>
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
    </div>
  );
}

export default UsersPanel;