'use strict';

const Redis = require('ioredis');

const enabled = String(process.env.REDIS_ENABLED || (process.env.NODE_ENV === 'production' ? 'true' : 'false')).toLowerCase() === 'true';
let client;
let subscriber;

function getClient() {
  if (!enabled) return null;
  if (!client) client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { lazyConnect: true, maxRetriesPerRequest: 2 });
  return client;
}

function duplicateClient() {
  const redis = getClient();
  return redis ? redis.duplicate() : null;
}

function rateLimitStore(prefix = 'camtel:rate-limit:') {
  const redis = getClient();
  if (!redis) return undefined;
  const { RedisStore } = require('rate-limit-redis');
  return new RedisStore({ prefix, sendCommand: (...args) => redis.call(...args) });
}

async function connect() {
  if (!enabled) return { enabled: false, connected: false };
  const redis = getClient();
  if (redis.status === 'wait') await redis.connect();
  await redis.ping();
  return { enabled: true, connected: true };
}

async function close() {
  await Promise.all([client, subscriber].filter(Boolean).map((connection) => connection.quit().catch(() => undefined)));
}

async function createSession(sessionId, payload, ttlSeconds) {
  const redis = getClient();
  if (!redis) return;
  await redis.set(`camtel:session:${sessionId}`, JSON.stringify(payload), 'EX', ttlSeconds);
}

async function isSessionActive(sessionId) {
  const redis = getClient();
  if (!redis || !sessionId) return true;
  return Boolean(await redis.exists(`camtel:session:${sessionId}`));
}

async function revokeSession(sessionId) {
  const redis = getClient();
  if (redis && sessionId) await redis.del(`camtel:session:${sessionId}`);
}

async function getCache(key) {
  const redis = getClient();
  return redis ? redis.get(`camtel:cache:${key}`) : null;
}

async function setCache(key, value, ttlSeconds = 60) {
  const redis = getClient();
  if (redis) await redis.set(`camtel:cache:${key}`, JSON.stringify(value), 'EX', ttlSeconds);
}

async function deleteCache(key) {
  const redis = getClient();
  if (redis) await redis.del(`camtel:cache:${key}`);
}

async function publish(channel, payload) {
  const redis = getClient();
  if (redis) await redis.publish(`camtel:${channel}`, JSON.stringify(payload));
}

function status() {
  return { enabled, connected: Boolean(client && client.status === 'ready') };
}

module.exports = { enabled, connect, close, createSession, isSessionActive, revokeSession, getCache, setCache, deleteCache, publish, duplicateClient, rateLimitStore, status };