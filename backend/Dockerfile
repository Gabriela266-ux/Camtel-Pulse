FROM node:22-bookworm-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

ENV NODE_ENV=production
EXPOSE 5000
CMD ["sh", "-c", "npm run db:migrate && npm run start:cluster"]
