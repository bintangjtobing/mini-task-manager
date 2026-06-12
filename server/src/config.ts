import path from 'node:path';

export const PORT = Number(process.env.PORT ?? 4000);
// Bind to loopback by default so the API is only reachable through the nginx
// reverse proxy, never directly on the server's public IP. Override with HOST=0.0.0.0
// only if you intentionally want to expose it.
export const HOST = process.env.HOST ?? '127.0.0.1';
export const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
export const DATA_DIR = process.env.DATA_DIR ?? path.resolve(__dirname, '..', 'data');
export const DB_FILE = process.env.DB_FILE ?? path.join(DATA_DIR, 'db.json');
