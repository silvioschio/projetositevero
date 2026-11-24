import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { imovel } from './schemas/imovel';
import { post } from './schemas/post';
import { corretor } from './schemas/corretor';

export default defineConfig({
  name: 'vero',
  title: 'VERO · Painel do site',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '2ueazs6o',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list().title('Conteúdo').items([
          S.documentTypeListItem('imovel').title('Imóveis'),
          S.documentTypeListItem('post').title('Blog'),
          S.documentTypeListItem('corretor').title('Equipe'),
        ]),
    }),
  ],
  schema: { types: [imovel, post, corretor] },
});
