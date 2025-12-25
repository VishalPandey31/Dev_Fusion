import http from 'http';

const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/users/admin-login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': 2
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`BODY: ${data}`);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write('{}');
req.end();
