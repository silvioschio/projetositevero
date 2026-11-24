import { defineType, defineField, defineArrayMember } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Artigo do blog',
  type: 'document',
  fields: [
    defineField({ name: 'titulo', title: 'Título', type: 'string', validation: (r) => r.required().max(90),
      description: 'Use a palavra-chave que as pessoas buscam no Google. Ex.: "Como investir em imóveis em Porto Belo".' }),
    defineField({ name: 'slug', title: 'Endereço da página (URL)', type: 'slug', options: { source: 'titulo', maxLength: 80 }, validation: (r) => r.required() }),
    defineField({ name: 'resumo', title: 'Resumo', type: 'text', rows: 3, validation: (r) => r.required().max(200),
      description: 'Aparece no Google e nos cards. Até 160 caracteres é o ideal.' }),
    defineField({ name: 'categoria', title: 'Categoria', type: 'string', options: { list: ['Mercado', 'Renda', 'Educação', 'Locação'] }, validation: (r) => r.required() }),
    defineField({ name: 'data', title: 'Data de publicação', type: 'date', initialValue: () => new Date().toISOString().slice(0, 10), validation: (r) => r.required() }),
    defineField({ name: 'autor', title: 'Autor', type: 'string', initialValue: 'Silvio Schio' }),
    defineField({ name: 'imagem', title: 'Imagem de capa', type: 'image', options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Descrição da imagem', type: 'string' })], validation: (r) => r.required() }),
    defineField({
      name: 'conteudo', title: 'Texto do artigo', type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Parágrafo', value: 'normal' },
            { title: 'Subtítulo', value: 'h2' },
            { title: 'Subtítulo menor', value: 'h3' },
            { title: 'Citação', value: 'blockquote' },
          ],
        }),
        defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', title: 'Descrição', type: 'string' })] }),
      ],
    }),
  ],
  orderings: [{ title: 'Mais recentes', name: 'dataDesc', by: [{ field: 'data', direction: 'desc' }] }],
  preview: { select: { title: 'titulo', subtitle: 'categoria', media: 'imagem' } },
});
