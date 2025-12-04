# Railway Zero-Secrets Bootstrapper

## Overview

The Railway Zero-Secrets Bootstrapper is an autonomous deployment system that prepares any Git repository for deployment on Railway with minimal configuration, comprehensive secret management, and automatic cost-protection guardrails.

## Features

### 🤖 Automated Secret Detection
- Analyzes `package.json` dependencies for integration requirements
- Parses `.env.example` files for environment variables
- Generates `.agents` file with structured secret specifications
- Creates machine-readable schema for secret-provisioning agents

### 🔐 Master Secrets Architecture
- Local `master.secrets.json` file stores all secrets across projects
- Never commits secrets to repositories
- Supports placeholder values for development
- Easy export to `.env` format for deployment

### 🚂 Railway Deployment
- Automatic `railway.toml` configuration generation
- Nixpacks build optimization
- Resource limit enforcement
- Health check configuration

### 🛡️ Cost-Protection Guardrails
- Enforces minimal resource usage (512MB RAM, 0.5 vCPU)
- Monitors free-tier usage (80% alert, 95% shutdown)
- Automatic maintenance mode deployment
- Prevents runaway spending

### ❄️ Coolify Migration Support
- Pre-configured Docker Compose files
- Dockerfile for containerized deployment
- Hostinger VPN integration notes
- Step-by-step migration guide

### 🔧 Automatic Maintenance Mode
- Static HTML maintenance page generation
- Lightweight Express server for hosting
- Auto-deployment when free-tier exceeded
- Migration preparation and documentation

## Quick Start

### Installation

\`\`\`bash
npm install -g claude-flow@alpha
\`\`\`

### Bootstrap a Repository

\`\`\`bash
cd /path/to/your/project
claude-flow deploy bootstrap
\`\`\`

See full documentation in the main README file.

## Documentation

- **[Full Documentation](./README.md)** - Complete guide
- **[API Reference](./api-reference.md)** - TypeScript API
- **[Examples](./examples/)** - Usage examples
- **[Troubleshooting](./troubleshooting.md)** - Common issues

## CLI Commands

### Bootstrap
\`\`\`bash
claude-flow deploy bootstrap [repo-path]
\`\`\`

### Secrets Management
\`\`\`bash
claude-flow deploy secrets list
claude-flow deploy secrets show <project>
claude-flow deploy secrets export <project>
\`\`\`

### Monitoring
\`\`\`bash
claude-flow deploy monitor check --simulate
\`\`\`

### Maintenance
\`\`\`bash
claude-flow deploy maintenance generate --project my-app
\`\`\`

## Support

- **Issues:** https://github.com/ruvnet/claude-flow/issues
- **Documentation:** https://github.com/ruvnet/claude-flow

---

**Railway Zero-Secrets Bootstrapper v1.0.0**
