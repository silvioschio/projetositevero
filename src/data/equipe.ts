import type { Corretor } from '../lib/types';

// Equipe VERO — a ordem aqui é a ordem em que aparecem no site.
// Fotos: coloque em public/img/equipe/ (ex.: carine-martins.jpg), formato vertical 4:5, mínimo 800×1000 px,
// e adicione no corretor: foto: { src: '/img/equipe/carine-martins.jpg', alt: 'Carine Martins, corretora da VERO' }
// CRECI: adicione no corretor, ex.: creci: '00.000 F'
export const equipe: Corretor[] = [
  {
    slug: 'carine-martins',
    nome: 'Carine Martins',
    foto: { src: '/img/equipe/carine-martins.jpg', alt: 'Carine Martins, corretora da VERO' },
    cargo: 'Corretora de imóveis',
    whatsapp: '5547991453919',
    descricao: 'Atende quem quer comprar, investir ou alugar no litoral norte de Santa Catarina, com atenção a cada detalhe da negociação e acompanhamento do primeiro contato à entrega das chaves.',
  },
  {
    slug: 'leo-rocha',
    nome: 'Leo Rocha',
    foto: { src: '/img/equipe/leo-rocha.jpg', alt: 'Leo Rocha, corretor da VERO' },
    cargo: 'Corretor de imóveis',
    whatsapp: '5547988515550',
    descricao: 'Ajuda clientes a encontrar o imóvel certo para o seu objetivo, seja morar, alugar ou investir, apresentando os números e as condições de cada oportunidade com clareza.',
  },
  {
    slug: 'mauricio-martins',
    nome: 'Mauricio Martins',
    foto: { src: '/img/equipe/mauricio-martins.jpg', alt: 'Mauricio Martins, corretor da VERO' },
    cargo: 'Corretor de imóveis',
    whatsapp: '5547991975350',
    descricao: 'Acompanha investidores e famílias na escolha de imóveis em Porto Belo, Itapema e região, aplicando o Método VERO para uma compra segura e transparente.',
  },
];
