# Plano de Implementação: Paywall PIX Real & Novo Dossiê PDF Institucional (`R$ 49,90`)

> **Objetivo deste Plano**:
> 1. Substituir o desbloqueio manual (auto-declaratório) por um **Paywall PIX Dinâmico com confirmação real de pagamento** (via Webhook + Polling em tempo real + envio por e-mail).
> 2. Transformar o PDF atual (que hoje é apenas um resumo financeiro simples) em um **Laudo Institucional de Viabilidade Jurídica, Documental e Financeira de 4 a 5 páginas**, lendo e destrinchando os documentos reais do leilão (Edital, Matrícula e Laudo).

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
3. **Confirmação via Webhook (`POST /api/leiloes/checkout/webhook`)**:
   - O Gateway avisa que o PIX foi pago (`approved` / `RECEIVED`).
   - O backend valida a assinatura do webhook, marca `status = 'paid'` no Supabase, gera o token de acesso permanente e dispara um e-mail via **Resend** com o link direto do Dossiê Completo.
4. **Liberação Automática**:
   - O polling detecta `status === 'paid'`, exibe animação de confirmação, abre o Dossiê Completo na tela e habilita o download do **PDF Institucional Completo**.

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

### Módulo 3: Modelagem Financeira Profunda (3 Cenários de Lance)
Tabela comparativa de sensibilidade financeira:
1. **Cenário 1 — Arremate no Lance Mínimo**: Lucro líquido, ROI %, Margem líquida e TIR mensal.
2. **Cenário 2 — Disputa Moderada (+10% acima do mínimo)**: Simulação realista com disputa no pregão.
3. **Cenário 3 — No Lance Teto finHouse (Limite de Segurança)**: Valor máximo recomendado para parar de dar lances mantendo margem líquida mínima de 18%.

### Módulo 4: DRE Completa da Operação & Cronograma de Desembolso (12 Meses)
- **Dia D (Arrematação)**: Entrada / Valor à vista + 5% Comissão do Leiloeiro.
- **D+15 a D+30 (Transferência)**: ITBI municipal (3% SP), Escritura Pública / Carta de Arrematação e Registro Cartorário.
- **D+30 a D+120 (Posse & Reforma)**: Assessoria de Imissão na Posse (se ocupado), condomínio/IPTU durante vacância (8 meses) e orçamento estimado de reforma cosmética.
- **Mês 8 a 12 (Saída: Revenda vs. Locação)**:
  - *Estratégia Revenda (House Flipping)*: Valor de venda, corretagem (6%), Imposto sobre Ganho de Capital (15%) e **Lucro Líquido Final**.
  - *Estratégia Renda (Buy & Hold / Airbnb)*: Aluguel líquido estimado mensal e Yield % anual sobre o capital investido.

### Módulo 5: Checklist Operacional Pré-Lance
- Prazo limite para habilitação no leiloeiro e documentos necessários.
- Diligências recomendadas antes do pregão.
- Canal direto com a **Mesa de Crédito finHouse** e **Assessoria Jurídica Parceira**.

---

## Parte 3: Roteiro de Execução Técnica (Quando Formos Codar)

1. **Etapa 1 — Banco & API de Pagamento PIX**:
   - Criar tabela `dossie_orders` no Supabase.
   - Criar rotas `/api/leiloes/checkout/create`, `/api/leiloes/checkout/status` e `/api/leiloes/checkout/webhook`.
2. **Etapa 2 — Extrator de PDF & Motor de Dossiê Completo**:
   - Atualizar `src/app/api/leiloes/analyze/route.ts` para ler o conteúdo dos PDFs de Edital/Matrícula e estruturar os 8 itens jurídicos via IA.
3. **Etapa 3 — Gerador de PDF Multi-Página Profissional**:
   - Construir o novo template A4 multi-página com capa, matriz documental, tabela de 3 cenários, DRE de 12 meses e envio por e-mail via `Resend`.

