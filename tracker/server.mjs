// HTTP server: serves index.html at / and the JSON API under /api.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, TrackerError, DEFAULT_DB_PATH, PREFIX } from './db.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.TRACKER_PORT || 4712);
const MAX_BODY = 16 * 1024 * 1024;
const db = openDb();

// [method, pattern, handler(match, query, body) -> result | [status, result]]
const routes = [
  ['GET', /^\/api\/health$/, () => ({ ok: true, prefix: PREFIX, db: DEFAULT_DB_PATH })],
  ['GET', /^\/api\/tickets$/, (m, q) => db.listTickets(q)],
  ['POST', /^\/api\/tickets$/, (m, q, body) => [201, db.createTicket(body)]],
  ['GET', /^\/api\/tickets\/([^/]+)$/, (m) => db.getTicket(m[1])],
  ['PATCH', /^\/api\/tickets\/([^/]+)$/, (m, q, body) => db.updateTicket(m[1], body)],
  ['DELETE', /^\/api\/tickets\/([^/]+)$/, (m) => db.deleteTicket(m[1])],
  ['POST', /^\/api\/tickets\/([^/]+)\/move$/, (m, q, body) => db.updateTicket(m[1], { status: body?.status })],
  ['POST', /^\/api\/tickets\/([^/]+)\/blocked-by$/, (m, q, body) => db.addBlocker(m[1], body?.key)],
  ['DELETE', /^\/api\/tickets\/([^/]+)\/blocked-by\/([^/]+)$/, (m) => db.removeBlocker(m[1], m[2])],
  ['GET', /^\/api\/frontier$/, (m, q) => db.frontier(q)],
  ['GET', /^\/api\/graph$/, (m, q) => db.graph(q.epic)],
  ['GET', /^\/api\/epics$/, () => db.listEpics()],
  ['POST', /^\/api\/epics$/, (m, q, body) => [201, db.createEpic(body)]],
  ['GET', /^\/api\/epics\/([^/]+)$/, (m) => db.getEpic(m[1])],
  ['PATCH', /^\/api\/epics\/([^/]+)$/, (m, q, body) => db.updateEpic(m[1], body)],
  ['DELETE', /^\/api\/epics\/([^/]+)$/, (m, q) => db.deleteEpic(m[1], q.force === 'true')],
  ['GET', /^\/api\/themes$/, () => db.themes()],
  ['GET', /^\/api\/export$/, () => db.exportAll()],
  ['POST', /^\/api\/import$/, (m, q, body) => db.importAll(body)],
];

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) reject(new TrackerError(413, 'request body too large'));
      else chunks.push(c);
    });
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text.trim()) return resolve({});
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new TrackerError(400, 'request body is not valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'content-type': type, 'content-length': Buffer.byteLength(data) });
  res.end(data);
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  if (req.method === 'GET' && (path === '/' || path === '/index.html')) {
    return send(res, 200, await readFile(join(HERE, 'index.html'), 'utf8'), 'text/html; charset=utf-8');
  }
  let pathMatched = false;
  for (const [method, pattern, handler] of routes) {
    const m = pattern.exec(path);
    if (!m) continue;
    pathMatched = true;
    if (method !== req.method) continue;
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody(req) : undefined;
    const out = handler(m.map((s) => (s == null ? s : decodeURIComponent(s))), Object.fromEntries(url.searchParams), body);
    if (req.method !== 'GET') db.synced();
    const [status, data] = Array.isArray(out) && typeof out[0] === 'number' && out.length === 2 ? out : [200, out];
    return send(res, status, data);
  }
  throw new TrackerError(pathMatched ? 405 : 404, pathMatched ? `method ${req.method} not allowed on ${path}` : `no route for ${path}`);
}

const server = createServer(async (req, res) => {
  const started = Date.now();
  try {
    await handle(req, res);
  } catch (e) {
    const status = e instanceof TrackerError ? e.status : 500;
    if (status === 500) console.error(e);
    send(res, status, { error: e.message });
  }
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} ${res.statusCode} ${Date.now() - started}ms`);
});

server.listen(PORT, () => console.log(`tracker listening on http://localhost:${PORT} (db: ${DEFAULT_DB_PATH}, prefix: ${PREFIX})`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close();
    db.close();
    process.exit(0);
  });
}
