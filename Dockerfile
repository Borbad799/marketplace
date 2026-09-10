FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json ./
RUN npm install --omit=dev --omit=optional
COPY backend/ ./
EXPOSE 4000
CMD ["node", "src/server.js"]
