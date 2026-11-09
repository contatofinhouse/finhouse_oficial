# Plano de Implementação: Paywall PIX Real & Novo Dossiê PDF Institucional (`R$ 49,90`)

> **Objetivo deste Plano**:
> 1. Substituir o desbloqueio manual (auto-declaratório) por um **Paywall PIX Dinâmico com confirmação real de pagamento** (via Webhook + Polling em tempo real + envio por e-mail).
> 2. Transformar o PDF atual (que hoje é apenas um resumo financeiro simples) em um **Laudo Institucional de Viabilidade Jurídica, Documental e Financeira de 4 a 5 páginas**, lendo e destrinchando os documentos reais do leilão (Edital, Matrícula e Laudo).
> 3. Precificar o imóvel com **Valores de Venda Reais via Raspagem na OLX Imóveis** (buscando primeiro o nome exato do condomínio e, em fallback, por bairro, tipologia Apto/Casa e padrão AAA/Médio/Econômico) e **Custo de Reforma Parametrizado para o Estado de SP** (base CUB SindusCon-SP / SINAPI-SP).

---

## Parte 1: Arquitetura do Paywall PIX Real (Verificação Automática)

Atualmente, em `src/app/leilaocom-ia/page.tsx`, o modal exibe uma chave PIX estática e o botão *"Já realizei o PIX · Liberar Dossiê"* libera o conteúdo no `localStorage` sem validar se o pagamento realmente caiu.

### 1.1. Escolha do Gateway PIX (API de Cobrança Instantânea)
Recomendamos **Mercado Pago Transparente (PIX)** ou **Asaas / Woovi (OpenPix)** pelos seguintes motivos:
- **Taxa baixa**: ~0,80% a 0,99% por PIX recebido (cerca de R$ 0,49 por dossiê de R$ 49,90).
- **QR Code Dinâmico (`brcode` + imagem Base64)**: Cada pedido gera um código PIX único com validade de 30 minutos e `external_reference` atrelado ao `lotId` + `email` + `phone`.
- **Webhook em Tempo Real (< 3 segundos)**: Assim que o cliente paga no app do banco, o gateway notifica nossa rota `/api/leiloes/checkout/webhook` e o modal na tela destrava sozinho sem o usuário precisar clicar em nada.

### 1.2. Fluxo Completo de Pagamento e Liberação
1. **Criação da Cobrança (`POST /api/leiloes/checkout/create`)**:
   - Recebe `lotId`, `nome`, `email`, `whatsapp`.
   - Gera cobrança PIX dinâmica de `R$ 49,90` no Gateway.
   - Salva na tabela `dossie_orders` do Supabase com `status = 'pending'` e retorna `orderId`, `qrCodeBase64` e `pixCopiaECola`.
2. **Acompanhamento em Tempo Real na Tela (`GET /api/leiloes/checkout/status?orderId=...`)**:
   - Enquanto o QR Code está aberto, o frontend consulta o status a cada 3 segundos.
   - Mostra um indicador visual: *"Aguardando confirmação do banco..."*.
3. **Confirmação via Webhook (`POST /api/leiloes/checkout/webhook`) & Geração 100% Pós-Pagamento (Opção B)**:
   - **Zero custo de processamento antes do pagamento**: A raspagem profunda da OLX e a leitura pesada dos PDFs (Edital, Matrícula e Laudo) **só disparam após a confirmação real do PIX (`status = 'paid'`)**.
   - Se o `lot_id` já tiver sido processado anteriormente por outro comprador (cache permanente no Supabase), o dossiê é entregue na mesma hora (`< 1s`).
   - Caso seja a primeira compra daquele lote, o backend executa o **Motor do Dossiê Sob Demanda** (~6 a 10 segundos com tela de progresso em tempo real: *"Auditando Matrícula, Edital e Comparáveis Reais na OLX..."*), salva o `dossie_payload` completo no Supabase, gera o **PDF Institucional Completo** e dispara por e-mail via **Resend**.
4. **Liberação Automática**:
   - O polling detecta `status === 'paid'`, exibe a conclusão da auditoria, destrava o Dossiê Completo na tela e baixa/abre o **PDF Institucional Completo**.

