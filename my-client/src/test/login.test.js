// Test file to verify login functionality
// Run: npm run dev (in my-client) and node index.js (in my-server)

// Test API endpoint
async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test@example.com',
        password: 'password123',
      }),
    });

    const data = await response.json();
    console.log('Login Response:', data);
    
    if (data.success) {
      console.log('✅ Login successful!');
      console.log('Token:', data.token);
      console.log('User:', data.user);
    } else {
      console.log('❌ Login failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run test when page loads
if (typeof window !== 'undefined') {
  window.testLogin = testLogin;
}

export { testLogin };
