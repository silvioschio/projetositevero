// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.verosolucoesimobiliarias.com.br',
  trailingSlash: 'always',
  output: 'static',            // páginas geradas estáticas (rápidas e ótimas para SEO)
  adapter: vercel(),           // necessário só para a rota /api/lead (envio ao Kommo)
  integrations: [sitemap({ filter: (page) => !page.includes('/obrigado') })],
});
