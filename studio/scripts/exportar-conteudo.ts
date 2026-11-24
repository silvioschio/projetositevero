// Gera um arquivo NDJSON com o conteúdo de exemplo do site (src/data) para importar no Sanity.
// Uso (dentro de studio/):
//   node scripts/exportar-conteudo.ts /caminho/conteudo.ndjson
//   npx sanity dataset import /caminho/conteudo.ndjson production --replace
// Os _id são fixos (imovel-<slug>, post-<slug>, corretor-<slug>): rodar de novo substitui, não duplica.
import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlToPortableText } from '@portabletext/html';
import { JSDOM } from 'jsdom';
import { imoveis } from '../../src/data/imoveis.ts';
import { posts } from '../../src/data/posts.ts';
import { equipe } from '../../src/data/equipe.ts';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const saida = process.argv[2];
if (!saida) throw new Error('Informe o arquivo de saída');

let n = 0;
const key = () => `k${(n++).toString(36).padStart(6, '0')}`;

function imagem(src: string | undefined, alt?: string) {
  if (!src) return undefined;
  if (!src.startsWith('/')) throw new Error(`Imagem fora de public/: ${src}`);
  const arquivo = resolve(raiz, 'public' + src);
  if (!existsSync(arquivo)) throw new Error(`Imagem não encontrada: ${arquivo}`);
  return { _type: 'image', _sanityAsset: `image@file://${arquivo}`, ...(alt ? { alt } : {}) };
}

const semVazios = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && !v.length)));

const docs: Record<string, unknown>[] = [];

imoveis.forEach((i, idx) => {
  const { slug, descricao, fotos, plantas, proximidades, ...resto } = i as any;
  docs.push(semVazios({
    ...resto,
    _id: `imovel-${slug}`,
    _type: 'imovel',
    slug: { _type: 'slug', current: slug },
    descricao: (descricao ?? []).join('\n\n'),
    fotos: (fotos ?? []).map((f: any) => ({ _key: key(), ...imagem(f.src, f.alt) })),
    plantas: plantas?.map((p: any) => ({ _key: key(), _type: 'planta', ...p })),
    proximidades: proximidades?.map((p: any) => ({ _key: key(), _type: 'proximidade', ...p })),
    ordem: (idx + 1) * 10,
  }));
});

for (const p of posts) {
  const conteudo = htmlToPortableText(p.conteudo, { parseHtml: (h: string) => new JSDOM(h).window.document });
  docs.push(semVazios({
    _id: `post-${p.slug}`,
    _type: 'post',
    titulo: p.titulo,
    slug: { _type: 'slug', current: p.slug },
    resumo: p.resumo,
    categoria: p.categoria,
    data: p.data,
    autor: p.autor,
    imagem: imagem(p.imagem.src, p.imagem.alt),
    conteudo,
  }));
}

equipe.forEach((c, idx) => {
  const { slug, foto, ...resto } = c as any;
  docs.push(semVazios({
    ...resto,
    _id: `corretor-${slug}`,
    _type: 'corretor',
    slug: { _type: 'slug', current: slug },
    foto: foto ? imagem(foto.src) : undefined,
    ordem: (idx + 1) * 10,
  }));
});

writeFileSync(saida, docs.map((d) => JSON.stringify(d)).join('\n') + '\n');
console.log(`${docs.length} documentos: ${imoveis.length} imóveis, ${posts.length} artigos, ${equipe.length} corretores → ${saida}`);
