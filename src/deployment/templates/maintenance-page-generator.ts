/**
 * Maintenance Page Generator
 * 
 * Generates static HTML maintenance pages for deployment when free tier is exceeded.
 */

import * as fs from 'fs-extra';

export interface MaintenancePageOptions {
  projectName: string;
  message?: string;
  contactEmail?: string;
  estimatedDowntime?: string;
  reason?: string;
  showMigrationInfo?: boolean;
}

export class MaintenancePageGenerator {
  /**
   * Generate maintenance page HTML
   */
  static generate(options: MaintenancePageOptions): string {
    const {
      projectName,
      message = "We're updating your application. Please check back soon.",
      contactEmail,
      estimatedDowntime,
      reason,
      showMigrationInfo = false
    } = options;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - Maintenance Mode</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            padding: 60px 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }

        .icon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        h1 {
            font-size: 32px;
            color: #667eea;
            margin-bottom: 20px;
            font-weight: 700;
        }

        .message {
            font-size: 18px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .details {
            background: #f7f9fc;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }

        .detail-item {
            margin: 10px 0;
            font-size: 14px;
        }

        .detail-label {
            font-weight: 600;
            color: #667eea;
        }

        .migration-info {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            border-radius: 5px;
        }

        .migration-info h3 {
            color: #856404;
            font-size: 16px;
            margin-bottom: 10px;
        }

        .migration-info p {
            color: #856404;
            font-size: 14px;
            line-height: 1.5;
        }

        .contact {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }

        .contact a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }

        .contact a:hover {
            text-decoration: underline;
        }

        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #999;
        }

        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #ffc107;
            border-radius: 50%;
            margin-right: 8px;
            animation: blink 1.5s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        @media (max-width: 600px) {
            .container {
                padding: 40px 20px;
            }

            h1 {
                font-size: 24px;
            }

            .message {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>
            <span class="status-indicator"></span>
            Maintenance Mode
        </h1>
        <p class="message">${message}</p>
        
        ${reason || estimatedDowntime ? `
        <div class="details">
            ${reason ? `
            <div class="detail-item">
                <span class="detail-label">Reason:</span> ${reason}
            </div>
            ` : ''}
            ${estimatedDowntime ? `
            <div class="detail-item">
                <span class="detail-label">Estimated Downtime:</span> ${estimatedDowntime}
            </div>
            ` : ''}
        </div>
        ` : ''}

        ${showMigrationInfo ? `
        <div class="migration-info">
            <h3>⚠️ Service Migration Notice</h3>
            <p>
                This service has exceeded free tier limits and is being migrated to a new hosting platform.
                We're working to restore full functionality as soon as possible.
            </p>
        </div>
        ` : ''}

        ${contactEmail ? `
        <div class="contact">
            <p>Need assistance? Contact us at:</p>
            <a href="mailto:${contactEmail}">${contactEmail}</a>
        </div>
        ` : ''}

        <div class="footer">
            <p>${projectName} • Powered by Railway Zero-Secrets Bootstrapper</p>
            <p>Generated: ${new Date().toISOString()}</p>
        </div>
    </div>

    <script>
        // Auto-refresh every 5 minutes to check if service is back
        setTimeout(() => {
            window.location.reload();
        }, 300000);
    </script>
</body>
</html>`;
  }

  /**
   * Generate and write maintenance page to file
   */
  static async write(filePath: string, options: MaintenancePageOptions): Promise<void> {
    const html = this.generate(options);
    await fs.writeFile(filePath, html, 'utf-8');
  }

  /**
   * Generate simple Express server for maintenance page
   */
  static generateMaintenanceServer(options: MaintenancePageOptions): string {
    return `// Maintenance Mode Server
// Generated automatically by Railway Zero-Secrets Bootstrapper

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const maintenanceHTML = \`${this.generate(options).replace(/`/g, '\\`')}\`;

app.get('*', (req, res) => {
  res.status(503).send(maintenanceHTML);
});

app.listen(PORT, () => {
  console.log(\`Maintenance mode server running on port \${PORT}\`);
});
`;
  }

  /**
   * Generate minimal package.json for maintenance server
   */
  static generateMaintenancePackageJson(projectName: string): object {
    return {
      name: `${projectName}-maintenance`,
      version: '1.0.0',
      description: 'Maintenance mode server',
      main: 'maintenance-server.js',
      scripts: {
        start: 'node maintenance-server.js'
      },
      dependencies: {
        express: '^4.18.2'
      },
      engines: {
        node: '>=18.0.0'
      }
    };
  }

  /**
   * Create complete maintenance mode deployment package
   */
  static async createMaintenancePackage(
    outputDir: string,
    options: MaintenancePageOptions
  ): Promise<void> {
    await fs.ensureDir(outputDir);

    // Write HTML file
    await this.write(
      `${outputDir}/maintenance.html`,
      options
    );

    // Write Express server
    await fs.writeFile(
      `${outputDir}/maintenance-server.js`,
      this.generateMaintenanceServer(options)
    );

    // Write package.json
    await fs.writeJson(
      `${outputDir}/package.json`,
      this.generateMaintenancePackageJson(options.projectName),
      { spaces: 2 }
    );

    // Write Railway config for maintenance mode
    await fs.writeFile(
      `${outputDir}/railway.toml`,
      `[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "never"
`
    );

    // Write README
    await fs.writeFile(
      `${outputDir}/README.md`,
      `# Maintenance Mode Deployment

This is an automatic maintenance mode deployment for ${options.projectName}.

## What happened?

The main service exceeded Railway's free tier limits and was automatically suspended.

## What's deployed now?

A lightweight maintenance page that:
- Informs users about the temporary downtime
- Uses minimal resources
- Auto-refreshes every 5 minutes to check if service is restored

## Next steps

1. Review usage at: https://railway.app/account/usage
2. Consider upgrading to a paid Railway plan
3. Or migrate to Coolify (see COOLIFY_MIGRATION.md in main repo)

## Reactivate main service

Once you've addressed the usage issues:

\`\`\`bash
# Redeploy main service
railway up
\`\`\`

Then remove this maintenance deployment.
`
    );
  }
}
