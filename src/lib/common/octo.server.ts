import { App } from "octokit";

import { env } from "$env/dynamic/private";

export const octo_app = new App({
  appId: env.GH_APP_ID!,
  privateKey: env.GH_PRIV_KEY!,
  webhookSecret: env.GH_WEBHOOK_SECRET!,
});

export const octo = (installationId: number) =>
  octo_app.getInstallationOctokit(installationId);
