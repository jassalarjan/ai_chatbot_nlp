const axios = require('axios');

async function setupTestUser() {
    try {
        // Register test user
        console.log('Registering test user...');
        await axios.post('http://localhost:5000/api/register', {
            username: 'test_user',
            password: 'test_password'
        });
        console.log('Test user registered successfully');

        // Login to get auth token
        console.log('Logging in to get auth token...');
        const loginResponse = await axios.post('http://localhost:5000/api/login', {
            username: 'test_user',
            password: 'test_password'
        });

        const authToken = loginResponse.data.token;
        console.log('Auth token received:', authToken);

        // Save token to a file for the test script to use
        const fs = require('fs');
        fs.writeFileSync('test_auth_token.txt', authToken);
        console.log('Auth token saved to test_auth_token.txt');

    } catch (error) {
        if (error.response?.status === 409) {
            console.log('Test user already exists, proceeding to login...');
            try {
                const loginResponse = await axios.post('http://localhost:5000/api/login', {
                    username: 'test_user',
                    password: 'test_password'
                });

                const authToken = loginResponse.data.token;
                console.log('Auth token received:', authToken);

                // Save token to a file for the test script to use
                const fs = require('fs');
                fs.writeFileSync('test_auth_token.txt', authToken);
                console.log('Auth token saved to test_auth_token.txt');

            } catch (loginError) {
                console.error('Error logging in:', loginError.message);
                process.exit(1);
            }
        } else {
            console.error('Error setting up test user:', error.message);
            process.exit(1);
        }
    }
}

setupTestUser(); 