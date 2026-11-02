// Generates dashboards/blogflow.json. Edit panels here, then: node monitoring/grafana/build-dashboard.mjs
import { writeFileSync } from 'node:fs';

const prom = { type: 'prometheus', uid: 'prometheus' };
const loki = { type: 'loki', uid: 'loki' };
const APP = 'route!~"/health.*|/metrics", env=~"$env"';

let id = 0;
const panel = (type, title, gridPos, targets, extra = {}) => ({
  id: ++id,
  type,
  title,
  gridPos,
  datasource: targets[0]?.datasource ?? prom,
  targets: targets.map((t, i) => ({ refId: String.fromCharCode(65 + i), datasource: prom, ...t })),
  ...extra,
});

const stat = (title, x, expr, unit, thresholds, extra = {}) =>
  panel('stat', title, { x, y: 0, w: 4, h: 4 }, [{ expr, instant: true }], {
    fieldConfig: {
      defaults: {
        unit,
        thresholds: { mode: 'absolute', steps: thresholds },
        ...extra,
      },
      overrides: [],
    },
    options: { colorMode: 'background', graphMode: 'none', reduceOptions: { calcs: ['lastNotNull'] } },
  });

const series = (title, gridPos, targets, unit, extra = {}) =>
  panel('timeseries', title, gridPos, targets, {
    fieldConfig: {
      defaults: { unit, custom: { lineWidth: 2, fillOpacity: 10, showPoints: 'never' } },
      overrides: [],
    },
    options: { legend: { displayMode: 'table', placement: 'bottom', calcs: ['mean', 'max', 'lastNotNull'] }, tooltip: { mode: 'multi' } },
    ...extra,
  });

const green = (v = null) => ({ color: 'green', value: v });
const red = (v) => ({ color: 'red', value: v });
const amber = (v) => ({ color: 'orange', value: v });

