#!/usr/bin/env node
// Forwards production logs (Azure Container Apps log stream) into the local Loki, labelled
// env="production", so the Grafana dashboard's production view shows real production logs.
//
//   docker compose --profile monitoring up -d        # Alloy listens for pushes on 127.0.0.1:3500
//   node scripts/prod-logs-to-loki.mjs               # Ctrl+C to stop
//
// Needs the Azure CLI logged in to the subscription that holds blogflow-rg.

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const RESOURCE_GROUP = process.env.RESOURCE_GROUP || 'blogflow-rg';
const PUSH_URL = process.env.LOKI_PUSH_URL || 'http://127.0.0.1:3500/loki/api/v1/push';
// container app -> the service label the dashboard already uses locally
const APPS = { 'blogflow-api': 'backend', 'blogflow-web': 'frontend' };

const queue = [];
let sent = 0;

function follow(app, service) {
  const args = ['containerapp', 'logs', 'show', '-n', app, '-g', RESOURCE_GROUP, '--type', 'console', '--follow', '--tail', '100', '--format', 'json'];
  const az = spawn('az', args, { shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'ignore'] });
  createInterface({ input: az.stdout }).on('line', (raw) => {
    let entry;
    try {
      entry = JSON.parse(raw);
    } catch {
      return;
    }
    const line = String(entry.Log ?? '').trim();
    // skip the CLI's own "Connecting to the container..." notices
    if (!line || line.startsWith('Connecting to the container') || line.startsWith('Successfully Connected')) return;
    // prefer the time the API wrote the line (winston's `timestamp`); the stream's own TimeStamp is
    // when Azure delivered it, which bunches a whole batch into one instant
    let ms;
    try {
      ms = Date.parse(JSON.parse(line).timestamp);
    } catch {
      /* not a JSON line (nginx access log) */
    }
    ms ||= Date.parse(entry.TimeStamp) || Date.now();
    queue.push({ labels: { service, env: 'production', container: app }, ts: `${BigInt(ms) * 1000000n}`, line });
  });
  // the stream ends now and then (idle timeouts, replica restarts): reconnect
  az.on('exit', () => setTimeout(() => follow(app, service), 3000));
  console.log(`following ${app} -> {service="${service}", env="production"}`);
}

async function flush() {
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  const streams = new Map();
  for (const e of batch) {
    const key = JSON.stringify(e.labels);
    if (!streams.has(key)) streams.set(key, { stream: e.labels, values: [] });
    streams.get(key).values.push([e.ts, e.line]);
  }
  try {
    const res = await fetch(PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streams: [...streams.values()] }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    sent += batch.length;
  } catch (err) {
    console.error(`push failed (${err.message}); is the monitoring profile running?`);
  }
}

for (const [app, service] of Object.entries(APPS)) follow(app, service);
setInterval(flush, 2000);
setInterval(() => console.log(`${sent} production log lines forwarded`), 30000);
