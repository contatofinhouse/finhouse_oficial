# Plano Diretor de SEO Assimétrico: `finHouse Leilões com IA` (`/leilaocom-ia`)

> **Diagnóstico Atual do Repositório (`src/app/leilaocom-ia`)**:
> 1. **100% Client-Side Rendering (`"use client"`)**: Hoje, os lotes são carregados via `fetch('/api/leiloes')` no navegador após a montagem da página. Para o Googlebot, a página inicial entrega pouco conteúdo indexável dos lotes.
> 2. **Ausência de `layout.tsx` / `generateMetadata` na rota `/leilaocom-ia`**: A página herda o `<title>` genérico da home, sem meta tags específicas de leilão, sem OpenGraph dedicado e sem `canonical`.
> 3. **Sem `sitemap.ts` e `robots.ts` dinâmicos**: Os lotes ativos diários de São Paulo não possuem URLs próprias indexáveis.
> 4. **Oportunidade de Oceano Azul (SEO Assimétrico)**: Portais gigantes (*Mega Leilões, Portal Zuk, Superbid, Leilão Imóvel*) brigam pelas palavras genéricas de topo de funil (*"leilão de imóveis SP"*), mas **não podem publicar análises críticas de risco, cálculo de lucro líquido (House Flipping), custo de reforma SP nem comparativo real com a OLX**, pois eles trabalham para os bancos vendedores. A **finHouse** pode dominar todas as buscas de **investidores qualificados (fundo de funil)** e **buscas por condomínio/endereço/matrícula**.

---

## Pilar 1: Arquitetura Híbrida SSR + Client (`Server Components` + Dados no HTML Inicial)

Para que o Google indexe instantaneamente todos os imóveis e métricas financeiras sem perder a interatividade do mapa e dos filtros:

1. **Criar `src/app/leilaocom-ia/layout.tsx` com `Metadata` de Alta Conversão**:
   - **Title**: `"Leilão de Imóveis SP com IA: Análise de Matrícula, Reforma e Lucro Real | finHouse"`
   - **Description**: `"Radar diário de leilões judiciais e extrajudiciais em SP (Caixa, Itaú, Zuk, Mega Leilões). Veja o Valor Real de Venda na OLX, custo de reforma CUB/SP, dívidas de IPTU/Condomínio e ROI antes do lance."`
   - **Keywords / Tags**: Leilão de imóveis SP, análise de matrícula leilão IA, calculadora viabilidade leilão imóveis, leilão Caixa SP, leilão Itaú Unibanco imóveis, house flipping leilão SP.
2. **Injeção Server-Side do Snapshot Diário (`SSR Pre-rendering`)**:
   - Transformar `src/app/leilaocom-ia/page.tsx` em um **Server Component** enxuto que chama `loadDailySnapshot('sp')` no servidor e passa `initialLots` como prop para `<LeilaoComIAClient initialLots={lots} />`.
   - **Impacto no Googlebot**: O HTML bruto da página passa a conter imediatamente os títulos, bairros, cidades, preços de 1ª e 2ª praça, descontos e resumos da IA de todos os 100+ lotes do dia, com **LCP < 1.2s** (Core Web Vitals nota máxima).

---

## Pilar 2: Programmatic SEO (Páginas Dinâmicas de Lotes, Bairros e Comitentes)

Em vez de ter apenas **1 URL** (`/leilaocom-ia`) tentando ranquear para tudo, vamos gerar **centenas de Landing Pages indexáveis (ISR — Incremental Static Regeneration)** a partir do mesmo snapshot diário:

### 2.1. Páginas Individuais de Lotes (`/leilaocom-ia/lote/[slug]`)
- **Exemplo de URL**: `/leilaocom-ia/lote/apartamento-42m2-vila-clementino-sao-paulo-condominio-yby-x130996`
- **Por que vence a concorrência**:
  - Quando um investidor vê um lote no Mega Leilões, Zuk ou Caixa, ele joga no Google:
    - *"Lote X130996 Mega Leilões"*
    - *"Leilão Rua Doutor Bacelar 780 Condomínio YBY"*
    - *"Matrícula 256.992 14 CRI SP leilão"*
  - A página da finHouse ranqueia no Top 3 para o código do lote e endereço porque entrega **dados que o site do leiloeiro não mostra** (estimativa de reforma SP, comparativo de m² da região, checklist de risco e botão para baixar o **Dossiê PDF Completo por R$ 49,90**).
- **Regra para Lotes Encerrados (Retenção de Link Juice)**:
  - Quando o leilão termina, a URL **não dá erro 404**! Ela exibe um selo *"Leilão Encerrado — Veja 6 Oportunidades Similares em [Bairro]"*, mantendo a página posicionada no Google e convertendo o tráfego em lotes ativos.

