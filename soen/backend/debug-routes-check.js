import express from 'express';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);
app.use('/admin', adminRoutes);

function printRoutes(stack, basePath = '') {
    stack.forEach(layer => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            console.log(`${methods} ${basePath}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
            let nextPath = basePath;
            // This is a rough heuristic to find the path prefix for the router
            // It relies on the regex format Express uses
            const pathRegex = layer.regexp.toString();
            // Example regex: /^\/users\/?(?=\/|$)/i
            const match = pathRegex.match(/^\/\^\\(\/.*?)\\\/\?\(\?=\\\/\|\$\)\/i/);
            if (match) {
                nextPath += match[1].replace(/\\/g, '');
            } else {
                // Fallback for simple cases or when regex is different
                // This part is tricky without digging into internal private properties
                // For now, let's just inspect the known mounts
            }
            printRoutes(layer.handle.stack, nextPath);
        }
    });
}

console.log("--- Registered Routes ---");
// Manually inspecting known mounts to be sure
console.log("Checking /users mount...");
const userStack = userRoutes.stack;
userStack.forEach(r => {
    if (r.route) {
        console.log(`POST /users${r.route.path}`);
    }
});

console.log("\nChecking /admin mount...");
const adminStack = adminRoutes.stack;
adminStack.forEach(r => {
    if (r.route) {
        console.log(`POST /admin${r.route.path}`);
    }
});