### 1.3. Estrutura da Tabela no Supabase (`dossie_orders`)
- `id` (UUID, PK)
- `lot_id` (TEXT) — ID do lote no leilão
- `lot_code` (TEXT) — Código do lote no leiloeiro (ex: Zuk / Mega Leilões)
- `lot_url` (TEXT) — URL original do lote
- `buyer_name` (TEXT)
- `buyer_email` (TEXT)
- `buyer_whatsapp` (TEXT)
- `amount_cents` (INTEGER) — `4990`
- `pix_payment_id` (TEXT, Unique) — ID da transação no gateway
- `pix_copy_paste` (TEXT)
- `status` (TEXT) — `'pending' | 'paid' | 'expired'`
- `access_token` (TEXT) — Token único para o cliente reabrir o dossiê em qualquer dispositivo
- `dossie_payload` (JSONB) — Resultado completo da auditoria documental + financeira salvo após o pagamento
- `created_at` / `paid_at` (TIMESTAMPTZ)

---

## Parte 2: Evolução do Dossiê & PDF para Nível Institucional

Vamos reformular o Dossiê (tanto na visualização pós-pagamento quanto no PDF exportado) em **5 Módulos Executivos**:

### Módulo 1: Capa Executiva & Veredito de Investimento
- Identificação completa do imóvel (Foto, Endereço, Bairro, Cidade/SP, Leiloeiro, Código do Lote, Data das Praças e Modalidade: Judicial vs. Extrajudicial / Alienação Fiduciária).
- **Score de Atratividade finHouse (0 a 100)** + **Selo de Recomendação** (*"Compra Recomendada até o Lance Teto"* ou *"Atenção: Exige Reserva Jurídica"*).
- Quadro comparativo de **1ª Praça vs. 2ª Praça vs. Avaliação Oficial vs. Valor de Mercado Real (m² da região)**.

### Módulo 2: Auditoria Documental Completa (Edital, Matrícula e Laudo)
Expandir `/api/leiloes/analyze/route.ts` para baixar e processar o texto dos PDFs anexados ao lote (`Edital`, `Matrícula`, `Laudo`) e preencher uma **Matriz de Auditoria Documental com 8 itens obrigatórios**:
1. **Natureza e Rito do Leilão**: Extrajudicial (Lei 9.514/97 - Alienação Fiduciária) vs. Judicial e impacto na velocidade da posse.
2. **Responsabilidade por Dívidas de IPTU**: Se há sub-rogação no preço (art. 130, parágrafo único do CTN) ou se o edital transfere dívidas anteriores ao arrematante.
3. **Responsabilidade por Dívidas de Condomínio**: Se o vendedor quita até a data do leilão ou se é obrigação *propter rem* do comprador (e estimativa de teto).
4. **Situação Ocupacional & Desocupação**: Ocupado vs. Desocupado, rito de imissão na posse (liminar em 60 dias vs. mandado judicial) e custo jurídico estimado.
5. **Formas de Pagamento no Edital**: À vista, parcelamento direto (ex: 25% de entrada + 30x no CPC art. 895) ou Financiamento Bancário / FGTS.
6. **Gravames e Ônus na Matrícula**: Penhoras, indisponibilidades, usufruto vitalício, hipotecas ou alienação fiduciária e baixa após arrematação.
7. **Comissão e Taxas Obrigatórias**: Comissão do leiloeiro (5%), taxas administrativas do portal e prazo de pagamento (24h/48h).
8. **Links Diretos dos Documentos Auditados**: Links clicáveis no PDF para a Matrícula, Edital e Laudo originais.

### Módulo 3: Inteligência de Mercado Real (Raspagem OLX) & Orçamento de Reforma SP
Antes de rodar a DRE e os cenários de lance, o motor coleta **dados reais de mercado** e **custos de obra atualizados para o Estado de São Paulo**:

