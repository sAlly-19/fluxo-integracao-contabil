"use client";

import { motion } from "motion/react";
import { AppIcon, PageShell, PageHeader } from "../components/design-system";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function TermosPage() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    localStorage.setItem("fluxo-terms-accepted", "true");
    localStorage.setItem("fluxo-terms-date", new Date().toISOString());
    navigate("/login");
  };

  return (
    <PageShell className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary mb-6">
              <AppIcon className="size-8" name="shield" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Termos de Uso e Política de Privacidade</h1>
            <p className="text-muted-foreground mt-2">Leia atentamente antes de utilizar o sistema Fluxo Integração Contábil</p>
          </div>

          <Card className="border-border/80 bg-card/60 backdrop-blur-md overflow-hidden">
            <CardContent className="p-6">
              <ScrollArea className="h-[60vh] max-h-[60vh] pr-4 space-y-8">
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <AppIcon className="size-5 text-primary" name="file" />
                    1. Termos de Uso
                  </h2>
                  <div className="prose prose-sm text-muted-foreground space-y-4">
                    <p><strong>1.1 Aceitação dos Termos</strong></p>
                    <p>Ao acessar e utilizar o Fluxo Integração Contábil ("Sistema"), você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis. Se você não concordar com qualquer parte destes termos, não utilize o Sistema.</p>

                    <p><strong>1.2 Descrição do Serviço</strong></p>
                    <p>O Fluxo Integração Contábil é uma plataforma de automação contábil que permite a importação, conciliação e exportação de extratos bancários e arquivos financeiros (OFX, CSV, PDF) para sistemas contábeis, utilizando regras de mapeamento "De/Para" parametrizáveis.</p>

                    <p><strong>1.3 Licença de Uso</strong></p>
                    <p>Concedemos a você uma licença limitada, não exclusiva, não transferível e revogável para acessar e utilizar o Sistema exclusivamente para seus fins internos de contabilidade e gestão financeira, mediante licença válida e ativa.</p>

                    <p><strong>1.4 Responsabilidades do Usuário</strong></p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Manter a confidencialidade de suas credenciais de acesso;</li>
                      <li>Utilizar o Sistema apenas para fins lícitos e de acordo com a legislação brasileira;</li>
                      <li>Não tentar acessar, copiar ou modificar dados de outros usuários;</li>
                      <li>Não realizar engenharia reversa, descompilar ou tentar obter o código-fonte do Sistema;</li>
                      <li>Manter suas informações cadastrais atualizadas.</li>
                    </ul>

                    <p><strong>1.5 Propriedade Intelectual</strong></p>
                    <p>Todos os direitos de propriedade intelectual do Sistema, incluindo software, algoritmos, interfaces, marcas e logotipos, pertencem exclusivamente à Fluxo Tecnologia. Estes Termos não concedem nenhum direito de propriedade intelectual ao usuário.</p>

                    <p><strong>1.6 Limitação de Responsabilidade</strong></p>
                    <p>O Sistema é fornecido "como está" e "conforme disponível". Não garantimos que o Sistema estará livre de erros, ininterrupto ou que atenda a todos os requisitos específicos. Em hipótese alguma seremos responsáveis por danos indiretos, incidentais, especiais ou consequenciais decorrentes do uso ou incapacidade de uso do Sistema.</p>

                    <p><strong>1.7 Vigência e Rescisão</strong></p>
                    <p>Estes Termos entram em vigor na data de aceitação e permanecem válidos enquanto a licença do usuário estiver ativa. Podemos suspender ou encerrar o acesso ao Sistema a qualquer momento, mediante notificação, em caso de violação destes Termos.</p>

                    <p><strong>1.8 Alterações nos Termos</strong></p>
                    <p>Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação no Sistema. O uso contínuo do Sistema após as alterações constitui aceitação dos novos Termos.</p>

                    <p><strong>1.9 Lei Aplicável e Foro</strong></p>
                    <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de Goiânia/GO para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <AppIcon className="size-5 text-primary" name="shield" />
                    2. Política de Privacidade
                  </h2>
                  <div className="prose prose-sm text-muted-foreground space-y-4">
                    <p><strong>2.1 Dados Coletados</strong></p>
                    <p>Coletamos os seguintes dados para fornecer o serviço:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Dados cadastrais: nome, e-mail, telefone, nome da empresa/escritório;</li>
                      <li>Dados de acesso: e-mail e senha (armazenada com hash seguro);</li>
                      <li>Dados das empresas cadastradas: CNPJ/CPF, razão social, código no sistema contábil, enquadramento tributário;</li>
                      <li>Dados operacionais: arquivos importados (OFX, CSV, PDF), lançamentos gerados, regras de De/Para, layouts de planilhas;</li>
                      <li>Logs de auditoria: data/hora de login, ações realizadas no sistema.</li>
                    </ul>

                    <p><strong>2.2 Finalidade do Tratamento</strong></p>
                    <p>Os dados são utilizados exclusivamente para:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Autenticação e autorização de acesso ao Sistema;</li>
                      <li>Processamento e conversão de arquivos bancários em lançamentos contábeis;</li>
                      <li>Armazenamento de configurações personalizadas por cliente;</li>
                      <li>Geração de relatórios e histórico de conciliações;</li>
                      <li>Comunicação sobre atualizações, suporte e renovação de licença;</li>
                      <li>Cumprimento de obrigações legais e regulatórias.</li>
                    </ul>

                    <p><strong>2.3 Compartilhamento de Dados</strong></p>
                    <p>Não vendemos, alugamos ou compartilhamos seus dados com terceiros, exceto:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Quando necessário para cumprimento de obrigação legal ou ordem judicial;</li>
                      <li>Com provedores de infraestrutura cloud (Firebase/Google Cloud) sob contratos de processamento de dados;</li>
                      <li>Com contadores autorizados pelo próprio cliente para fins de prestação de serviços contábeis.</li>
                    </ul>

                    <p><strong>2.4 Segurança da Informação</strong></p>
                    <p>Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Criptografia em trânsito (TLS 1.2+) e em repouso (AES-256);</li>
                      <li>Autenticação baseada em Firebase Authentication;</li>
                      <li>Controle de acesso baseado em funções (RBAC) - administrador vs. cliente;</li>
                      <li>Isolamento de dados: cada cliente acessa apenas suas próprias empresas;</li>
                      <li>Logs de auditoria de todas as operações sensíveis.</li>
                    </ul>

                    <p><strong>2.5 Retenção de Dados</strong></p>
                    <p>Mantemos os dados enquanto a licença estiver ativa. Após o cancelamento ou expiração sem renovação:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Dados cadastrais e de acesso: mantidos por 5 anos para fins legais;</li>
                      <li>Dados operacionais (extratos, lançamentos, regras): mantidos por 5 anos conforme legislação contábil/fiscal;</li>
                      <li>Logs de auditoria: mantidos por 2 anos.</li>
                    </ul>
                    <p>Você pode solicitar a exclusão antecipada dos dados através do canal de suporte, respeitados os prazos legais mínimos.</p>

                    <p><strong>2.6 Direitos do Titular (LGPD)</strong></p>
                    <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Confirmação da existência de tratamento;</li>
                      <li>Acesso aos dados;</li>
                      <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                      <li>Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;</li>
                      <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
                      <li>Eliminação dos dados tratados com consentimento, exceto nas hipóteses legais;</li>
                      <li>Informação sobre entidades com as quais compartilhamos dados;</li>
                      <li>Informação sobre a possibilidade de não fornecer consentimento e consequências;</li>
                      <li>Revogação do consentimento.</li>
                    </ul>
                    <p>Para exercer seus direitos, entre em contato pelo e-mail: <strong>privacidade@fluxo-integracao.com.br</strong></p>

                    <p><strong>2.7 Cookies e Tecnologias Similares</strong></p>
                    <p>Utilizamos cookies essenciais para autenticação e funcionamento do Sistema. Não utilizamos cookies de marketing ou rastreamento de terceiros.</p>

                    <p><strong>2.8 Transferência Internacional</strong></p>
                    <p>Os dados podem ser processados em servidores localizados fora do Brasil (Google Cloud/Firebase), com garantias contratuais adequadas (Standard Contractual Clauses) e em conformidade com a LGPD.</p>

                    <p><strong>2.9 Encarregado de Dados (DPO)</strong></p>
                    <p>O encarregado pelo tratamento de dados pessoais é: <strong>Alisson Santos</strong> - <a href="mailto:privacidade@fluxo-integracao.com.br" className="text-primary underline">privacidade@fluxo-integracao.com.br</a></p>

                    <p><strong>2.10 Alterações na Política</strong></p>
                    <p>Esta Política pode ser atualizada periodicamente. Notificaremos sobre alterações materiais através do Sistema ou por e-mail. A data da última atualização estará sempre visível no rodapé.</p>
                  </div>
                </section>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} | 
                    Versão 1.0 | 
                    Fluxo Tecnologia - CNPJ: 00.000.000/0001-00
                  </p>
                </div>
              </ScrollArea>

              <div className="mt-6 pt-6 border-t border-border/50">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-1 size-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Li, entendo e concordo com os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong> descritos acima.
                  </span>
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleAccept}
                  disabled={!accepted}
                  className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aceitar e Continuar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="h-11 rounded-xl px-6 border-border/80 bg-background hover:bg-muted font-semibold"
                >
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </PageShell>
  );
}