"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";

export default function LGPDPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-[100px] pb-20">
                <div className="max-w-[800px] mx-auto px-6">
                    <h1 className="text-[32px] md:text-[42px] font-black text-[#222] tracking-tight mb-8">
                        Política de Privacidade e LGPD
                    </h1>

                    <div className="prose prose-blue max-w-none text-[#555] space-y-6 text-[15px] leading-relaxed">
                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Quem Somos</h2>
                            <p><strong>finHouse</strong><br />CNPJ: 60.806.192/0001-50</p>
                            <p>A finHouse atua como:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>correspondente bancário de instituições financeiras</li>
                                <li>plataforma de apoio a corretores e parceiros imobiliários</li>
                                <li>prestadora de serviços de gestão e recuperação de recebíveis (finHouse Receivables)</li>
                            </ul>
                            <p>A empresa não é uma instituição financeira nem uma imobiliária, atuando como intermediadora e parceira em operações específicas.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Quais dados podem ser coletados</h2>
                            <p>Podemos coletar dados pessoais fornecidos diretamente pelo usuário ou necessários para execução de serviços, como:</p>
                            <p><strong>Dados de identificação</strong></p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>nome completo</li>
                                <li>telefone</li>
                                <li>e-mail</li>
                                <li>cidade ou localização</li>
                            </ul>
                            <p className="mt-4"><strong>Dados cadastrais ou financeiros</strong></p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>informações necessárias para análise de crédito</li>
                                <li>dados relacionados a transações imobiliárias</li>
                                <li>informações comerciais de parceiros</li>
                            </ul>
                            <p>Também podem ser coletadas informações técnicas de navegação, como endereço IP e dados de acesso ao site.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Finalidade do uso dos dados</h2>
                            <p>Os dados pessoais são utilizados exclusivamente para:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>atendimento e contato com clientes e interessados</li>
                                <li>intermediação de financiamento ou produtos financeiros</li>
                                <li>encaminhamento de oportunidades imobiliárias para corretores parceiros</li>
                                <li>execução de serviços de gestão e recuperação de recebíveis</li>
                                <li>comunicação institucional e comercial</li>
                                <li>cumprimento de obrigações legais e regulatórias</li>
                            </ul>
                            <p>A finHouse trata apenas os dados estritamente necessários para cada finalidade.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Base legal para tratamento de dados</h2>
                            <p>O tratamento de dados pela finHouse ocorre com base nas hipóteses previstas na LGPD, incluindo:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>execução de contrato ou procedimentos preliminares</li>
                                <li>cumprimento de obrigação legal ou regulatória</li>
                                <li>legítimo interesse da empresa</li>
                                <li>consentimento do titular quando necessário</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Compartilhamento de dados</h2>
                            <p>Quando necessário para execução dos serviços, os dados poderão ser compartilhados com:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>instituições financeiras</li>
                                <li>correspondentes bancários parceiros</li>
                                <li>corretores ou parceiros do mercado imobiliário</li>
                                <li>prestadores de serviços tecnológicos</li>
                                <li>autoridades públicas ou regulatórias, quando exigido por lei</li>
                            </ul>
                            <p>A finHouse não comercializa dados pessoais.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Segurança das informações</h2>
                            <p>Adotamos medidas técnicas e administrativas adequadas para proteger os dados pessoais contra:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>acessos não autorizados</li>
                                <li>perda ou destruição de informações</li>
                                <li>alteração indevida</li>
                                <li>divulgação não autorizada</li>
                            </ul>
                            <p>Essas medidas incluem práticas de segurança digital, controle de acesso e uso de infraestrutura tecnológica confiável.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Retenção de dados</h2>
                            <p>Os dados pessoais são mantidos apenas pelo período necessário para cumprir as finalidades para as quais foram coletados, incluindo obrigações legais, contratuais ou regulatórias.</p>
                            <p>Após esse período, os dados poderão ser eliminados ou anonimizados.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Direitos do titular dos dados</h2>
                            <p>Nos termos da LGPD, o titular pode solicitar:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>confirmação da existência de tratamento de dados</li>
                                <li>acesso aos dados armazenados</li>
                                <li>correção de dados incompletos ou desatualizados</li>
                                <li>anonimização, bloqueio ou eliminação de dados desnecessários</li>
                                <li>portabilidade dos dados, quando aplicável</li>
                                <li>informações sobre compartilhamento de dados</li>
                                <li>revogação do consentimento</li>
                            </ul>
                            <p>As solicitações serão analisadas e respondidas dentro dos prazos legais.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Canal para solicitações LGPD</h2>
                            <p>Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados pessoais, entre em contato com o responsável pelo tratamento de dados da finHouse.</p>
                            <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl mt-4">
                                <p><strong>E-mail:</strong> contatofinhouse@gmail.com.br</p>
                                <p><strong>Telefone / WhatsApp:</strong> (11) 95584-2951</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Informações legais sobre os serviços</h2>
                            <p>A finHouse atua como correspondente bancário, intermediando produtos financeiros em parceria com instituições autorizadas.</p>
                            <p>Nos serviços de correspondência bancária, a empresa não cobra qualquer taxa ou comissão diretamente de clientes, sendo remunerada pelas instituições financeiras parceiras.</p>
                            <p>Nos serviços de finHouse Receivables (gestão e recuperação de recebíveis), a remuneração pode ocorrer por comissão ou taxa sobre valores recuperados, conforme condições previamente acordadas entre as partes.</p>
                            <p>A finHouse também pode realizar indicações de oportunidades imobiliárias a corretores e parceiros, não realizando intermediação direta de compra e venda de imóveis.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Atualizações desta política</h2>
                            <p>Esta página poderá ser atualizada periodicamente para refletir melhorias nos processos ou mudanças regulatórias.</p>
                            <p className="text-sm text-gray-400 mt-2">Última atualização: mar/2026</p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
            <WhatsAppFab />
        </div>
    );
}