#### 3.1. Precificação Real de Venda via Raspagem na OLX Imóveis (`Comps` de Mercado)
Em vez de usar apenas o "Valor de Avaliação do Leiloeiro" (que muitas vezes está defasado ou distorcido), o sistema executa um scraper em tempo real na **OLX Imóveis SP**:
1. **Camada 1 — Busca Exata por Condomínio / Edifício (Prioridade Máxima)**:
   - Extrai o **nome exato do Edifício ou Condomínio Fechado** a partir da Matrícula, Laudo de Avaliação, título do lote ou cruzamento reverso do endereço.
   - Faz a busca na OLX pelo termo `"Nome do Condomínio" + Cidade/Bairro` filtrando por venda de imóveis da mesma tipologia (`Apartamento` ou `Casa em Condomínio`).
   - Se encontrar ≥ 3 anúncios ativos do mesmo prédio/condomínio com metragem compatível (`±20%`), crava o **R$/m² real do próprio condomínio**.
2. **Camada 2 — Fallback Inteligente (Bairro + Tipologia + Padrão AAA / Médio / Standard)**:
   - Caso o imóvel seja uma casa de rua, não tenha nome de condomínio identificado ou tenha menos de 3 amostras no mesmo prédio, aciona o fallback estruturado na OLX:
     - **Localização**: Mesmo Bairro + Cidade (SP).
     - **Tipologia Exata**: `Apartamento`, `Cobertura`, `Casa de Rua` ou `Casa de Condomínio`.
     - **Classificação de Padrão do Imóvel**:
       - **Padrão AAA / Alto Padrão**: Imóveis em bairros nobres, metragens amplas (> 150m²), > 3 vagas ou alto valor de m² — filtra o quartil superior (`P70–P85`) dos anúncios do bairro para não subavaliar imóveis prime.
       - **Médio Padrão**: Faixa central de mercado — utiliza a mediana (`P50`) dos comparáveis de mesma metragem (`±25%`) e vagas/quartos.
       - **Padrão Econômico / Standard**: Utiliza o quartil conservador (`P25–P40`) de anúncios similares no bairro.
3. **Saneamento Estatístico & Prova Auditável no PDF**:
   - Remove outliers extremos (anúncios duplicados, terrenos ou valores fora da curva) e aplica um **Fator de Liquidez / Deságio de Negociação (5% a 8% sobre o preço anunciado)** para chegar ao **Valor de Venda Realista (VGV Líquido de Mercado)**.
   - Lista no PDF de **3 a 5 anúncios reais da OLX** usados como base (Título, Metragem, Preço Anunciado, R$/m² e Link clicável), dando transparência institucional ao investidor.

#### 3.2. Custo de Reforma Atualizado no Estado de São Paulo (Base CUB SindusCon-SP / SINAPI-SP)
Tabela parametrizada com os custos reais praticados em SP, cruzando **Tipologia (Apto vs. Casa)**, **Padrão Construtivo (AAA vs. Médio vs. Standard)** e **Grau de Intervenção**:
- **Nível 1 — Reforma Cosmética / Giro Rápido** *(Pintura geral acrílica/epóxi, revisão elétrica/hidráulica pontual, troca de luminárias/metais e limpeza pesada pós-desocupação)*:
  - *Econômico / Standard*: `R$ 450 a R$ 650 / m²`
  - *Médio Padrão*: `R$ 700 a R$ 950 / m²`
  - *Padrão AAA / Alto Padrão*: `R$ 1.100 a R$ 1.500 / m²`
- **Nível 2 — Reforma Intermediária / Modernização** *(Troca de pisos/porcelanato ou vinílico, revestimento de cozinha/banheiros, bancadas em granito/quartzo e marcenaria essencial)*:
  - *Econômico / Standard*: `R$ 1.100 a R$ 1.450 / m²`
  - *Médio Padrão*: `R$ 1.600 a R$ 2.200 / m²`
  - *Padrão AAA / Alto Padrão*: `R$ 2.600 a R$ 3.500 / m²`
- **Nível 3 — Reforma Pesada / Retrofit Completo** *(Substituição de prumadas/infra elétrica e hidráulica, ar-condicionado, esquadrias, demolição/layout e acabamentos nobres)*:
  - *Casas Antigas / Padrão Médio*: `R$ 2.500 a R$ 3.400 / m²`
  - *Apartamentos ou Casas AAA*: `R$ 3.800 a R$ 5.500+ / m²`
