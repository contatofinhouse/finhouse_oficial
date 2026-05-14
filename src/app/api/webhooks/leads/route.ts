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
      nome_completo,
      cpf,
      email,
      telefone_celular,
      renda_mensal_bruta,
      documentos,
      quem_vai_morar,
      unidade_pretendida
    } = lead;

    // Formatação dos documentos
    const docsHtml = documentos 
      ? Object.entries(documentos).map(([key, url]) => {
          const label = key.replace(/_/g, ' ').toUpperCase();
          return `<li><a href="${url}" style="color: #0070f3; text-decoration: none; font-weight: bold;">${label} → Abrir Documento</a></li>`;
        }).join('')
      : '<li>Nenhum documento anexado</li>';

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #000; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Novo Lead Finalizado</h1>
          <p style="color: #ccc; margin: 5px 0 0;">Ficha Cadastral - Finhouse</p>
        </div>
        
        <div style="padding: 20px; line-height: 1.6; color: #333;">
          <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px;">Dados Principais</h2>
          <p><strong>Nome:</strong> ${nome_completo || 'Não informado'}</p>
          <p><strong>CPF:</strong> ${cpf || 'Não informado'}</p>
          <p><strong>Email:</strong> ${email || 'Não informado'}</p>
          <p><strong>Celular:</strong> ${telefone_celular || 'Não informado'}</p>
          <p><strong>Renda Mensal:</strong> R$ ${renda_mensal_bruta || '0,00'}</p>
          
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

    const { data, error } = await resend.emails.send({
      from: 'Finhouse Leads <onboarding@resend.dev>', // No futuro o usuário pode configurar domínio próprio
      to: ['rafael@finhousebr.com.br'], // Substituir pelo email de destino desejado
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
