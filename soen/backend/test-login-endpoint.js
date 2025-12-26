import fetch from 'node-fetch'; // Or native fetch in Node 18+

async function testLogin() {
    console.log("Testing Login Endpoint...");
    try {
        const response = await fetch('https://backend-1041763297166.asia-south1.run.app/users/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "vishal@gmail.com",
                password: "wrongpassword",
                adminPin: "12345678"
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text);
    } catch (err) {
        console.error("Error:", err);
    }
}

testLogin();
