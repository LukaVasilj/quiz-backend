import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbarr'; // Adjust the path according to your project structure
import '../App.css';  // Ensure you're importing the CSS file

const AdminDashboard = () => {
  const [username, setUsername] = useState(''); // Define the username state
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [editUser, setEditUser] = useState(null);

  useEffect(() => {
    // Retrieve the token and username from local storage or any other state management solution
    const storedUsername = localStorage.getItem('username'); // Retrieve the username
    setUsername(storedUsername); // Set the username state
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateUser = async () => {
    // Validacija da su sva polja popunjena
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.role) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/admin/users', newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/admin/users/${editUser.id}`, editUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (id, username) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${username}?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div>
      <Navbar username={username} onLogout={() => {}} showLogoutOnly={true} /> {/* Add Navbar with showLogoutOnly prop */}
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <div className="user-form">
          <h2>Create User</h2>
          <input
            type="text"
            placeholder="Username"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleCreateUser}>Create</button>
        </div>
        {editUser && (
          <div className="user-form">
            <h2>Edit User</h2>
            <input
              type="text"
              placeholder="Username"
              value={editUser.username}
              onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={editUser.email}
              onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
            />
            <select
              value={editUser.role}
              onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleUpdateUser}>Update</button>
            <button onClick={() => setEditUser(null)} style={{ marginLeft: '5px' }}>Cancel</button>
          </div>
        )}
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button onClick={() => setEditUser(user)}>Edit</button>
                  <button onClick={() => handleDeleteUser(user.id, user.username)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;