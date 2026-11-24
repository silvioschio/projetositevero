# Site VERO Soluções Imobiliárias

www.verosolucoesimobiliarias.com.br · Astro (site) + Sanity (painel) + Vercel (hospedagem) + Kommo (leads)

## Ver o site no computador
```
cd ~/Desktop/vero/claudecode/site/vero-site
npx astro dev
```
Abra http://localhost:4321

## Páginas
| Página | Endereço |
|---|---|
| Início | `/` |
| Todos os imóveis (com filtros) | `/imoveis/` |
| Imóveis por cidade (SEO) | `/imoveis/porto-belo/`, `/imoveis/itapema/` |
| Página do imóvel | `/imovel/<nome-cidade>/` |
| Locação (inquilino e proprietário) | `/locacao/` |
| Blog e artigos | `/blog/`, `/blog/<artigo>/` |
| Sobre, Contato, Privacidade | `/sobre/`, `/contato/`, `/politica-de-privacidade/` |
| Mapa do site / robots | `/sitemap-index.xml`, `/robots.txt` |

## Leads → Kommo
Todos os formulários enviam para `/api/lead`, que cria no Kommo:
- **Contato** (nome, WhatsApp, e-mail)
- **Lead** com nome `Site · <imóvel ou origem> · <nome>`, tags (`Site`, origem, imóvel, `utm:<fonte>`) e funil/etapa configurados
- **Nota** com todos os detalhes: planta, objetivo, investimento, mensagem, página, UTM e registro do consentimento LGPD

Testado com um servidor que simula o Kommo. Falta testar com a conta real (precisa do token).

Configuração (variáveis no Vercel, ver `.env.example`): `KOMMO_SUBDOMAIN`, `KOMMO_TOKEN`, `KOMMO_PIPELINE_ID`, `KOMMO_STATUS_ID`.
Sem essas variáveis, o site funciona em "modo teste" (o lead só aparece no log).

## Painel (Sanity)
Pasta `studio/`. Cadastro de **Imóveis** (nome, estágio, preço, resumo, descrição, plantas, lazer, fotos, localização) e **Artigos do blog**.
Enquanto o Sanity não estiver conectado, o site usa os dados de exemplo de `src/data/`.

## Para publicar (próxima etapa)
1. Criar contas (gratuitas): **GitHub**, **Vercel** e **Sanity** (login com o Google da VERO)
2. Criar o projeto no Sanity → colocar o Project ID → publicar o painel em `vero-painel.sanity.studio`
3. Carregar os imóveis e artigos de exemplo no painel
4. Subir o código no GitHub e importar no Vercel; configurar as variáveis do Kommo e do Sanity
5. Criar webhook Sanity → Vercel (o site se atualiza sozinho quando você publica no painel)
6. Apontar o domínio no Registro.br para o Vercel
7. Google Search Console + Google Analytics/Meta Pixel; enviar o sitemap

## Pendências de conteúdo
- [ ] **Revenda Florence** (`/imovel/apartamento-3-suites-porto-florence-porto-belo-revenda/`): faltam valor, torre/andar/área, vagas, condições de pagamento
- [ ] Confirmar dados de Florence, Palm Beach e Villa Helena; mais fotos de cada um
- [ ] Imóveis em Itapema (a página `/imoveis/itapema/` está vazia)
- [ ] Revisar os 3 artigos do blog e a Política de Privacidade (idealmente com advogado)
- [ ] Criar o PDF do "Guia gratuito" que é prometido no formulário
- [ ] Fotos em alta resolução e logo em vetor
