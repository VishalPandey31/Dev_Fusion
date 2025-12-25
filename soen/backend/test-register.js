import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const form = new FormData();
form.append('email', 'test-admin-script@example.com');
form.append('password', 'password123');
form.append('adminPin', '12345678');
form.append('secretCode', 'Dev_Fusion');

// Create a dummy file for the proof (imitate PNG)
const dummyFilePath = 'dummy-proof.png';
fs.writeFileSync(dummyFilePath, 'fake image content');
form.append('identityProof', fs.createReadStream(dummyFilePath), { filename: 'dummy-proof.png', contentType: 'image/png' });

async function run() {
    try {
        console.log('Sending Registration Request to http://localhost:5000/admin/register ...');
        const response = await axios.post('http://localhost:5000/admin/register', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Data:', response.data);
    } catch (error) {
        console.error('❌ Request Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

run();
