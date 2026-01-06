
import 'dotenv/config.js';
import fs from 'fs';
const key = process.env.GOOGLE_AI_KEY;
const status = key ? "PRESENT" : "MISSING";
// Also check port
const port = process.env.PORT || 3000;
const output = `KEY: ${status}\nPORT: ${port}`;
fs.writeFileSync('env_debug_status.txt', output);
