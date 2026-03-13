"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";

export default function TermosCondicoes() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-[100px] pb-20">
                <div className="max-w-[800px] mx-auto px-6">
                    <h1 className="text-[32px] md:text-[42px] font-black text-[#222] tracking-tight mb-8">
                        Termos e Condições de Uso
                    </h1>

                    <div className="prose prose-blue max-w-none text-[#555] space-y-6 text-[15px] leading-relaxed">
                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">1. Aceitação dos Termos</h2>
                            <p>Ao acessar o site ou utilizar quaisquer serviços da finHouse, o usuário declara que leu, compreendeu e concorda com os presentes Termos e Condições de Uso.</p>
                            <p>Caso não concorde com qualquer parte destes termos, o usuário não deverá utilizar o site ou os serviços oferecidos pela finHouse.</p>
                            <p>O simples acesso ao site não estabelece automaticamente qualquer relação contratual, comercial ou de prestação de serviços entre o usuário e a finHouse.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">2. Natureza dos Serviços</h2>
                            <p>A finHouse atua como empresa de apoio e intermediação em soluções financeiras e imobiliárias.</p>
                            <p>Entre suas atividades estão:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>atuação como correspondente bancário de instituições financeiras parceiras</li>
                                <li>conexão entre clientes e corretores ou parceiros do mercado imobiliário</li>
                                <li>serviços de gestão e recuperação de recebíveis (finHouse Receivables)</li>
                            </ul>
                            <p>A finHouse não é banco, instituição financeira, seguradora ou imobiliária, não realizando diretamente:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>concessão de crédito</li>
                                <li>financiamento</li>
                                <li>intermediação formal de compra e venda de imóveis</li>
                            </ul>
                            <p>A decisão final sobre concessão de crédito, aprovação de financiamento ou condições comerciais é de responsabilidade exclusiva das instituições financeiras ou parceiros envolvidos.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">3. Uso Informativo do Site</h2>
                            <p>As informações disponibilizadas no site da finHouse possuem caráter informativo e institucional, podendo sofrer atualizações ou alterações sem aviso prévio.</p>
                            <p>A finHouse não garante que todas as informações estejam sempre completas ou atualizadas, embora adote esforços razoáveis para manter a precisão do conteúdo.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">4. Cadastro e Fornecimento de Informações</h2>
                            <p>Ao utilizar formulários ou fornecer informações à finHouse, o usuário declara que:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>os dados fornecidos são verdadeiros e atualizados</li>
                                <li>possui legitimidade para fornecer tais informações</li>
                                <li>não está utilizando dados de terceiros sem autorização</li>
                            </ul>
                            <p>A finHouse não se responsabiliza por danos ou prejuízos decorrentes de informações incorretas, incompletas ou fraudulentas fornecidas pelo usuário.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">5. Serviços de Recuperação de Recebíveis</h2>
                            <p>No serviço finHouse Receivables, o usuário declara possuir legitimidade sobre os créditos apresentados para análise ou cobrança.</p>
                            <p>Ao submeter faturas, duplicatas ou créditos, o usuário declara que tais créditos:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>possuem origem comercial legítima</li>
                                <li>não são fruto de fraude ou atividade ilícita</li>
                                <li>são juridicamente exigíveis</li>
                            </ul>
                            <p>A remuneração da finHouse ocorre normalmente pelo modelo Success Fee ("No Win, No Fee"), sendo devida apenas em caso de sucesso na recuperação ou negociação dos valores.</p>
                            <p>As condições comerciais, percentuais ou taxas poderão ser estabelecidas em acordo ou contrato específico entre as partes, que prevalecerá sobre estes termos em caso de conflito.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">6. Indicações Imobiliárias</h2>
                            <p>A finHouse pode realizar indicação de oportunidades imobiliárias para corretores ou parceiros do setor.</p>
                            <p>A empresa não realiza intermediação direta de compra, venda ou locação de imóveis, sendo essa atividade de responsabilidade exclusiva dos profissionais devidamente habilitados no mercado imobiliário.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">7. Uso Aceitável da Plataforma</h2>
                            <p>O usuário concorda em não utilizar o site ou serviços da finHouse para:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>atividades ilegais ou fraudulentas</li>
                                <li>envio de cobranças indevidas ou falsas</li>
                                <li>uso indevido de dados de terceiros</li>
                                <li>tentativa de acesso não autorizado a sistemas ou dados</li>
                                <li>engenharia reversa, exploração de vulnerabilidades ou automação não autorizada</li>
                            </ul>
                            <p>O descumprimento destas regras poderá resultar em bloqueio de acesso, cancelamento de serviços e medidas legais cabíveis.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">8. Limitação de Responsabilidade</h2>
                            <p>A finHouse atua como intermediadora e facilitadora de serviços, não podendo garantir:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>aprovação de crédito</li>
                                <li>concessão de financiamento</li>
                                <li>sucesso em negociações imobiliárias</li>
                                <li>recuperação integral de valores em processos de cobrança</li>
                            </ul>
                            <p>Tais resultados dependem de fatores externos, incluindo análise de risco de instituições financeiras, situação jurídica das partes envolvidas e condições de mercado.</p>
                            <p>A finHouse compromete-se a empregar esforços técnicos e comerciais razoáveis na prestação de seus serviços, sem obrigação de resultado específico.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">9. Propriedade Intelectual</h2>
                            <p>Todo o conteúdo presente no site da finHouse, incluindo:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>textos</li>
                                <li>logotipos</li>
                                <li>marcas</li>
                                <li>design</li>
                                <li>estrutura da plataforma</li>
                            </ul>
                            <p>é protegido por legislação de propriedade intelectual e não pode ser copiado, reproduzido ou utilizado sem autorização prévia da empresa.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">10. Proteção de Dados</h2>
                            <p>O tratamento de dados pessoais realizado pela finHouse segue as diretrizes da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
                            <p>Mais informações sobre o uso de dados podem ser consultadas na página Política de Privacidade e LGPD disponível neste site.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">11. Modificações dos Termos</h2>
                            <p>A finHouse poderá alterar estes Termos e Condições a qualquer momento, visando melhorias nos serviços ou adequação a mudanças legais.</p>
                            <p>A versão atualizada será publicada no site e passará a produzir efeitos a partir de sua divulgação.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">12. Legislação Aplicável</h2>
                            <p>Estes Termos e Condições são regidos pelas leis da República Federativa do Brasil.</p>
                            <p>Eventuais disputas ou controvérsias relacionadas a estes termos deverão ser resolvidas no foro da comarca do domicílio da empresa, salvo disposição legal em contrário.</p>
                        </section>

                        <section>
                            <h2 className="text-[20px] font-bold text-[#222] mb-3">Informações Legais</h2>
                            <p><strong>finHouse</strong><br />CNPJ: 60.806.192/0001-50</p>
                            <p>A finHouse atua como correspondente bancário, não sendo uma instituição financeira.</p>
                            <p>Nos serviços de correspondente bancário, a empresa não cobra qualquer taxa ou comissão diretamente de clientes, sendo remunerada pelas instituições financeiras parceiras.</p>
                            <p>Nos serviços de gestão e recuperação de recebíveis, poderá existir remuneração baseada em comissão ou taxa de sucesso, conforme condições previamente acordadas entre as partes.</p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
            <WhatsAppFab />
        </div>
    );
}
