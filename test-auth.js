import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';

// Test signup endpoint
async function testSignup() {
  try {
    const response = await fetch(`${baseUrl}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
      }),
    });
    
    const data = await response.json();
    console.log('Signup response:', data);
    
    if (data.token) {
      return data.token;
    }
    return null;
  } catch (error) {
    console.error('Signup error:', error);
    return null;
  }
}

// Test login endpoint
async function testLogin(email = 'test@example.com', password = 'password123') {
  try {
    const response = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    
    if (data.token) {
      return data.token;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Test get user endpoint
async function testGetUser(token) {
  try {
    const response = await fetch(`${baseUrl}/api/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    console.log('Get user response:', data);
    return data;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('Testing authentication endpoints...');
  
  // Test signup
  console.log('\n--- Testing Signup ---');
  const signupEmail = `test${Date.now()}@example.com`;
  const password = 'password123';
  
  const signupResponse = await fetch(`${baseUrl}/api/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Test User',
      email: signupEmail,
      password: password,
    }),
  });
  
  const signupData = await signupResponse.json();
  console.log('Signup response:', signupData);
  
  const token = signupData.token;
  if (!token) {
    console.log('Signup failed, skipping remaining tests.');
    return;
  }
  
  // Test get user with token from signup
  console.log('\n--- Testing Get User ---');
  await testGetUser(token);
  
  // Test login with the newly created user
  console.log('\n--- Testing Login ---');
  const loginToken = await testLogin(signupEmail, password);
  
  if (loginToken) {
    console.log('Login successful!');
  } else {
    console.log('Login failed.');
  }
}

runTests();