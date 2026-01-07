import axios from 'axios';
import fs from 'fs';

const API_URL = 'https://backend-1041763297166.asia-south1.run.app';

async function testLogin() {
    let log = '';
    const mn = (str) => {
        console.log(str);
        log += str + '\n';
    };

    mn(`Testing Login against: ${API_URL}`);
    try {
        const payload = {
            email: 'member1@gmail.com',
            password: '....'
        };
        mn("Payload: " + JSON.stringify(payload));

        const res = await axios.post(`${API_URL}/users/login`, payload);
        mn("Status: " + res.status);
        mn("Data: " + JSON.stringify(res.data));
    } catch (err) {
        if (err.response) {
            mn("Error Status: " + err.response.status);
            mn("Error Data: " + JSON.stringify(err.response.data, null, 2));
            mn("Error Headers: " + JSON.stringify(err.response.headers));
        } else {
            mn("Error: " + err.message);
        }
    }
    fs.writeFileSync('test_output_clean.txt', log);
}

testLogin();
