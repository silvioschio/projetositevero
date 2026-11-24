// Recebe os formulários do site e cria contato + lead no Kommo CRM.
// Roda no servidor (Vercel), então o token do Kommo nunca fica exposto no navegador.
import type { APIRoute } from 'astro';

export const prerender = false;

const env = (k: string): string | undefined =>
  (typeof process !== 'undefined' ? process.env?.[k] : undefined) ?? (import.meta.env as any)[k];

const ORIGENS: Record<string, string> = {
  'isca-guia-litoral': 'Guia gratuito',
  'diagnostico-home': 'Diagnóstico (home)',
  'diagnostico-contato': 'Diagnóstico (contato)',
  'locacao-inquilino': 'Locação – quer alugar',
  'locacao-proprietario': 'Locação – proprietário',
  'blog-artigo': 'Blog',
  calculadora: 'Calculadora',
};

const clean = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function telefoneBR(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length < 10) return '';
  return d.startsWith('55') && d.length >= 12 ? `+${d}` : `+55${d}`;
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, erro: 'JSON inválido' }, 400);
  }

  // Anti-spam: campo invisível preenchido = robô. Responde "ok" sem criar nada.
  if (clean(body.empresa)) return json({ ok: true });

  const nome = clean(body.nome, 120);
  const telefone = telefoneBR(clean(body.whatsapp, 40));
  const email = clean(body.email, 160);
  if (!nome || !telefone || !body.consentimento) {
    return json({ ok: false, erro: 'Nome, WhatsApp e consentimento são obrigatórios' }, 422);
  }

  const origemId = clean(body.origem, 80) || 'site';
  const imovel = clean(body.imovel, 120);
  const origem = ORIGENS[origemId] ?? (origemId.startsWith('imovel-') ? 'Página de imóvel' : origemId);
  const utm = (body.utm && typeof body.utm === 'object' ? body.utm : {}) as Record<string, string>;

  // Corretor que enviou o link (confirmado no painel: o site não confia no nome vindo do navegador)
  const corretor = await buscaCorretor(clean(body.corretor, 80));

  const detalhes: [string, string][] = [
    ['Origem', origem],
    ['Corretor que indicou', corretor?.nome ?? ''],
    ['Imóvel', imovel],
    ['Planta', clean(body.planta)],
    ['Objetivo', clean(body.objetivo)],
    ['Interesse', clean(body.interesse)],
    ['Investimento', clean(body.investimento)],
    ['Cidade', clean(body.cidade)],
    ['Tipo de locação', clean(body.periodo)],
    ['Mensagem', clean(body.mensagem, 1500)],
    ['Entrada disponível', clean(body.calc_entrada, 40)],
    ['Parcela mensal', clean(body.calc_parcela, 40)],
    ['Reforço anual', clean(body.calc_reforco, 40)],
    ['Prazo', clean(body.calc_prazo, 40)],
    ['Poder de compra estimado', clean(body.calc_poder, 40)],
    ['Imóveis que cabem no bolso', clean(body.calc_imoveis, 1500)],
    ['Página', clean(body.pagina, 500)],
    ['Veio de', clean(body.referrer, 300)],
    ...Object.entries(utm).map(([k, v]) => [k, clean(v, 200)] as [string, string]),
    ['Consentimento LGPD', `Sim (${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })})`],
  ];
  const nota = detalhes.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');

  const sub = env('KOMMO_SUBDOMAIN');
  const token = env('KOMMO_TOKEN');

  // Sem Kommo configurado (ambiente de testes): apenas registra no log.
  if (!sub || !token) {
    console.log('[lead] Kommo não configurado. Lead recebido:\n' + `Nome: ${nome}\nWhatsApp: ${telefone}\nE-mail: ${email}\n${nota}`);
    return json({ ok: true, modo: 'teste' });
  }

  const base = env('KOMMO_API_URL') || `https://${sub}.kommo.com/api/v4`; // KOMMO_API_URL: só para testes
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const contato: Record<string, unknown> = {
    first_name: nome,
    custom_fields_values: [
      { field_code: 'PHONE', values: [{ value: telefone, enum_code: 'MOB' }] },
      ...(email ? [{ field_code: 'EMAIL', values: [{ value: email, enum_code: 'WORK' }] }] : []),
    ],
  };

  const lead: Record<string, unknown> = {
    name: `Site · ${imovel || origem} · ${nome}`,
    _embedded: {
      contacts: [contato],
      tags: [{ name: 'Site' }, { name: origem }, ...(imovel ? [{ name: imovel }] : []), ...(utm.utm_source ? [{ name: `utm:${utm.utm_source}` }] : []),
        ...(corretor ? [{ name: `Indicação: ${corretor.nome}` }] : [])],
    },
  };
  const pipeline = Number(env('KOMMO_PIPELINE_ID'));
  const status = Number(env('KOMMO_STATUS_ID'));
  if (pipeline) lead.pipeline_id = pipeline;
  if (status) lead.status_id = status;

  try {
    // Campos personalizados do lead (Data de Entrada, Fonte do Lead = Site). Se falhar, o lead segue sem eles.
    const campos = await camposPersonalizados(base, headers);
    if (campos.length) lead.custom_fields_values = campos;
    const responsavel = corretor ? await usuarioKommo(base, headers, corretor.kommoNome || corretor.nome) : undefined;
    if (responsavel) lead.responsible_user_id = responsavel;

    // 1º caminho: "Leads de entrada" (Incoming leads) do funil, via API de não-classificados.
    // Se o Kommo recusar, cai no 2º caminho (lead direto na 1ª etapa) para nunca perder o contato.
    let leadId: number | undefined;
    if (pipeline) {
      const agora = Math.floor(Date.now() / 1000);
      const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '0.0.0.0';
      const pagina = clean(body.pagina, 500) || 'https://www.verosolucoesimobiliarias.com.br/';
      const leadSemEtapa: Record<string, unknown> = { name: lead.name, _embedded: { tags: (lead._embedded as any).tags } };
      if (campos.length) leadSemEtapa.custom_fields_values = campos;
      if (responsavel) leadSemEtapa.responsible_user_id = responsavel;
      const entrada = {
        source_name: 'Site VERO',
        source_uid: `site-${origemId}-${agora}-${Math.random().toString(36).slice(2, 8)}`,
        pipeline_id: pipeline,
        created_at: agora,
        metadata: {
          form_id: origemId,
          form_name: `Site · ${origem}`,
          form_page: pagina,
          form_sent_at: agora,
          ip,
          referer: clean(body.referrer, 300) || pagina,
        },
        _embedded: { leads: [leadSemEtapa], contacts: [contato] },
      };
      const r = await fetch(`${base}/leads/unsorted/forms`, { method: 'POST', headers, body: JSON.stringify([entrada]) });
      if (r.ok) {
        const data = (await r.json()) as any;
        leadId = data?._embedded?.unsorted?.[0]?._embedded?.leads?.[0]?.id;
      } else {
        console.error('[lead] Kommo recusou "Leads de entrada"; criando direto na etapa', r.status, await r.text());
      }
    }

    if (!leadId) {
      const res = await fetch(`${base}/leads/complex`, { method: 'POST', headers, body: JSON.stringify([lead]) });
      if (!res.ok) {
        console.error('[lead] Kommo recusou o lead', res.status, await res.text());
        return json({ ok: false, erro: 'Falha ao registrar no CRM' }, 502);
      }
      const [criado] = (await res.json()) as { id: number; contact_id: number }[];
      leadId = criado?.id;
    }

    // Garante o corretor como responsável (o Kommo às vezes ignora o campo em "Leads de entrada")
    if (leadId && responsavel) {
      const r3 = await fetch(`${base}/leads/${leadId}`, { method: 'PATCH', headers, body: JSON.stringify({ responsible_user_id: responsavel }) });
      if (!r3.ok) console.error('[lead] Não foi possível definir o corretor responsável', r3.status, await r3.text());
    }

    // Nota com todos os detalhes do formulário
    if (leadId) {
      const r2 = await fetch(`${base}/leads/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify([{ entity_id: leadId, note_type: 'common', params: { text: nota } }]),
      });
      if (!r2.ok) console.error('[lead] Falha ao criar nota', r2.status, await r2.text());
    }
    return json({ ok: true });
  } catch (err) {
    console.error('[lead] Erro de conexão com o Kommo', err);
    return json({ ok: false, erro: 'Erro de conexão com o CRM' }, 502);
  }
};

// ---- Campos personalizados do Kommo, encontrados pelo nome (sem IDs fixos no código) ----
const normaliza = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
type Campo = { id: number; name: string; type: string; enums?: { id: number; value: string }[] | null };
let cacheCampos: { em: number; lista: Campo[] } | null = null;

async function listaCampos(base: string, headers: Record<string, string>): Promise<Campo[]> {
  if (cacheCampos && Date.now() - cacheCampos.em < 10 * 60 * 1000) return cacheCampos.lista;
  const lista: Campo[] = [];
  for (let page = 1; page <= 5; page++) {
    const r = await fetch(`${base}/leads/custom_fields?limit=250&page=${page}`, { headers });
    if (r.status === 204) break;
    if (!r.ok) throw new Error(`custom_fields ${r.status}`);
    const d = (await r.json()) as any;
    lista.push(...(d?._embedded?.custom_fields ?? []));
    if (!d?._links?.next) break;
  }
  cacheCampos = { em: Date.now(), lista };
  return lista;
}

async function camposPersonalizados(base: string, headers: Record<string, string>) {
  const valores: Record<string, unknown>[] = [];
  try {
    const lista = await listaCampos(base, headers);
    const acha = (nome: string) => lista.find((c) => normaliza(c.name) === normaliza(nome));

    const data = acha('Data de Entrada');
    if (data) valores.push({ field_id: data.id, values: [{ value: Math.floor(Date.now() / 1000) }] });
    else console.error('[lead] Campo "Data de Entrada" não encontrado no Kommo');

    const fonte = acha('Fonte do Lead');
    const opcao = fonte?.enums?.find((e) => normaliza(e.value) === 'site');
    if (fonte && opcao) valores.push({ field_id: fonte.id, values: [{ enum_id: opcao.id }] });
    else console.error('[lead] Campo "Fonte do Lead" ou opção "Site" não encontrado no Kommo');
  } catch (err) {
    console.error('[lead] Não foi possível ler os campos do Kommo', err);
  }
  return valores;
}

// ---- Corretor do link pessoal (/calculadora/<corretor>/), lido do painel Sanity ----
async function buscaCorretor(slug: string): Promise<{ nome: string; kommoNome?: string } | null> {
  const pid = env('SANITY_PROJECT_ID');
  if (!slug || !pid || !/^[a-z0-9-]+$/.test(slug)) return null;
  const ds = env('SANITY_DATASET') || 'production';
  const q = encodeURIComponent('*[_type == "corretor" && slug.current == $slug && !(_id in path("drafts.**"))][0]{nome, kommoNome}');
  try {
    const r = await fetch(`https://${pid}.apicdn.sanity.io/v2025-01-01/data/query/${ds}?query=${q}&%24slug=${encodeURIComponent(JSON.stringify(slug))}`);
    const d = (await r.json()) as any;
    return d?.result?.nome ? d.result : null;
  } catch (err) {
    console.error('[lead] Não foi possível consultar o corretor no painel', err);
    return null;
  }
}

// ---- Usuário do Kommo pelo nome (para colocar o corretor como responsável) ----
let cacheUsuarios: { em: number; lista: { id: number; name: string }[] } | null = null;
async function usuarioKommo(base: string, headers: Record<string, string>, nome: string): Promise<number | undefined> {
  try {
    if (!cacheUsuarios || Date.now() - cacheUsuarios.em > 10 * 60 * 1000) {
      const r = await fetch(`${base}/users?limit=250`, { headers });
      if (!r.ok) throw new Error(`users ${r.status}`);
      const d = (await r.json()) as any;
      cacheUsuarios = { em: Date.now(), lista: d?._embedded?.users ?? [] };
    }
    const alvo = normaliza(nome);
    const lista = cacheUsuarios.lista;
    const achado = lista.find((u) => normaliza(u.name) === alvo)
      ?? lista.find((u) => normaliza(u.name).split(' ')[0] === alvo.split(' ')[0] && lista.filter((x) => normaliza(x.name).split(' ')[0] === alvo.split(' ')[0]).length === 1);
    if (!achado) console.error(`[lead] Corretor "${nome}" não encontrado entre os usuários do Kommo`);
    return achado?.id;
  } catch (err) {
    console.error('[lead] Não foi possível ler os usuários do Kommo', err);
    return undefined;
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
