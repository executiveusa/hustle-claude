# Basic Usage Example

This example demonstrates how to use the Railway Zero-Secrets Bootstrapper with a simple Express.js application.

## Example Project Structure

\`\`\`
my-express-app/
├── package.json
├── .env.example
├── src/
│   └── index.js
└── README.md
\`\`\`

## Step 1: Create a Simple Express App

### package.json
\`\`\`json
{
  "name": "my-express-app",
  "version": "1.0.0",
  "description": "Simple Express app for Railway deployment",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongodb": "^6.0.0",
    "stripe": "^14.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
\`\`\`

### .env.example
\`\`\`env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/myapp

# Payment Processing
STRIPE_API_KEY=sk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Authentication
JWT_SECRET=your-jwt-secret-here
\`\`\`

### src/index.js
\`\`\`javascript
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint (required for Railway)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to My Express App',
    environment: process.env.NODE_ENV
  });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
\`\`\`

## Step 2: Bootstrap with Railway Zero-Secrets

\`\`\`bash
cd my-express-app
claude-flow deploy bootstrap
\`\`\`

### Output

The bootstrapper will:

1. Analyze `package.json` and detect integrations (MongoDB, Stripe)
2. Parse `.env.example` and extract environment variables
3. Generate `.agents` file with secret specifications
4. Create Railway deployment configuration
5. Generate Coolify migration files
6. Update `~/.claude-flow/master.secrets.json`

### Generated .agents File

\`\`\`json
{
  "project": "my-express-app",
  "version": "1.0.0",
  "generated": "2024-01-01T00:00:00.000Z",
  "core": [
    {
      "name": "PORT",
      "format": "number",
      "placeholder": "3000",
      "description": "Port number for the application",
      "required": true
    },
    {
      "name": "NODE_ENV",
      "format": "string",
      "placeholder": "production",
      "description": "Node environment (development, production, test)",
      "required": true
    }
  ],
  "optional": [
    {
      "name": "MONGODB_URI",
      "format": "url",
      "placeholder": "mongodb://localhost:27017/myapp",
      "description": "MongoDB URI",
      "required": false,
      "module": "mongodb"
    },
    {
      "name": "STRIPE_API_KEY",
      "format": "string",
      "placeholder": "sk_test_xxx",
      "description": "Stripe API Key",
      "required": false,
      "module": "stripe"
    },
    {
      "name": "STRIPE_SECRET_KEY",
      "format": "string",
      "placeholder": "sk_test_xxx",
      "description": "Stripe Secret Key",
      "required": false,
      "module": "stripe"
    },
    {
      "name": "JWT_SECRET",
      "format": "string",
      "placeholder": "your-jwt-secret-here",
      "description": "JWT Secret",
      "required": false
    }
  ],
  "required_secrets": ["PORT", "NODE_ENV"],
  "schema": {
    "type": "object",
    "properties": {
      "PORT": {
        "type": "number",
        "description": "Port number for the application",
        "default": "3000"
      },
      "NODE_ENV": {
        "type": "string",
        "description": "Node environment (development, production, test)",
        "default": "production"
      },
      "MONGODB_URI": {
        "type": "string",
        "description": "MongoDB URI",
        "format": "uri",
        "default": "mongodb://localhost:27017/myapp"
      }
    },
    "required": ["PORT", "NODE_ENV"]
  },
  "modules": {
    "mongodb": [...],
    "stripe": [...]
  }
}
\`\`\`

### Generated railway.toml

\`\`\`toml
# Railway deployment configuration
# Generated with cost-protection guardrails

[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

# Cost Protection Guardrails
# Max Memory: 512MB
# Max CPU: 0.5 vCPU
# Max Disk: 1GB
# Min Instances: 0
# Max Instances: 1
\`\`\`

## Step 3: Update Secrets

\`\`\`bash
# View master secrets location
claude-flow deploy secrets path
# Output: /home/user/.claude-flow/master.secrets.json

# Edit master.secrets.json
vi ~/.claude-flow/master.secrets.json
\`\`\`

Update the secrets with real values:

\`\`\`json
{
  "version": "1.0.0",
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "projects": {
    "my-express-app": {
      "secrets": {
        "PORT": "3000",
        "NODE_ENV": "production",
        "MONGODB_URI": "mongodb+srv://user:pass@cluster.mongodb.net/myapp",
        "STRIPE_API_KEY": "sk_live_actual_key_here",
        "STRIPE_SECRET_KEY": "sk_live_actual_secret_here",
        "JWT_SECRET": "actual-random-jwt-secret"
      },
      "metadata": {
        "created": "2024-01-01T00:00:00.000Z",
        "updated": "2024-01-01T00:00:00.000Z",
        "repoPath": "/path/to/my-express-app",
        "deployments": ["railway"]
      }
    }
  }
}
\`\`\`

## Step 4: Deploy to Railway

\`\`\`bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Export secrets to .env
claude-flow deploy secrets export my-express-app > .env

# Set environment variables in Railway
cat .env | while read line; do
  if [[ $line =~ ^([A-Z_]+)=(.*)$ ]]; then
    railway variables set "${BASH_REMATCH[1]}=${BASH_REMATCH[2]}"
  fi
done

# Or set manually via Railway dashboard
# https://railway.app/dashboard

# Deploy
railway up
\`\`\`

## Step 5: Monitor Usage

\`\`\`bash
# Check deployment status
railway status

# View logs
railway logs

# Simulate usage check
claude-flow deploy monitor check --simulate \\
  --memory 50 \\
  --cpu 40 \\
  --execution 30 \\
  --credits 45
\`\`\`

### Sample Output

\`\`\`
# Railway Free Tier Usage Report
Generated: 2024-01-01T00:00:00.000Z

## Current Usage

Memory (MB): [██████████░░░░░░░░░░] 50.0% (256.00 / 512)
CPU (vCPU): [████████░░░░░░░░░░░░] 40.0% (0.20 / 0.5)
Execution (hours): [██████░░░░░░░░░░░░░░] 30.0% (150.00 / 500)
Credits (USD): [█████████░░░░░░░░░░░] 45.0% (2.25 / 5)

## Status
✅ **Normal Operation**

## Configured Thresholds
- Alert Threshold: 80%
- Shutdown Threshold: 95%
\`\`\`

## Step 6: (Optional) Migrate to Coolify

If you outgrow Railway's free tier:

\`\`\`bash
# Review migration documentation
cat COOLIFY_MIGRATION.md

# Set up Hostinger VPS
# - Provision VPS (2GB+ RAM)
# - Install Coolify: curl -fsSL https://get.coolify.io | bash

# Deploy using docker-compose
docker-compose -f docker-compose.coolify.yml up -d

# Or use Coolify dashboard
# - Upload docker-compose.coolify.yml
# - Set environment variables
# - Deploy
\`\`\`

## Troubleshooting

### Build Fails

\`\`\`bash
# Test build locally
npm install
npm start

# Check logs
railway logs --tail 100
\`\`\`

### Environment Variables Not Set

\`\`\`bash
# List variables in Railway
railway variables

# Set individual variable
railway variables set MONGODB_URI="mongodb+srv://..."
\`\`\`

### Health Check Fails

Ensure `/health` endpoint returns 200 OK:

\`\`\`bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
\`\`\`

## Next Steps

1. **Add More Features:**
   - Database integration
   - Authentication
   - API endpoints

2. **Set Up CI/CD:**
   - Connect GitHub repository
   - Enable automatic deployments
   - Configure branch deployments

3. **Monitor Performance:**
   - Set up error tracking (Sentry)
   - Add application monitoring (DataDog)
   - Configure alerts

4. **Scale Up:**
   - Upgrade to Railway Pro
   - Or migrate to Coolify for cost savings

## Complete File Tree After Bootstrap

\`\`\`
my-express-app/
├── .agents                        # Generated
├── .coolify/                      # Generated
│   └── config.json
├── .env.example                   # Original
├── .maintenance/                  # Generated
│   ├── maintenance.html
│   ├── maintenance-server.js
│   ├── package.json
│   ├── README.md
│   └── railway.toml
├── COOLIFY_MIGRATION.md          # Generated
├── COOLIFY_SUPPORT.md            # Generated
├── DEPLOYMENT.md                 # Generated
├── Dockerfile.coolify            # Generated
├── HOSTINGER_VPN_NOTES.md        # Generated
├── package.json                  # Original
├── RAILWAY_GUARDRAILS.md         # Generated
├── railway.json                  # Generated
├── railway.toml                  # Generated
├── nixpacks.toml                 # Generated
├── docker-compose.coolify.yml    # Generated
├── README.md                     # Original
└── src/                          # Original
    └── index.js

~/.claude-flow/
└── master.secrets.json           # Updated
\`\`\`

## Summary

The Railway Zero-Secrets Bootstrapper automates:
- ✅ Secret detection and specification
- ✅ Deployment configuration
- ✅ Cost-protection guardrails
- ✅ Migration path to Coolify
- ✅ Maintenance mode handling

All with a single command: `claude-flow deploy bootstrap`
