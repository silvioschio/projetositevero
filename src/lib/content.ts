// Camada de conteúdo: busca imóveis e posts no painel Sanity.
// Enquanto o Sanity não estiver configurado (sem SANITY_PROJECT_ID), usa os dados de exemplo de src/data/.
import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { toHTML } from '@portabletext/to-html';
import type { Imovel, Post, Cidade, Corretor } from './types';
import { imoveis as imoveisLocais } from '../data/imoveis';
import { posts as postsLocais } from '../data/posts';
import { equipe as equipeLocal } from '../data/equipe';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET || 'production';

const sanity = projectId
  ? createClient({ projectId, dataset, apiVersion: '2025-01-01', useCdn: true })
  : null;
const imgBuilder = sanity ? createImageUrlBuilder(sanity) : null;

const img = (source: any, width = 1600) =>
  imgBuilder && source?.asset ? imgBuilder.image(source).width(width).auto('format').quality(80).url() : '';

// ---------- Imóveis ----------
function mapImovel(d: any): Imovel {
  return {
    ...d,
    slug: d.slug?.current ?? d.slug,
    descricao: (d.descricao ?? '').split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean),
    fotos: (d.fotos ?? []).map((f: any) => ({ src: img(f), alt: f.alt || d.nome })),
  };
}

let cacheImoveis: Imovel[] | null = null;
export async function getImoveis(): Promise<Imovel[]> {
  if (cacheImoveis) return cacheImoveis;
  if (!sanity) return (cacheImoveis = imoveisLocais);
  const docs = await sanity.fetch(`*[_type == "imovel" && !(_id in path("drafts.**"))] | order(coalesce(ordem, 0) asc, _createdAt desc)`);
  return (cacheImoveis = docs.map(mapImovel));
}

export async function getImovel(slug: string) {
  return (await getImoveis()).find((i) => i.slug === slug);
}

// ---------- Posts ----------
function mapPost(d: any): Post {
  return {
    ...d,
    slug: d.slug?.current ?? d.slug,
    imagem: { src: img(d.imagem, 1400), alt: d.imagem?.alt || d.titulo },
    conteudo: toHTML(d.conteudo ?? [], {
      components: { types: { image: ({ value }: any) => `<img src="${img(value, 1200)}" alt="${value.alt ?? ''}" loading="lazy">` } },
    }),
  };
}

let cachePosts: Post[] | null = null;
export async function getPosts(): Promise<Post[]> {
  if (cachePosts) return cachePosts;
  if (!sanity) return (cachePosts = [...postsLocais].sort((a, b) => b.data.localeCompare(a.data)));
  const docs = await sanity.fetch(`*[_type == "post" && !(_id in path("drafts.**"))] | order(data desc)`);
  return (cachePosts = docs.map(mapPost));
}

// ---------- Equipe ----------
let cacheEquipe: Corretor[] | null = null;
export async function getEquipe(): Promise<Corretor[]> {
  if (cacheEquipe) return cacheEquipe;
  if (!sanity) return (cacheEquipe = equipeLocal);
  const docs = await sanity.fetch(`*[_type == "corretor" && !(_id in path("drafts.**"))] | order(ordem asc, nome asc)`);
  return (cacheEquipe = docs.map((d: any) => ({
    ...d,
    slug: d.slug?.current ?? d.slug,
    whatsapp: String(d.whatsapp ?? '').replace(/\D/g, ''),
    foto: d.foto?.asset ? { src: img(d.foto, 800), alt: d.nome } : undefined,
  })));
}

// ---------- Utilidades ----------
// Lista central de cidades: usada nos filtros, na busca, nos formulários e nas páginas por cidade.
// "principal: true" = a página da cidade existe sempre; as demais só aparecem quando há imóvel cadastrado.
export const cidades: { nome: Cidade; slug: string; descricao: string; principal?: boolean }[] = [
  {
    nome: 'Porto Belo', slug: 'porto-belo', principal: true,
    descricao:
      'Porto Belo vive uma fase de forte expansão, com destaque para o Balneário Perequê: praia de águas calmas, boa infraestrutura e novos empreendimentos de alto padrão, muitas vezes com preço de entrada mais acessível que os vizinhos.',
  },
  {
    nome: 'Itapema', slug: 'itapema', principal: true,
    descricao:
      'Itapema é um dos mercados imobiliários mais valorizados do Brasil, com a orla da Meia Praia verticalizada, ampla oferta de serviços e alta procura para morar e para aluguel por temporada.',
  },
  {
    nome: 'Bombinhas', slug: 'bombinhas',
    descricao: 'Bombinhas reúne algumas das praias mais bonitas de Santa Catarina, com águas cristalinas e forte vocação para o turismo e o aluguel por temporada.',
  },
  {
    nome: 'Tijucas', slug: 'tijucas',
    descricao: 'Vizinha de Porto Belo e Itapema, Tijucas oferece acesso rápido pela BR-101 e opções de imóveis com bom custo-benefício no litoral norte catarinense.',
  },
  {
    nome: 'Florianópolis', slug: 'florianopolis',
    descricao: 'A capital catarinense combina praias, qualidade de vida e um mercado imobiliário consolidado, com demanda constante para moradia e locação.',
  },
  {
    nome: 'Balneário Piçarras', slug: 'balneario-picarras',
    descricao: 'Balneário Piçarras tem orla extensa e tranquila, com mercado imobiliário em crescimento e boas oportunidades para casa de praia e investimento.',
  },
  {
    nome: 'Penha', slug: 'penha',
    descricao: 'Penha é conhecida por suas praias e pelo Beto Carrero World, o que movimenta o turismo e a procura por imóveis para temporada.',
  },
  {
    nome: 'Barra Velha', slug: 'barra-velha',
    descricao: 'Barra Velha, no litoral norte de Santa Catarina, oferece praias amplas e imóveis com preço de entrada atrativo para quem busca o litoral.',
  },
];

export const slugCidade = (c: string) =>
  c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '-');

const br = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
export function faixa(min?: number, max?: number, sufixo = '') {
  if (!min && !max) return '';
  if (min && max && min !== max) return `${br(min)} a ${br(max)}${sufixo}`;
  return `${br((min ?? max)!)}${sufixo}`;
}

export const dataBR = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export const WHATSAPP = '5547999922868';
export const waLink = (msg: string, numero = WHATSAPP) => `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;

// Converte "R$ 1.129.762,73" em número e calcula a economia em relação ao preço de tabela
const valorBR = (t?: string) => {
  if (!t) return NaN;
  const n = t.replace(/[^\d,]/g, '').replace(',', '.');
  return n ? Number(n) : NaN;
};
export function economia(preco?: string, tabela?: string) {
  const p = valorBR(preco), t = valorBR(tabela);
  if (!(p > 0 && t > p)) return null;
  const v = t - p;
  return {
    valor: v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    pct: ((v / t) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%',
  };
}

// Link do botão de cada cidade: página própria se existir; senão, a listagem filtrada pela cidade.
export const linkCidade = (c: { nome: string; slug: string }, comPagina: { slug: string }[]) =>
  comPagina.some((x) => x.slug === c.slug) ? `/imoveis/${c.slug}/` : `/imoveis/?cidade=${encodeURIComponent(c.nome)}`;
