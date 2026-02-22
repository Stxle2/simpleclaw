# 🦞 SimpleClaw

**Agent config, model management, and dashboard CLI for [OpenClaw](https://github.com/openclaw/openclaw)**

---

## Why

OpenClaw's native CLI is powerful but verbose. SimpleClaw wraps it into fast, readable commands for the things you actually do every day: check status, manage agents, scan models, edit config.

No SKAI relay. No hardcoded tokens. Just your `~/.openclaw/openclaw.json`.

---

## Install

```bash
git clone https://github.com/martindreams/simpleclaw
cd simpleclaw
npm install
npm link   # makes 'simpleclaw' available globally
```

Or run directly:
```bash
node simpleclaw/index.js status
```

---

## Commands

```
simpleclaw status               Gateway status + agent overview (model, context %)
simpleclaw agents               List all configured agents
simpleclaw heartbeat <id>       Trigger heartbeat on a specific agent
simpleclaw models               List all configured model providers + models
simpleclaw config               Print current openclaw.json
simpleclaw gui                  Open web dashboard at localhost:3111
```

### Examples

```bash
# Quick health check
simpleclaw status

# Fire a heartbeat on your main agent
simpleclaw heartbeat kyma

# See what models are available
simpleclaw models

# Open the GUI dashboard
simpleclaw gui
```

---

## Web Dashboard

`simpleclaw gui` serves a local dashboard at `http://localhost:3111` with:

- Agent cards (model, context usage, status)
- Model lab (test + compare configured models)
- Config editor (live JSON editor for openclaw.json)
- One-click heartbeat triggers

---

## Requirements

- Node.js 18+
- OpenClaw installed and gateway running (`openclaw gateway start`)
- `~/.openclaw/openclaw.json` present

---

## Config

SimpleClaw reads everything from your existing OpenClaw config. No separate setup needed.

If your gateway runs on a non-default port, SimpleClaw picks it up from `gateway.port` in openclaw.json.

---

## Contributing

PRs welcome. Keep it lean.

---

MIT License
