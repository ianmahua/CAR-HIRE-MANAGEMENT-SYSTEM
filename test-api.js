const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test login and fetch data
async function testAPI() {
  try {
    console.log('🔍 Testing API Connection...\n');

    // 1. Health Check
    console.log('1. Testing Health Endpoint...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Health:', health.data);
    console.log('');

    // 2. Login
    console.log('2. Testing Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@ressytours.com',
      password_hash: 'admin123'
    });
    console.log('✅ Login successful!');
    const token = loginResponse.data.token;
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('User:', loginResponse.data.data);
    console.log('');

    // Set up authenticated requests
    const authHeaders = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    // 3. Get Current User
    console.log('3. Fetching Current User...');
    const user = await axios.get(`${API_URL}/auth/me`, authHeaders);
    console.log('✅ User Data:', JSON.stringify(user.data.data, null, 2));
    console.log('');

    // 4. Get All Vehicles
    console.log('4. Fetching Vehicles...');
    const vehicles = await axios.get(`${API_URL}/vehicles`, authHeaders);
    console.log(`✅ Found ${vehicles.data.count} vehicles`);
    if (vehicles.data.data.length > 0) {
      console.log('Sample vehicle:', JSON.stringify(vehicles.data.data[0], null, 2));
    }
    console.log('');

    // 5. Get All Customers
    console.log('5. Fetching Customers...');
    const customers = await axios.get(`${API_URL}/customers`, authHeaders);
    console.log(`✅ Found ${customers.data.count} customers`);
    if (customers.data.data.length > 0) {
      console.log('Sample customer:', JSON.stringify(customers.data.data[0], null, 2));
    }
    console.log('');

    // 6. Get All Rentals
    console.log('6. Fetching Rentals...');
    const rentals = await axios.get(`${API_URL}/rentals`, authHeaders);
    console.log(`✅ Found ${rentals.data.count} rentals`);
    if (rentals.data.data.length > 0) {
      console.log('Sample rental:', JSON.stringify(rentals.data.data[0], null, 2));
    }
    console.log('');

    // 7. Get Admin Dashboard
    console.log('7. Fetching Admin Dashboard...');
    const dashboard = await axios.get(`${API_URL}/admin/dashboard`, authHeaders);
    console.log('✅ Dashboard Data:', JSON.stringify(dashboard.data.data, null, 2));
    console.log('');

    // 8. Get Transactions
    console.log('8. Fetching Transactions...');
    const transactions = await axios.get(`${API_URL}/transactions`, authHeaders);
    console.log(`✅ Found ${transactions.data.count} transactions`);
    console.log('');

    console.log('✅ All API tests completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('Authentication failed. Check credentials.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to backend. Is the server running on port 5000?');
    }
  }
}

testAPI();




