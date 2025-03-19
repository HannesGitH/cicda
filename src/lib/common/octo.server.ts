import { App } from "octokit";

import { env } from "$env/dynamic/private";

// Singleton instance
let _octo_app: App | null = null;

// Get or create the Octokit App instance
export function getOctoApp(): App {
  if (!_octo_app) {
    _octo_app = new App({
      appId: env.GH_APP_ID!,
      privateKey: env.GH_PRIV_KEY!,
      webhooks: {
        secret: env.GH_WEBHOOK_SECRET!
      }
    });
  }
  return _octo_app;
}

// Get Octokit instance for an installation
export const octo = (installationId: number) =>
  getOctoApp().getInstallationOctokit(installationId);
