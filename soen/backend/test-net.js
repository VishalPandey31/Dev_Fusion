
import https from 'https';

console.log("Testing connectivity to generativelanguage.googleapis.com...");

const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: '/',
    method: 'GET'
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        // console.log(d.toString());
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});

req.end();