- **Acréscimo de Tipologia (`Casa` vs. `Apartamento`)**:
  - Para **Casas**, o algoritmo adiciona automaticamente uma provisão extra de **+15% a +20%** no orçamento de reforma para cobrir telhado, impermeabilização externa, fachada, muros/portão eletrônico e área externa/piscina (custos que em apartamentos são rateados pelo condomínio).

---

### Módulo 4: Modelagem Financeira Profunda (3 Cenários de Lance)
Tabela comparativa de sensibilidade financeira (já alimentada pelo **Valor de Venda Real OLX** e pelo **Custo de Reforma SP**):
1. **Cenário 1 — Arremate no Lance Mínimo**: Lucro líquido, ROI %, Margem líquida e TIR mensal.
2. **Cenário 2 — Disputa Moderada (+10% acima do mínimo)**: Simulação realista com disputa no pregão.
3. **Cenário 3 — No Lance Teto finHouse (Limite de Segurança)**: Valor máximo recomendado para parar de dar lances mantendo margem líquida mínima de 18%.

### Módulo 5: DRE Completa da Operação, Cronograma (12 Meses) & Checklist Pré-Lance
- **Dia D (Arrematação)**: Entrada / Valor à vista + 5% Comissão do Leiloeiro.
- **D+15 a D+30 (Transferência)**: ITBI municipal (3% SP), Escritura Pública / Carta de Arrematação e Registro Cartorário.
- **D+30 a D+120 (Posse & Reforma SP)**: Assessoria de Imissão na Posse (se ocupado), condomínio/IPTU durante vacância (8 meses) e orçamento detalhado de reforma no Estado de SP (conforme padrão AAA/Médio/Standard e tipologia Apto/Casa).
- **Mês 8 a 12 (Saída: Revenda vs. Locação)**:
  - *Estratégia Revenda (House Flipping)*: Valor de venda real (base OLX), corretagem (6%), Imposto sobre Ganho de Capital (15%) e **Lucro Líquido Final**.
  - *Estratégia Renda (Buy & Hold / Airbnb)*: Aluguel líquido estimado mensal e Yield % anual sobre o capital investido.
- **Checklist Operacional Pré-Lance**:
  - Prazo limite para habilitação no leiloeiro, diligências recomendadas e canal direto com a **Mesa de Crédito finHouse** e **Assessoria Jurídica Parceira**.

---

## Parte 3: Roteiro de Execução Técnica (Quando Formos Codar)

1. **Etapa 1 — Banco & API de Pagamento PIX**:
   - Criar tabela `dossie_orders` no Supabase.
   - Criar rotas `/api/leiloes/checkout/create`, `/api/leiloes/checkout/status` e `/api/leiloes/checkout/webhook`.
2. **Etapa 2 — Scraper OLX (Condomínio Exato + Fallback) & Matriz de Reforma SP**:
   - Criar módulo `src/lib/leiloes/market-valuation-olx.ts` para raspar anúncios reais de venda na OLX (tentando primeiro o nome exato do condomínio e, em fallback, por bairro + tipo `Apto`/`Casa` + padrão `AAA`/`Médio`/`Econômico`).
   - Criar módulo `src/lib/leiloes/reforma-sp-calculator.ts` com a tabela atualizada do Estado de SP (CUB SindusCon-SP / SINAPI-SP) ajustada por m², padrão do imóvel e fator casa vs. apartamento.
3. **Etapa 3 — Extrator de PDF & Motor de Dossiê Completo**:
   - Atualizar `src/app/api/leiloes/analyze/route.ts` para ler o conteúdo dos PDFs de Edital/Matrícula/Laudo, extrair o nome do condomínio e estruturar os 8 itens jurídicos + comparáveis da OLX + custo de reforma SP.
4. **Etapa 4 — Gerador de PDF Multi-Página Profissional**:
   - Construir o novo template A4 multi-página com capa, matriz documental, tabela de comparáveis reais da OLX, orçamento de reforma SP, 3 cenários de lance, DRE de 12 meses e envio por e-mail via `Resend`.

