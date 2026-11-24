import { defineCliConfig } from 'sanity/cli';
export default defineCliConfig({
  api: { projectId: process.env.SANITY_STUDIO_PROJECT_ID || '2ueazs6o', dataset: 'production' },
  studioHost: 'vero-painel',
  deployment: { appId: 'rlcdr5b42oflbtr1iq8pvpv5' },
});
