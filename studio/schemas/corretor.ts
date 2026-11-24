import { defineType, defineField } from 'sanity';

export const corretor = defineType({
  name: 'corretor',
  title: 'Corretor',
  type: 'document',
  fields: [
    defineField({ name: 'nome', title: 'Nome', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Identificador', type: 'slug', options: { source: 'nome', maxLength: 60 }, validation: (r) => r.required() }),
    defineField({ name: 'cargo', title: 'Cargo', type: 'string', initialValue: 'Corretor de imóveis', validation: (r) => r.required() }),
    defineField({ name: 'creci', title: 'CRECI', type: 'string', description: 'Ex.: 70.345 F' }),
    defineField({ name: 'whatsapp', title: 'WhatsApp', type: 'string', validation: (r) => r.required(),
      description: 'Com DDI e DDD, só números. Ex.: 5547999922868' }),
    defineField({ name: 'foto', title: 'Foto', type: 'image', options: { hotspot: true },
      description: 'Vertical (4:5), mínimo 800×1000 px. Use o ponto de foco no rosto.' }),
    defineField({ name: 'descricao', title: 'Breve descrição', type: 'text', rows: 4, validation: (r) => r.required().max(320),
      description: '2 a 3 frases: experiência, regiões em que atua e como ajuda o cliente.' }),
    defineField({ name: 'especialidades', title: 'Especialidades', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' },
      description: 'Ex.: Lançamentos, Revenda, Locação, Porto Belo' }),
    defineField({ name: 'instagram', title: 'Instagram (sem @)', type: 'string' }),
    defineField({ name: 'kommoNome', title: 'Nome no Kommo (se for diferente)', type: 'string',
      description: 'Os leads que chegam pelo link deste corretor vão com o campo "Encaminhamento" do Kommo preenchido com ele. O site procura a opção pelo primeiro nome (ex.: CARINE); preencha aqui só se no Kommo estiver escrito de outro jeito.' }),
    defineField({ name: 'ordem', title: 'Ordem no site', type: 'number', initialValue: 10, description: 'Menor número aparece primeiro.' }),
  ],
  orderings: [{ title: 'Ordem no site', name: 'ordem', by: [{ field: 'ordem', direction: 'asc' }] }],
  preview: { select: { title: 'nome', subtitle: 'cargo', media: 'foto' } },
});
