import 'dotenv/config.js';
import fs from 'fs';

const key = process.env.GOOGLE_AI_KEY || "NO_KEY_FOUND";
fs.writeFileSync('secret_key_temp.txt', key.trim());
console.log("Key written to file.");
