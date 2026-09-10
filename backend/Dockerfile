FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm install --omit=dev --omit=optional
COPY . .
EXPOSE 4000
CMD ["node", "src/server.js"]
