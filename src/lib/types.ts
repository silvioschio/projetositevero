export type Cidade =
  | 'Porto Belo' | 'Itapema' | 'Bombinhas' | 'Tijucas' | 'Florianópolis'
  | 'Balneário Piçarras' | 'Penha' | 'Barra Velha';

export interface Foto {
  src: string;
  alt: string;
}

export interface Planta {
  nome: string;
  area: string;   // ex.: "80,38 m²"
  suites: string; // ex.: "2 suítes"
}

export interface Imovel {
  slug: string;
  nome: string;
  status: 'Pré-lançamento' | 'Lançamento' | 'Em obras' | 'Pronto para morar';
  finalidade: 'venda' | 'locacao';
  tipo: 'Apartamento' | 'Cobertura' | 'Studio' | 'Casa' | 'Sala comercial';
  cidade: Cidade;
  bairro?: string;
  endereco?: string;
  areaMin?: number;
  areaMax?: number;
  suitesMin?: number;
  suitesMax?: number;
  distanciaPraia?: string;
  entrega?: string;
  areaLazer?: string;
  preco?: string;        // texto livre: "Sob consulta", "A partir de R$ 890 mil"
  valorReferencia?: number; // valor "a partir de" em número, só para a calculadora (não aparece na página)
  resumo: string;        // 1–2 frases (cards e meta description)
  descricao: string[];   // parágrafos
  plantas?: Planta[];
  lazer?: string[];
  proximidades?: { local: string; distancia: string }[];
  fotos: Foto[];
  destaque?: boolean;
  tags?: string[];       // ex.: "Ideal para renda", "Alto padrão"
  construtora?: string;
  diferenciais?: string[];

  // ---- Revenda (unidade específica de terceiros) ----
  revenda?: boolean;
  empreendimentoSlug?: string; // liga a unidade à página do empreendimento
  torre?: string;
  andar?: string;
  posicao?: string;            // ex.: "Frente mar", "Vista lateral"
  vagas?: number;
  mobiliado?: string;          // "Sim", "Não", "Semimobiliado"
  condominio?: string;         // texto: "R$ 1.200/mês" (imóvel pronto)
  iptu?: string;
  precoTabela?: string;        // preço de tabela da construtora, para comparação
  condicoes?: string[];        // ex.: "Entrada de R$ X + saldo com a construtora"
  aceitaFinanciamento?: boolean;
  aceitaPermuta?: boolean;
}

export interface Post {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: 'Mercado' | 'Renda' | 'Educação' | 'Locação';
  data: string;          // ISO: 2026-11-22
  imagem: Foto;
  autor: string;
  conteudo: string;      // HTML
}

export interface Corretor {
  slug: string;
  nome: string;
  cargo: string;          // ex.: "Corretor de imóveis" / "Sócio-fundador"
  creci?: string;         // ex.: "70.345 F" (obrigatório por norma do COFECI em anúncios)
  whatsapp: string;       // só números, com DDI e DDD: 5547999999999
  foto?: Foto;            // vertical (4:5), rosto centralizado
  descricao: string;      // 2 a 3 frases
  especialidades?: string[]; // ex.: ["Lançamentos", "Porto Belo"]
  instagram?: string;     // sem @
}
