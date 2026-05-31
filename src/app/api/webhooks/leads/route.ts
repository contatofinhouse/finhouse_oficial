import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // O Supabase Webhook envia os dados em payload.record
    const lead = payload.record;

    if (!lead || lead.status !== 'finalizado') {
      return NextResponse.json({ message: 'Lead não finalizado ou sem dados' }, { status: 200 });
    }

    const {
      // Step 1: Dados Pessoais
      nome_completo,
      cpf,
      rg,
      orgao_expedidor,
      data_nascimento,
      nacionalidade,
      naturalidade,
      estado_civil,
      profissao,
      email,
      telefone_celular,

      // Step 2: Endereço
      endereco_cep,
      endereco_logradouro,
      endereco_bairro,
      endereco_cidade,
      endereco_estado,

      // Step 3: Profissional e Renda
      situacao_profissional,
      empresa,
      endereco_comercial,
      cargo,
      telefone_comercial,
      tempo_trabalho_anos,
      tempo_trabalho_meses,
      renda_mensal_bruta,

      // Step 4: Cônjuge
      conjuge_nome_completo,
      conjuge_cpf,
      conjuge_rg,
      conjuge_orgao_expedidor,
      conjuge_data_nascimento,
      conjuge_nacionalidade,
      conjuge_naturalidade,
      conjuge_profissao,
      conjuge_situacao_profissional,
      conjuge_empresa,
      conjuge_telefone_comercial,
      conjuge_telefone_celular,
      conjuge_email,
      conjuge_renda_mensal_bruta,

      // Step 5: Imóvel
      quem_vai_morar,
      unidade_pretendida,

      // Step 6: Documentos
      documentos
    } = lead;

    // Helper de Formatação de Data
    const formatDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return 'Não informado';
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
        }
      }
      return dateStr;
    };

    // Helper de Formatação de Moeda
    const formatCurrency = (val: number | string | null | undefined) => {
      if (val === null || val === undefined || val === '') return 'Não informado';
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num)) return val.toString();
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    // Formatação dos documentos
    const docsHtml = documentos 
      ? Object.entries(documentos).map(([key, url]) => {
          const label = key.replace(/_/g, ' ').toUpperCase();
          return `<li><a href="${url}" style="color: #0070f3; text-decoration: none; font-weight: bold;">${label} → Abrir Documento</a></li>`;
        }).join('')
      : '<li>Nenhum documento anexado</li>';

    // Bloco opcional do Cônjuge
    const hasSpouse = conjuge_nome_completo || conjuge_cpf || estado_civil === 'Casado(a)' || estado_civil === 'União estável';
    const conjugeHtml = hasSpouse ? `
      <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; color: #111;">Dados do Cônjuge</h2>
      <p><strong>Nome do Cônjuge:</strong> ${conjuge_nome_completo || 'Não informado'}</p>
      <p><strong>CPF:</strong> ${conjuge_cpf || 'Não informado'}</p>
      <p><strong>RG:</strong> ${conjuge_rg || 'Não informado'}${conjuge_orgao_expedidor ? ` (${conjuge_orgao_expedidor})` : ''}</p>
      <p><strong>Data de Nascimento:</strong> ${formatDate(conjuge_data_nascimento)}</p>
      <p><strong>Nacionalidade:</strong> ${conjuge_nacionalidade || 'Não informada'}</p>
      <p><strong>Naturalidade:</strong> ${conjuge_naturalidade || 'Não informada'}</p>
      <p><strong>Profissão:</strong> ${conjuge_profissao || 'Não informada'}</p>
      <p><strong>Situação Profissional:</strong> ${conjuge_situacao_profissional || 'Não informada'}</p>
      <p><strong>Empresa:</strong> ${conjuge_empresa || 'Não informada'}</p>
      <p><strong>Celular:</strong> ${conjuge_telefone_celular || 'Não informado'}</p>
      <p><strong>Telefone Comercial:</strong> ${conjuge_telefone_comercial || 'Não informado'}</p>
      <p><strong>E-mail:</strong> ${conjuge_email || 'Não informado'}</p>
      <p><strong>Renda Mensal do Cônjuge:</strong> ${formatCurrency(conjuge_renda_mensal_bruta)}</p>
    ` : '';

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #000; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Novo Lead Finalizado</h1>
          <p style="color: #ccc; margin: 5px 0 0;">Ficha Cadastral - Finhouse</p>
        </div>
        
        <div style="padding: 20px; line-height: 1.6; color: #333;">
          <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px;">Dados Pessoais</h2>
          <p><strong>Nome Completo:</strong> ${nome_completo || 'Não informado'}</p>
          <p><strong>CPF:</strong> ${cpf || 'Não informado'}</p>
          <p><strong>RG:</strong> ${rg || 'Não informado'}${orgao_expedidor ? ` (${orgao_expedidor})` : ''}</p>
          <p><strong>Data de Nascimento:</strong> ${formatDate(data_nascimento)}</p>
          <p><strong>Nacionalidade:</strong> ${nacionalidade || 'Não informada'}</p>
          <p><strong>Naturalidade:</strong> ${naturalidade || 'Não informada'}</p>
          <p><strong>Estado Civil:</strong> ${estado_civil || 'Não informado'}</p>
          <p><strong>Profissão:</strong> ${profissao || 'Não informada'}</p>
          <p><strong>E-mail:</strong> ${email || 'Não informado'}</p>
          <p><strong>Celular:</strong> ${telefone_celular || 'Não informado'}</p>

          <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px;">Endereço Atual</h2>
          <p><strong>CEP:</strong> ${endereco_cep || 'Não informado'}</p>
          <p><strong>Logradouro:</strong> ${endereco_logradouro || 'Não informado'}</p>
          <p><strong>Bairro:</strong> ${endereco_bairro || 'Não informado'}</p>
          <p><strong>Cidade:</strong> ${endereco_cidade || 'Não informada'}</p>
          <p><strong>Estado (UF):</strong> ${endereco_estado || 'Não informado'}</p>

          <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px;">Profissional e Renda</h2>
          <p><strong>Situação Profissional:</strong> ${situacao_profissional || 'Não informada'}</p>
          <p><strong>Empresa/Empregador:</strong> ${empresa || 'Não informada'}</p>
          <p><strong>Endereço Comercial:</strong> ${endereco_comercial || 'Não informado'}</p>
          <p><strong>Cargo/Função:</strong> ${cargo || 'Não informado'}</p>
          <p><strong>Telefone Comercial:</strong> ${telefone_comercial || 'Não informado'}</p>
          <p><strong>Tempo de Trabalho:</strong> ${tempo_trabalho_anos ? `${tempo_trabalho_anos} ano(s)` : ''} ${tempo_trabalho_meses ? `${tempo_trabalho_meses} mês(es)` : ''}${!tempo_trabalho_anos && !tempo_trabalho_meses ? 'Não informado' : ''}</p>
          <p><strong>Renda Mensal Bruta:</strong> ${formatCurrency(renda_mensal_bruta)}</p>

          ${conjugeHtml}
          
          <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px;">Detalhes da Locação</h2>
          <p><strong>Unidade Pretendida:</strong> ${unidade_pretendida || 'Não informada'}</p>
          <p><strong>Quem vai morar:</strong> ${quem_vai_morar || 'Não informado'}</p>

          <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px;">Documentos (Links do Bucket)</h2>
          <ul style="list-style: none; padding: 0;">
            ${docsHtml}
          </ul>

          
          <div style="margin-top: 40px; padding: 20px; background: #f9f9f9; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">Este é um email automático gerado pelo sistema de Ficha Cadastral.</p>
          </div>
        </div>
      </div>
    `;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Finhouse Leads <onboarding@resend.dev>';
    const toEmailsEnv = process.env.RESEND_TO_EMAILS || 'contatofinhouse@gmail.com,phfmarcondes@gmail.com';
    const toEmails = toEmailsEnv.split(',').map(email => email.trim());

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmails,
      subject: `Novo Lead: ${nome_completo || cpf}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Erro Resend:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email enviado com sucesso', data });

  } catch (error: any) {
    console.error('Erro Webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
