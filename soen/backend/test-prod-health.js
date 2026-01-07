import axios from 'axios';

const API_URL = 'https://backend-1041763297166.asia-south1.run.app';

async function checkHealth() {
    console.log(`Checking Health against: ${API_URL}`);

    // Check Root
    try {
        const res = await axios.get(`${API_URL}/`);
        console.log("ROOT Status:", res.status);
        console.log("ROOT Data:", res.data);
    } catch (err) {
        console.log("ROOT Error:", err.message);
    }

    // Check DB Status
    try {
        const res = await axios.get(`${API_URL}/test-db`);
        console.log("DB_TEST Status:", res.status);
        console.log("DB_TEST Data:", res.data);
    } catch (err) {
        console.log("DB_TEST Error:", err.message);
    }
}

checkHealth();
