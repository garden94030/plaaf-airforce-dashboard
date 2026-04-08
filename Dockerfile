FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.js"]
