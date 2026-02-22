#!/usr/bin/env node
/**
 * SimpleClaw — OpenClaw Agent Config & Model Management CLI
 * https://github.com/martindreams/simpleclaw
 *
 * Features:
 *   - Gateway status + restart
 *   - Agent listing + heartbeat trigger
 *   - Model scanner (test all configured models)
 *   - Config editor (JSON GUI)
 *   - Web dashboard (localhost:3111)
 */

import { execSync, exec } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { createServer } from 'http';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const c       = require('chalk');
const VERSION = '1.1.0';
const CONFIG_PATH = join(homedir(), '.openclaw', 'openclaw.json');

// ── Load OpenClaw config ─────────────────────────────────────
function loadConfig() {
  if (!existsSync(CONFIG_PATH)) throw new Error(`No OpenClaw config at ${CONFIG_PATH}`);
  const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  const port  = raw?.gateway?.port  || 18789;
  const token = raw?.gateway?.auth?.token || '';
  return { port, token, raw, gatewayUrl: `http://localhost:${port}` };
}

async function apiCall(path, method = 'GET', body = null) {
  const { gatewayUrl, token } = loadConfig();
  const res = await fetch(`${gatewayUrl}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  return res.json();
}

// ── Commands ─────────────────────────────────────────────────

async function cmdStatus() {
  try {
    const data = await apiCall('/api/v1/status');
    const { version, uptime, agents } = data;
    console.log(c.bold('\n🦞 OpenClaw Gateway\n'));
    console.log(`  Version  : ${c.cyan(version || '?')}`);
    console.log(`  Uptime   : ${c.cyan(uptime  || '?')}`);
    console.log(`  Agents   : ${c.cyan((agents || []).length)}`);
    (agents || []).forEach(a => {
      const model = a.model?.primary || '?';
      const ctx   = a.contextUsed ? `${Math.round(a.contextUsed/1000)}k` : '';
      console.log(`    • ${c.yellow(a.id.padEnd(16))} ${model} ${ctx ? c.gray('('+ctx+')') : ''}`);
    });
  } catch (e) {
    console.log(c.red('Gateway offline: ' + e.message));
  }
}

async function cmdAgents() {
  try {
    const data  = await apiCall('/api/v1/agents');
    const agents = data.agents || data || [];
    console.log(c.bold(`\n👾 Agents (${agents.length})\n`));
    agents.forEach(a => {
      console.log(`  ${c.yellow(a.id.padEnd(16))} ${c.gray(a.model?.primary || '?')}`);
    });
  } catch (e) {
    console.error(c.red(e.message));
  }
}

async function cmdHeartbeat(agentId) {
  if (!agentId) { console.log('Usage: simpleclaw heartbeat <agent-id>'); return; }
  try {
    await apiCall(`/api/v1/agents/${agentId}/run`, 'POST', { message: '[system] HEARTBEAT' });
    console.log(c.green(`✓ Heartbeat triggered for ${agentId}`));
  } catch (e) {
    console.error(c.red(e.message));
  }
}

async function cmdModels() {
  try {
    const { raw } = loadConfig();
    const providers = raw?.models?.providers || {};
    const names = Object.keys(providers);
    if (!names.length) { console.log('No providers configured in openclaw.json'); return; }
    console.log(c.bold(`\n🔬 Configured Models\n`));
    for (const [prov, cfg] of Object.entries(providers)) {
      console.log(c.cyan(`  ${prov}`));
      (cfg.models || []).forEach(m => console.log(`    • ${m.id || m.name}`));
    }
  } catch (e) {
    console.error(c.red(e.message));
  }
}

function cmdConfig() {
  const cfg = readFileSync(CONFIG_PATH, 'utf8');
  console.log(cfg);
}

function cmdGui() {
  const __dir = new URL('.', import.meta.url).pathname;
  const htmlPath = join(__dir, 'dashboard.html');
  if (!existsSync(htmlPath)) { console.error('dashboard.html not found'); return; }
  const html = readFileSync(htmlPath, 'utf8');
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });
  const PORT = 3111;
  server.listen(PORT, () => {
    console.log(c.bold(`\n🌐 SimpleClaw GUI\n`));
    console.log(`  Open: ${c.cyan(`http://localhost:${PORT}`)}`);
    console.log(`  ${c.gray('Ctrl+C to stop')}\n`);
    try { execSync(`open http://localhost:${PORT}`); } catch {}
  });
}

function cmdHelp() {
  console.log(c.bold(`\n🦞 SimpleClaw v${VERSION}\n`));
  console.log(`  ${c.cyan('status')}                 Gateway status + agent overview`);
  console.log(`  ${c.cyan('agents')}                 List all agents`);
  console.log(`  ${c.cyan('heartbeat <id>')}         Trigger agent heartbeat`);
  console.log(`  ${c.cyan('models')}                 List configured model providers`);
  console.log(`  ${c.cyan('config')}                 Print openclaw.json`);
  console.log(`  ${c.cyan('gui')}                    Open web dashboard (localhost:3111)`);
  console.log('');
}

// ── Router ───────────────────────────────────────────────────
const [,, cmd, ...args] = process.argv;
switch (cmd) {
  case 'status':            await cmdStatus(); break;
  case 'agents':            await cmdAgents(); break;
  case 'heartbeat':         await cmdHeartbeat(args[0]); break;
  case 'models':            await cmdModels(); break;
  case 'config':            cmdConfig(); break;
  case 'gui':               cmdGui(); break;
  default:                  cmdHelp();
}
