/**
 * Coolify Configuration Generator
 * 
 * Generates configuration stubs for Coolify deployment with Hostinger VPN support.
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface CoolifyConfig {
  projectName: string;
  dockerCompose?: object;
  dockerfile?: string;
  buildPack?: string;
  environment?: Record<string, string>;
}

export class CoolifyConfigGenerator {
  private projectName: string;
  private repoPath: string;

  constructor(projectName: string, repoPath: string) {
    this.projectName = projectName;
    this.repoPath = repoPath;
  }

  /**
   * Generate COOLIFY_SUPPORT.md
   */
  static generateSupportDoc(projectName: string): string {
    return `# Coolify Deployment Support

This project includes configuration stubs for deployment on Coolify with Hostinger VPN.

## What is Coolify?

Coolify is an open-source, self-hostable alternative to Heroku/Netlify/Vercel. It allows you to deploy applications on your own VPS with:

- Automatic HTTPS via Let's Encrypt
- Git-based deployments
- Docker support
- Database management
- Zero vendor lock-in

## Prerequisites

### 1. Hostinger VPS Setup

You'll need a Hostinger VPS with:
- At least 2GB RAM
- Ubuntu 20.04 or newer
- Root access
- Public IP address

### 2. Coolify Installation

Install Coolify on your VPS:

\`\`\`bash
curl -fsSL https://get.coolify.io | bash
\`\`\`

This will:
- Install Docker
- Install Coolify
- Set up reverse proxy (Traefik)
- Configure SSL certificates

### 3. Hostinger VPN (Optional)

For secure remote access to your VPS:

1. Install WireGuard on your VPS:
   \`\`\`bash
   apt update && apt install wireguard
   \`\`\`

2. Configure VPN according to Hostinger's documentation

3. Access Coolify dashboard via VPN tunnel

## Deployment Steps

### Option 1: Git-based Deployment

1. Access Coolify dashboard (usually at \`https://your-vps-ip:8000\`)
2. Create new project: "${projectName}"
3. Connect your Git repository
4. Configure build settings:
   - Build Pack: Nixpacks (auto-detected)
   - Port: \${PORT} (from environment)
5. Add environment variables (see .agents file)
6. Deploy!

### Option 2: Docker Deployment

1. Use the provided \`docker-compose.coolify.yml\`
2. In Coolify dashboard:
   - Create new "Docker Compose" service
   - Paste contents of docker-compose file
   - Configure environment variables
   - Deploy

### Option 3: Dockerfile Deployment

1. Use the provided \`Dockerfile.coolify\`
2. In Coolify dashboard:
   - Create new "Dockerfile" service
   - Select the Dockerfile
   - Configure build args and environment
   - Deploy

## Environment Variables

All required environment variables are documented in:
- \`.agents\` file (secret specifications)
- \`master.secrets.json\` (local secret storage)

Import these into Coolify's environment variable editor.

## Resource Allocation

Coolify allows you to set resource limits per service:

\`\`\`yaml
# Recommended for ${projectName}
CPU: 0.5 cores
Memory: 512MB - 1GB
Disk: 5GB
\`\`\`

## Network Configuration

### With Hostinger VPN

1. Configure VPN server on your VPS
2. Connect clients via VPN
3. Access services via private IP
4. Firewall blocks direct public access

### Without VPN (Public Access)

1. Services accessible via public domain
2. SSL automatically configured
3. Use Coolify's built-in authentication
4. Configure IP whitelisting if needed

## Monitoring

Coolify provides:
- Real-time logs
- Resource usage graphs
- Health checks
- Uptime monitoring
- Email/webhook alerts

## Cost Comparison

| Platform | Cost | Resources |
|----------|------|-----------|
| Railway Free | $0 (limited) | 512MB RAM, $5 credit |
| Railway Pro | $5+/month | Pay per usage |
| Hostinger VPS | $4-12/month | 2-8GB RAM, full control |
| Coolify | Free (self-hosted) | Limited by VPS |

**Total with Coolify + Hostinger VPS**: ~$4-12/month for unlimited deployments

## Migration Checklist

See \`COOLIFY_MIGRATION.md\` for detailed migration steps from Railway.

## Support

- Coolify Docs: https://coolify.io/docs
- Coolify Discord: https://discord.gg/coolify
- Hostinger Support: https://www.hostinger.com/support

## Files Included

- \`docker-compose.coolify.yml\` - Docker Compose configuration
- \`Dockerfile.coolify\` - Docker build configuration
- \`.coolify/config.json\` - Coolify-specific settings
- \`COOLIFY_MIGRATION.md\` - Step-by-step migration guide
`;
  }

  /**
   * Generate COOLIFY_MIGRATION.md
   */
  static generateMigrationDoc(projectName: string): string {
    return `# Railway to Coolify Migration Guide

This guide walks you through migrating ${projectName} from Railway to Coolify.

## Pre-Migration Checklist

- [ ] Hostinger VPS provisioned and accessible
- [ ] Coolify installed on VPS
- [ ] Domain name pointed to VPS IP (optional but recommended)
- [ ] All environment variables documented in \`master.secrets.json\`
- [ ] Database backup created (if applicable)
- [ ] SSL certificates noted (if custom)

## Step 1: Prepare Your VPS

### 1.1 Access Your Hostinger VPS

\`\`\`bash
ssh root@your-vps-ip
\`\`\`

### 1.2 Update System

\`\`\`bash
apt update && apt upgrade -y
\`\`\`

### 1.3 Install Coolify

\`\`\`bash
curl -fsSL https://get.coolify.io | bash
\`\`\`

Wait for installation to complete (5-10 minutes).

### 1.4 Access Coolify Dashboard

Open in browser: \`http://your-vps-ip:8000\`

Complete initial setup:
1. Create admin account
2. Set up email (optional)
3. Configure default settings

## Step 2: Export Data from Railway

### 2.1 Export Environment Variables

\`\`\`bash
# In your local project directory
railway variables > railway-vars.txt
\`\`\`

### 2.2 Export Database (if applicable)

\`\`\`bash
# PostgreSQL example
railway run pg_dump \$DATABASE_URL > database-backup.sql

# MongoDB example  
railway run mongodump --uri=\$MONGODB_URI --archive > database-backup.archive
\`\`\`

### 2.3 Note Current Configuration

- Build command
- Start command
- Health check endpoint
- Port configuration
- Resource limits

## Step 3: Set Up Project in Coolify

### 3.1 Create New Project

1. In Coolify dashboard, click "New Project"
2. Name: "${projectName}"
3. Click "Create"

### 3.2 Create New Service

Choose deployment method:

**Option A: Git Deployment**
1. Click "Add Service" → "Git Repository"
2. Connect your GitHub/GitLab account
3. Select repository
4. Configure:
   - Branch: main
   - Build Pack: Nixpacks (auto-detected)
   - Port: 3000 (or your app's port)

**Option B: Docker Compose**
1. Click "Add Service" → "Docker Compose"
2. Upload \`docker-compose.coolify.yml\`
3. Review and adjust as needed

**Option C: Dockerfile**
1. Click "Add Service" → "Dockerfile"
2. Select \`Dockerfile.coolify\`
3. Configure build arguments

### 3.3 Configure Environment Variables

1. In service settings, go to "Environment Variables"
2. Import from \`master.secrets.json\`:
   - Copy each variable
   - Paste into Coolify
   - Mark sensitive variables as "secret"

Or bulk import:
\`\`\`bash
# Convert master.secrets.json to .env format
cat master.secrets.json | jq -r '.projects["${projectName}"].secrets | to_entries[] | "\\(.key)=\\(.value)"' > .env.coolify

# Upload in Coolify UI
\`\`\`

### 3.4 Configure Domain (Optional)

1. Go to "Domains" section
2. Add your domain: \`${projectName}.yourdomain.com\`
3. Coolify will automatically configure:
   - Reverse proxy
   - SSL certificate (Let's Encrypt)
   - HTTP to HTTPS redirect

Or use Coolify's default: \`${projectName}.your-vps-ip.sslip.io\`

## Step 4: Configure Resources

In "Resources" section:

\`\`\`yaml
# Recommended limits
Memory Limit: 1GB
CPU Limit: 1.0
Restart Policy: unless-stopped
Health Check: /health (or your endpoint)
\`\`\`

## Step 5: Deploy

1. Click "Deploy" button
2. Monitor build logs
3. Wait for deployment to complete
4. Access your app at configured domain

## Step 6: Migrate Database

### PostgreSQL

\`\`\`bash
# On VPS, restore database
psql \$DATABASE_URL < database-backup.sql
\`\`\`

### MongoDB

\`\`\`bash
# On VPS, restore database
mongorestore --uri=\$MONGODB_URI --archive < database-backup.archive
\`\`\`

## Step 7: Test Deployment

- [ ] Application loads correctly
- [ ] All routes/endpoints work
- [ ] Database connections successful
- [ ] Authentication working
- [ ] External integrations functioning
- [ ] SSL certificate valid
- [ ] Logs showing no errors

## Step 8: Update DNS (if using custom domain)

If using a custom domain:

1. Update DNS A record to point to VPS IP
2. Wait for DNS propagation (5-60 minutes)
3. Test domain access

## Step 9: Monitor Initial Period

For the first 24-48 hours:

- Monitor logs in Coolify dashboard
- Check resource usage
- Verify all functionality
- Test under load

## Step 10: Decommission Railway

Once satisfied with Coolify deployment:

1. Remove sensitive environment variables from Railway
2. Stop Railway service
3. Cancel Railway subscription (if paid)
4. Delete Railway project (optional)

## Rollback Plan

If migration fails:

1. Railway deployment is still intact
2. Update DNS back to Railway
3. Reactivate Railway service
4. Debug Coolify issues
5. Retry migration

## Post-Migration Optimization

### Enable Caching

\`\`\`nginx
# In Coolify's Traefik config
add caching headers
\`\`\`

### Set Up Monitoring

1. Enable Coolify's built-in monitoring
2. Configure alerting (email/webhook)
3. Set up external uptime monitoring (optional)

### Backup Strategy

\`\`\`bash
# Set up automated backups
crontab -e

# Daily database backup
0 2 * * * /path/to/backup-script.sh
\`\`\`

### Resource Optimization

- Monitor actual resource usage
- Adjust limits as needed
- Scale horizontally if required

## Hostinger VPN Setup (Optional)

For enhanced security:

### 1. Install WireGuard

\`\`\`bash
apt install wireguard
\`\`\`

### 2. Generate Keys

\`\`\`bash
wg genkey | tee privatekey | wg pubkey > publickey
\`\`\`

### 3. Configure Server

\`\`\`ini
# /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <server-private-key>

[Peer]
PublicKey = <client-public-key>
AllowedIPs = 10.0.0.2/32
\`\`\`

### 4. Start VPN

\`\`\`bash
wg-quick up wg0
systemctl enable wg-quick@wg0
\`\`\`

### 5. Configure Firewall

\`\`\`bash
# Allow VPN
ufw allow 51820/udp

# Restrict Coolify to VPN only
ufw deny 8000/tcp
ufw allow from 10.0.0.0/24 to any port 8000
\`\`\`

## Troubleshooting

### Build Fails

- Check build logs in Coolify
- Verify all dependencies in package.json
- Ensure build command is correct

### Application Won't Start

- Check start command
- Verify PORT environment variable
- Review application logs

### Database Connection Issues

- Verify DATABASE_URL format
- Check database is running
- Ensure network connectivity

### SSL Certificate Issues

- Ensure domain points to VPS
- Check port 80 and 443 are open
- Verify Let's Encrypt rate limits

## Support

- **Coolify Issues**: https://github.com/coollabsio/coolify/issues
- **Hostinger Support**: https://www.hostinger.com/support
- **Project Issues**: See repository README

## Cost Analysis

### Before (Railway)
- Free tier: Limited resources, $5 credit
- Pro tier: $5-20+/month

### After (Coolify + Hostinger)
- VPS: $4-12/month (fixed cost)
- Coolify: Free (self-hosted)
- Unlimited deployments on same VPS

**Savings**: 50-80% for multiple projects

## Success Criteria

Migration is complete when:

- [ ] Application fully functional on Coolify
- [ ] All tests passing
- [ ] Performance meets expectations
- [ ] Monitoring configured
- [ ] Backups automated
- [ ] Railway decommissioned
- [ ] Team trained on Coolify

Congratulations on your successful migration! 🎉
`;
  }

  /**
   * Generate docker-compose.coolify.yml
   */
  generateDockerCompose(): string {
    return `version: '3.8'

services:
  ${this.projectName}:
    build:
      context: .
      dockerfile: Dockerfile.coolify
    restart: unless-stopped
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      # Add other environment variables from .agents file
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "coolify.managed=true"
      - "coolify.project=${this.projectName}"
    networks:
      - coolify

networks:
  coolify:
    external: true
`;
  }

  /**
   * Generate Dockerfile.coolify
   */
  generateDockerfile(): string {
    return `# Coolify Deployment Dockerfile
# Generated for ${this.projectName}

FROM node:18-alpine

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Build if needed
RUN if [ -f "package.json" ] && grep -q "\\"build\\"" package.json; then npm run build; fi

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nodejs -u 1001 && \\
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["npm", "start"]
`;
  }

  /**
   * Generate .coolify/config.json
   */
  generateCoolifyConfig(): object {
    return {
      name: this.projectName,
      type: 'nodejs',
      buildPack: 'nixpacks',
      port: 3000,
      healthCheckPath: '/health',
      environmentVariables: {
        NODE_ENV: 'production',
        PORT: '3000'
      },
      domains: [],
      buildCommand: 'npm run build',
      startCommand: 'npm start',
      resources: {
        memoryLimit: '1GB',
        cpuLimit: '1.0',
        restartPolicy: 'unless-stopped'
      }
    };
  }

  /**
   * Write all Coolify configuration files
   */
  async writeConfigs(outputDir: string): Promise<void> {
    // Create .coolify directory
    const coolifyDir = path.join(outputDir, '.coolify');
    await fs.ensureDir(coolifyDir);

    // Write docker-compose.coolify.yml
    await fs.writeFile(
      path.join(outputDir, 'docker-compose.coolify.yml'),
      this.generateDockerCompose()
    );

    // Write Dockerfile.coolify
    await fs.writeFile(
      path.join(outputDir, 'Dockerfile.coolify'),
      this.generateDockerfile()
    );

    // Write .coolify/config.json
    await fs.writeJson(
      path.join(coolifyDir, 'config.json'),
      this.generateCoolifyConfig(),
      { spaces: 2 }
    );

    // Write COOLIFY_SUPPORT.md
    await fs.writeFile(
      path.join(outputDir, 'COOLIFY_SUPPORT.md'),
      CoolifyConfigGenerator.generateSupportDoc(this.projectName)
    );

    // Write COOLIFY_MIGRATION.md
    await fs.writeFile(
      path.join(outputDir, 'COOLIFY_MIGRATION.md'),
      CoolifyConfigGenerator.generateMigrationDoc(this.projectName)
    );

    // Write Hostinger VPN notes
    await this.writeHostingerVPNNotes(outputDir);
  }

  /**
   * Write Hostinger VPN setup notes
   */
  private async writeHostingerVPNNotes(outputDir: string): Promise<void> {
    const notes = `# Hostinger VPN Configuration Notes

## Overview

These notes provide guidance for deploying ${this.projectName} on a Hostinger VPS with VPN access.

## VPN Benefits

1. **Security**: Access Coolify dashboard via encrypted VPN tunnel
2. **Privacy**: Hide VPS management interface from public internet
3. **Flexibility**: Secure remote access from anywhere
4. **Cost**: Included with Hostinger VPS

## Setup Options

### Option 1: WireGuard (Recommended)

Fast, modern VPN protocol with minimal overhead.

**Pros:**
- Very fast
- Low latency
- Easy to configure
- Built into recent Linux kernels

**Cons:**
- Requires client app installation
- Manual key management

See COOLIFY_MIGRATION.md for detailed setup.

### Option 2: OpenVPN

Traditional VPN solution with broad compatibility.

**Pros:**
- Works on almost any device
- Mature and well-tested
- Lots of documentation

**Cons:**
- Slower than WireGuard
- More complex configuration

### Option 3: Tailscale (Easiest)

Managed WireGuard-based mesh VPN.

**Pros:**
- Zero configuration
- Automatic key management
- Easy device management
- Free tier available

**Cons:**
- Requires Tailscale account
- Less control than self-hosted

\`\`\`bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate
tailscale up

# Access Coolify via Tailscale IP
\`\`\`

## Network Architecture

\`\`\`
Internet
  |
  v
[Hostinger VPS]
  |-- WireGuard VPN (Port 51820)
  |-- Coolify (Port 8000, VPN-only)
  |-- Your App (Port 80/443, Public)
  |-- Traefik Reverse Proxy
\`\`\`

## Firewall Rules

\`\`\`bash
# Reset firewall
ufw --force reset

# Allow SSH (be careful!)
ufw allow 22/tcp

# Allow VPN
ufw allow 51820/udp

# Allow HTTP/HTTPS for apps
ufw allow 80/tcp
ufw allow 443/tcp

# Block Coolify dashboard from public
ufw deny 8000/tcp

# Allow Coolify only from VPN network
ufw allow from 10.0.0.0/24 to any port 8000

# Enable firewall
ufw enable
\`\`\`

## Client Configuration

### Windows
1. Install WireGuard from wireguard.com
2. Import client config
3. Connect to VPN

### macOS
1. Install WireGuard from App Store
2. Import client config
3. Connect to VPN

### Linux
\`\`\`bash
# Install WireGuard
sudo apt install wireguard

# Add client config
sudo nano /etc/wireguard/wg0-client.conf

# Connect
sudo wg-quick up wg0-client
\`\`\`

### Mobile (iOS/Android)
1. Install WireGuard app
2. Scan QR code or import config
3. Connect

## Accessing Services

Once connected to VPN:

- **Coolify Dashboard**: http://10.0.0.1:8000
- **Your App** (via VPN): http://10.0.0.1
- **Your App** (public): https://yourdomain.com

## Troubleshooting

### Can't Connect to VPN

1. Check firewall allows UDP 51820
2. Verify keys are correct
3. Check VPS is reachable: \`ping your-vps-ip\`

### VPN Connects but Can't Access Services

1. Check VPN IP assignment: \`ip addr\`
2. Verify routing: \`ip route\`
3. Test connectivity: \`ping 10.0.0.1\`

### Performance Issues

1. Check VPS load: \`top\`
2. Verify network bandwidth
3. Consider upgrading VPS plan

## Security Best Practices

1. **Change SSH Port**: Move from 22 to custom port
2. **Disable Password Auth**: Use SSH keys only
3. **Regular Updates**: Keep system patched
4. **Monitor Logs**: Check for suspicious activity
5. **Backup Config**: Save VPN configs securely
6. **Rotate Keys**: Update VPN keys periodically

## Cost Summary

- **Hostinger VPS**: $4-12/month
- **WireGuard**: Free
- **Coolify**: Free
- **Domain**: $10-15/year (optional)

**Total**: ~$5-13/month for unlimited secure deployments

## Next Steps

1. Set up VPS: See Hostinger docs
2. Install VPN: See COOLIFY_MIGRATION.md
3. Install Coolify: \`curl -fsSL https://get.coolify.io | bash\`
4. Configure firewall: See rules above
5. Connect via VPN
6. Deploy ${this.projectName}

## Support

- Hostinger VPN: https://www.hostinger.com/tutorials/vps/vpn
- WireGuard: https://www.wireguard.com/
- Coolify: https://coolify.io/docs
`;

    await fs.writeFile(
      path.join(outputDir, 'HOSTINGER_VPN_NOTES.md'),
      notes
    );
  }
}
