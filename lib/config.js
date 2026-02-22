import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export function loadConfig() {
  const configPath = join(homedir(), '.openclaw', 'openclaw.json');
  try {
    const raw = readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    const port = config?.gateway?.port || 18789;
    const token = config?.gateway?.auth?.token || '';
    return {
      gatewayUrl: `http://localhost:${port}`,
      token,
      raw: config
    };
  } catch (e) {
    throw new Error(`Could not read OpenClaw config at ${configPath}: ${e.message}`);
  }
}

export async function apiCall(endpoint, method = 'GET', body = null) {
  const config = loadConfig();
  const url = `${config.gatewayUrl}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${config.token}`,
    'Content-Type': 'application/json'
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  return res.json();
}
