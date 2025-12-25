# 1. Lightweight Node.js image
FROM node:18-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install only production dependencies
RUN npm install --production

# 5. Copy rest of the app code
COPY . .

# 6. Use Cloud Run default port (8080)
ENV PORT 8080
EXPOSE 8080

# 7. Start the server
CMD ["node", "server.js"]