const panels = [
  // --- row 1: headline stats ---
  stat('API status', 0, 'min(up{job=~"blogflow-api.*", env=~"$env"})', 'none', [red(null), green(1)], {
    mappings: [{ type: 'value', options: { 0: { text: 'DOWN' }, 1: { text: 'UP' } } }],
  }),
  stat('Request rate', 4, `sum(rate(http_requests_total{${APP}}[$__rate_interval]))`, 'reqps', [green()]),
  stat(
    'Error rate (5xx)',
    8,
    `(sum(rate(http_requests_total{status=~"5..", ${APP}}[$__rate_interval])) or vector(0)) / clamp_min(sum(rate(http_requests_total{${APP}}[$__rate_interval])), 1e-9)`,
    'percentunit',
    [green(), amber(0.01), red(0.05)],
    { decimals: 2 }
  ),
  stat(
    'p95 latency',
    12,
    `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{${APP}}[$__rate_interval])))`,
    's',
    [green(), amber(0.25), red(0.5)]
  ),
  stat('Database', 16, 'min(pg_up)', 'none', [red(null), green(1)], {
    mappings: [{ type: 'value', options: { 0: { text: 'DOWN' }, 1: { text: 'UP' } } }],
  }),
  stat('API uptime', 20, 'time() - max(process_start_time_seconds{job=~"blogflow-api.*", env=~"$env"})', 's', [green()]),

  // --- row 2: traffic & latency ---
  series(
    'Request rate by route',
    { x: 0, y: 4, w: 12, h: 9 },
    [{ expr: `sum by (method, route) (rate(http_requests_total{${APP}}[$__rate_interval]))`, legendFormat: '{{method}} {{route}}' }],
    'reqps'
  ),
  series(
    'Response time percentiles',
    { x: 12, y: 4, w: 12, h: 9 },
    [0.5, 0.95, 0.99].map((q) => ({
      expr: `histogram_quantile(${q}, sum by (le) (rate(http_request_duration_seconds_bucket{${APP}}[$__rate_interval])))`,
      legendFormat: `p${q * 100}`,
    })),
    's'
  ),

  // --- row 3: errors & resources ---
  series(
    'Responses by status class',
    { x: 0, y: 13, w: 8, h: 8 },
    [
      {
        expr: `sum by (class) (label_replace(rate(http_requests_total{${APP}}[$__rate_interval]), "class", "\${1}xx", "status", "(\\\\d).."))`,
        legendFormat: '{{class}}',
      },
    ],
    'reqps',
    {
      fieldConfig: {
        defaults: { unit: 'reqps', custom: { lineWidth: 2, fillOpacity: 30, stacking: { mode: 'normal' }, showPoints: 'never' } },
        overrides: [
          { matcher: { id: 'byName', options: '2xx' }, properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: 'green' } }] },
          { matcher: { id: 'byName', options: '4xx' }, properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: 'orange' } }] },
          { matcher: { id: 'byName', options: '5xx' }, properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: 'red' } }] },
        ],
      },
    }
  ),
  series(
    'API CPU usage',
    { x: 8, y: 13, w: 8, h: 8 },
    [{ expr: 'rate(process_cpu_seconds_total{job=~"blogflow-api.*", env=~"$env"}[$__rate_interval])', legendFormat: '{{env}} CPU' }],
    'percentunit'
  ),
  series(
    'API memory',
    { x: 16, y: 13, w: 8, h: 8 },
    [
      { expr: 'process_resident_memory_bytes{job=~"blogflow-api.*", env=~"$env"}', legendFormat: 'RSS' },
      { expr: 'nodejs_heap_size_used_bytes{job=~"blogflow-api.*", env=~"$env"}', legendFormat: 'Heap used' },
    ],
    'bytes'
  ),

  // --- row 4: database ---
  series(
    'API DB pool connections',
    { x: 0, y: 21, w: 8, h: 8 },
    [{ expr: 'db_pool_connections{env=~"$env"}', legendFormat: '{{state}}' }],
    'short'
  ),
  series(
    'Postgres active connections',
    { x: 8, y: 21, w: 8, h: 8 },
    [{ expr: 'sum by (datname) (pg_stat_database_numbackends{datname!~"template.*|postgres"})', legendFormat: '{{datname}}' }],
    'short'
  ),
  series(
    'Event loop lag (p99)',
    { x: 16, y: 21, w: 8, h: 8 },
    [{ expr: 'nodejs_eventloop_lag_p99_seconds{job=~"blogflow-api.*", env=~"$env"}', legendFormat: '{{env}}' }],
    's'
  ),

  // --- row 5: logs ---
  {
    id: ++id,
    type: 'logs',
    title: 'API logs (warn / error)',
    gridPos: { x: 0, y: 29, w: 12, h: 10 },
    datasource: loki,
    targets: [{ refId: 'A', datasource: loki, expr: '{service="backend", level=~"warn|error"}' }],
    options: { showTime: true, wrapLogMessage: true, prettifyLogMessage: false, sortOrder: 'Descending', enableLogDetails: true },
  },
  {
    id: ++id,
    type: 'logs',
    title: 'All container logs',
    gridPos: { x: 12, y: 29, w: 12, h: 10 },
    datasource: loki,
    targets: [{ refId: 'A', datasource: loki, expr: '{service=~"backend|frontend|db"}' }],
    options: { showTime: true, wrapLogMessage: true, sortOrder: 'Descending', enableLogDetails: true },
  },
];

const dashboard = {
  uid: 'blogflow-overview',
  title: 'BlogFlow — Service Overview',
  tags: ['blogflow', 'month5'],
  timezone: 'browser',
  schemaVersion: 41,
  version: 1,
  refresh: '10s',
  time: { from: 'now-30m', to: 'now' },
  templating: {
    list: [
      {
        name: 'env',
        label: 'Environment',
        type: 'query',
        datasource: prom,
        query: { query: 'label_values(http_requests_total, env)', refId: 'env' },
        includeAll: true,
        multi: true,
        current: { text: 'All', value: '$__all' },
        allValue: '.*',
        refresh: 2,
      },
    ],
  },
  annotations: { list: [] },
  panels,
};

writeFileSync(new URL('./dashboards/blogflow.json', import.meta.url), JSON.stringify(dashboard, null, 2) + '\n');
console.log(`wrote ${panels.length} panels`);