### 2.2. Páginas Programáticas por Bairro e Cidade (`/leilaocom-ia/sp/[cidade]/[bairro]`)
- **Exemplos de URLs geradas automaticamente**:
  - `/leilaocom-ia/sp/sao-paulo/pinheiros` (*"Leilão de Imóveis em Pinheiros, SP — Com Até 50% de Desconto e Análise de ROI"*)
  - `/leilaocom-ia/sp/sao-paulo/vila-mariana`
  - `/leilaocom-ia/sp/sao-paulo/moema`
  - `/leilaocom-ia/sp/campinas` / `/leilaocom-ia/sp/santos` / `/leilaocom-ia/sp/sao-jose-dos-campos`
- Cada página de bairro exibe automaticamente:
  - Total de lotes abertos no bairro hoje;
  - Desconto médio dos leilões no bairro vs. preço médio do m² de venda na OLX;
  - Custo médio de reforma por m² no bairro (Padrão AAA vs. Médio);
  - Lista de cards filtrada + FAQ dinâmico do bairro.

### 2.3. Páginas por Banco / Comitente e Modalidade (`/leilaocom-ia/origem/[banco]`)
- `/leilaocom-ia/origem/caixa-economica-sp` (*"Leilão Caixa SP e Venda Direta: Imóveis Auditados com Financiamento e FGTS"*)
- `/leilaocom-ia/origem/itau-unibanco-sp` (*"Leilão de Imóveis Itaú em SP: Auditoria de Matrícula e Viabilidade"*)
- `/leilaocom-ia/origem/banco-do-brasil-sp`
- `/leilaocom-ia/modalidade/extrajudicial-alienacao-fiduciaria`

---

## Pilar 3: Dados Estruturados Avançados (`Schema.org` JSON-LD para Rich Snippets)

Os portais de leilão tradicionais usam HTML antigo sem marcação semântica rica. Vamos injetar **4 Schemas JSON-LD combinados** no `<head>`:

1. **`ItemList` + `RealEstateListing` + `Residence` / `Apartment` / `House`**:
   - Informa ao Google exatamente o endereço (`PostalAddress`), coordenadas (`GeoCoordinates`), área em m² (`floorSize`), preço do lance mínimo (`offers.price` em `BRL`) e data de encerramento (`availabilityStarts` / `priceValidUntil`).
2. **`Product` + `AggregateOffer` (Para o Dossiê e Lotes)**:
   - Permite exibir faixa de preços (*"Imóveis em leilão hoje de R$ 145.000 a R$ 2.400.000"*) diretamente no resultado de busca do Google (SERP).
3. **`FAQPage` Schema**:
   - Perguntas frequentes estruturadas no rodapé da página (ex: *"Como saber se o leilão tem dívida de condomínio ou IPTU?"*, *"Como funciona a desocupação de imóvel ocupado em leilão extrajudicial em SP?"*, *"Qual o custo de reforma por m² em São Paulo para House Flipping?"*).
4. **`SoftwareApplication` / `FinancialProduct` Schema**:
   - Posiciona o **Simulador de Viabilidade & Calculadora de Lance Teto com IA da finHouse** para buscas de ferramentas (*"calculadora de leilão de imóveis"*, *"simulador lucro leilão"*).

---

## Pilar 4: "SEO Magnets" (Ferramentas Gratuitas na Página que Geram Backlinks e Tráfego Direto)

Para bater domínios antigos (DR 60+), precisamos de **ferramentas interativas abertas** dentro da rota de leilões que segurem o usuário por **> 4 minutos na página (Dwell Time alto)** — o principal sinal comportamental do algoritmo do Google (Navboost):

1. **Calculadora Pública de "Lance Teto & Custo de Reforma SP"**:
   - O usuário altera o valor do lance, escolhe se é `Apartamento` ou `Casa`, seleciona o padrão (`AAA`, `Médio`, `Econômico`) e vê na hora o ITBI SP (3%), comissão de 5%, custo de reforma SINAPI-SP e ROI estimado — travando apenas a **Auditoria da Matrícula/Edital e os Comparáveis Reais da OLX no Paywall de R$ 49,90**.
2. **Bloco Editorial Fixo de Alta Densidade Semântica no Rodapé da `/leilaocom-ia`**:
   - Adicionar abaixo do grid de lotes uma seção indexável com:
     - **Tabela de Referência do m² de Reforma em SP (CUB SindusCon-SP / SINAPI)**;
     - **Guia Rápido Judicial (Art. 130 CTN / Art. 895 CPC) vs. Extrajudicial (Lei 9.514/97 e Lei 14.711/2023)**;
     - **Índice de Bairros de SP com Maior Deságio Hoje** (links internos para as páginas de bairro).

