
const BASE_URL = 'https://backend-1041763297166.asia-south1.run.app';

async function testLogin(payload, description) {
    console.log(`\n--- Testing: ${description} ---`);
    try {
        const response = await fetch(`${BASE_URL}/users/admin-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        let data = await response.text();
        try {
            data = JSON.parse(data);
        } catch (e) {
            // keep as text
        }

        console.log(`Status: ${status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Test Cases
async function run() {
    // 1. Valid Payload (assuming generic test admin exists or just format check)
    await testLogin({
        email: 'admin@example.com',
        password: 'password123',
        adminPin: '12345678'
    }, 'Valid Format (8 digit PIN)');

    // 2. Short PIN
    await testLogin({
        email: 'admin@example.com',
        password: 'password123',
        adminPin: '1234'
    }, 'Invalid Logic (4 digit PIN)');

    // 3. Missing PIN
    await testLogin({
        email: 'admin@example.com',
        password: 'password123'
    }, 'Missing PIN');

    // 4. Invalid Email
    await testLogin({
        email: 'not-an-email',
        password: 'password123',
        adminPin: '12345678'
    }, 'Invalid Email');

    // 5. User's specific email (to see if it hits a catch block)
    await testLogin({
        email: 'vishal@gmail.com',
        password: 'password123',
        adminPin: '12345678'
    }, 'Specific User: vishal@gmail.com');

    // 6. Check DB Connection endpoint
    console.log(`\n--- Testing: /test-db ---`);
    try {
        const res = await fetch(`${BASE_URL}/test-db`);
        console.log('Status:', res.status);
        console.log('Body:', await res.text());
    } catch (e) { console.error(e.message); }
}

run();

