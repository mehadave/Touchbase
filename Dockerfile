FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
ENV PORT=8080
EXPOSE 8080
CMD ["node", "index.js"]