---

## Pilar 5: Cluster de Conteúdo Fundo de Funil (Páginas Guias de Alta Intenção Comercial)

Investidores com dinheiro na mão pesquisam dúvidas técnicas específicas antes de arrematar. Criar 5 guias técnicos interligados ao `/leilaocom-ia`:

1. `/leilaocom-ia/guia/como-analisar-matricula-de-imovel-em-leilao` *(Foco: penhoras, averbação de consolidação Av., usufruto, indisponibilidade — com CTA direto para auditar qualquer lote com IA por R$ 49,90)*.
2. `/leilaocom-ia/guia/custo-reforma-apartamento-casa-sao-paulo-leilao` *(Foco: tabela CUB/SP e SINAPI-SP por m² para House Flipping)*.
3. `/leilaocom-ia/guia/divida-condominio-iptu-leilao-quem-paga` *(Foco: Art. 130 CTN, obrigação propter rem e editais Caixa/Itaú/Santander)*.
4. `/leilaocom-ia/guia/como-desocupar-imovel-ocupado-leilao-prazos-custos` *(Foco: liminar em 60 dias na Lei 9.514/97 vs. imissão na posse judicial)*.
5. `/leilaocom-ia/guia/financiamento-e-home-equity-para-leilao-de-imoveis` *(Foco: alavancagem financeira e crédito estruturado finHouse — gerando leads de alto ticket para a Mesa de Crédito)*.

---

## Pilar 6: SEO Técnico (`sitemap.ts`, `robots.ts`, `IndexNow` e Performance)

1. **`src/app/sitemap.ts` Dinâmico**:
   - Lista todas as rotas institucionais da finHouse + `/leilaocom-ia` + todas as páginas de bairros de SP + todas as URLs dos lotes ativos do snapshot diário (`changeFrequency: 'daily'`, `priority: 0.9`).
2. **`src/app/robots.ts`**:
   - Libera o rastreamento completo de `/leilaocom-ia/*` e bloqueia rotas privadas (`/dashboard`, `/login`, `/api/*`), apontando para `https://www.finhouse.com.br/sitemap.xml`.
3. **Integração `IndexNow` (Bing / Yahoo / Buscadores de IA — ChatGPT Search & Perplexity)**:
   - Toda vez que o cron diário (`/api/leiloes/cron`) atualizar os lotes de SP, ele dispara um ping para o protocolo `IndexNow` e atualiza o `lastmod` do Sitemap, fazendo com que novos lotes apareçam nos buscadores e nas IAs generativas no mesmo dia.
4. **Otimização de Imagens & Proxy Seguro**:
   - Atributos `alt` semânticos automáticos em todas as fotos de lotes: `alt="Leilão Apartamento 42m² em Vila Clementino, São Paulo - Condomínio YBY - Lote X130996 com 22% de desconto"`.

---

## Roteiro de Implementação em 3 Fases

### Fase 1 — Fundação Técnica e Indexação Imediata (1 a 2 dias)
- [ ] Criar `src/app/sitemap.ts` e `src/app/robots.ts`.
- [ ] Criar `src/app/leilaocom-ia/layout.tsx` com `Metadata` completa, OpenGraph e Twitter Cards.
- [ ] Refatorar `src/app/leilaocom-ia/page.tsx` para injetar o snapshot inicial via SSR + Schema.org (`ItemList`, `RealEstateListing`, `FAQPage`).
- [ ] Adicionar a seção semântica indexável (FAQ Jurídico/Financeiro + Tabela de Reforma SP + Links de Bairros) no rodapé de `/leilaocom-ia`.

### Fase 2 — Programmatic SEO de Lotes e Bairros (2 a 4 dias)
- [ ] Criar rota dinâmica `/leilaocom-ia/lote/[slug]/page.tsx` para que cada lote tenha sua própria URL indexável no Google (buscas por código do lote, nome do condomínio e rua).
- [ ] Criar rota dinâmica `/leilaocom-ia/sp/[cidade]/[bairro]/page.tsx` para capturar buscas locais (*"leilão de imóveis em [Bairro]"*).

### Fase 3 — Guias de Autoridade E-E-A-T & IndexNow (Contínuo)
- [ ] Publicar os 5 guias técnicos conectados ao simulador de viabilidade e ao Dossiê PDF de R$ 49,90.
- [ ] Ativar ping automático no cron diário (`/api/leiloes/cron/route.ts`).

