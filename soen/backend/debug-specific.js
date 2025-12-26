
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
        console.log(`Status: ${status}`);
        console.log('RAW Response Body:');
        console.log(data);
    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

async function run() {
    await testLogin({
        email: 'bad-email',
        password: 'password123',
        adminPin: '12345678'
    }, 'Invalid Email Format');
}

run();
