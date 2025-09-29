#!/usr/bin/env node
// Simple wait script for Postgres readiness
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://root:postgres@db:5432/process_flow_db';
const maxRetries = parseInt(process.env.DB_MAX_RETRIES || '20', 10);
const delayMs = parseInt(process.env.DB_RETRY_DELAY || '1500', 10);

async function wait() {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = new Client({ connectionString });
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log(`DB接続成功 (attempt ${attempt})`);
      return;
    } catch (e) {
      console.log(`DB接続待機中 attempt=${attempt}/${maxRetries} error=${e.code || e.message}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  console.error('データベースに接続できませんでした。終了します。');
  process.exit(1);
}

wait();
