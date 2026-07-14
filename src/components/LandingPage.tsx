import { useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Shield, Activity, FileSpreadsheet, MessageSquare, Phone, Building, Mail, User, Check, Zap, Cpu, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function LandingPage({ onGoToLogin }: { onGoToLogin: () => void }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const message = `Olá! Gostaria de adquirir uma licença de teste grátis (30 dias) do Fluxo.

*Meus dados de contato:*
- *Nome:* ${formData.name}
- *Empresa:* ${formData.companyName}
- *E-mail:* ${formData.email}
- *WhatsApp:* ${formData.phone}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5562998580032?text=${encodedMessage}`;

    setTimeout(() => {
      setIsSubmitting(false);
      window.open(whatsappUrl, "_blank");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
      {/* Glow effects in background */}
      <div className="absolute top-0 left-1/4 size-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 size-[600px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 size-[400px] rounded-full bg-violet-600/10 blur-[110px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
            <Sparkles className="size-5 text-white" />
            <div className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-indigo-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-lg font-extrabold tracking-tight leading-none text-white">Fluxo</span>
            <span className="font-sans text-[9px] font-bold text-indigo-400 tracking-wider uppercase mt-1 leading-none">INTEGRAÇÃO CONTÁBIL</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/termos"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Termos e Privacidade
          </Link>
          <Button
            onClick={onGoToLogin}
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 px-5 font-semibold text-sm transition-all"
          >
            Acessar Sistema
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-20 lg:pt-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-300">
            <Zap className="size-3.5 fill-indigo-300/20" />
            <span>Nova Geração de Integração Contábil</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
            Automatize seus <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Lançamentos Contábeis</span> em segundos.
          </h1>

          <p className="text-lg text-slate-400 max-w-xl">
            Converta extratos de qualquer banco (OFX, CSV ou PDF) no formato de importação do seu sistema contábil com inteligência de "De/Para" parametrizável e inteligência preditiva.
          </p>

          {/* Key Bullet Points */}
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Check className="size-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200">Reconciliação Eficiente</h4>
                <p className="text-xs text-slate-400">Layouts inteligentes de conversão automatizada.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Check className="size-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200">Inteligência De/Para</h4>
                <p className="text-xs text-slate-400">Regras dinâmicas salvas por cliente.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Check className="size-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200">Visualização de Dados</h4>
                <p className="text-xs text-slate-400">Gráficos interativos e dashboards operacionais.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Check className="size-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200">Plano de Contas Unificado</h4>
                <p className="text-xs text-slate-400">Fácil mapeamento com contas reduzidas.</p>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Trial Form */}
        <div className="lg:col-span-5 relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 opacity-20 blur-2xl pointer-events-none" />
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative border border-white/10 bg-slate-900/60 p-8 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6"
          >
            <div className="text-left space-y-1.5">
              <div className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                PROMOÇÃO DE LANÇAMENTO
              </div>
              <h3 className="text-2xl font-extrabold text-white">Solicite Licença Grátis</h3>
              <p className="text-xs text-slate-400">
                Ganhe 30 dias de uso irrestrito do sistema. Preencha os dados e nos envie a mensagem no WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nome do Solicitante
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 size-4 text-slate-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="h-11 pl-10 rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="companyName" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nome da Empresa / Escritório
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3.5 size-4 text-slate-500" />
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Nome da sua empresa"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="h-11 pl-10 rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  E-mail corporativo
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 size-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@empresa.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="h-11 pl-10 rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Número para contato (WhatsApp)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 size-4 text-slate-500" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(62) 99999-9999"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-11 pl-10 rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold transition-all shadow-lg shadow-emerald-950/20"
              >
                <MessageSquare className="size-4 mr-2" />
                {isSubmitting ? "Redirecionando..." : "Solicitar Teste de 30 Dias"}
              </Button>
            </form>
            
            <p className="text-[10px] text-center text-slate-500">
              Ao solicitar, você concorda com nossos <Link to="/termos" className="underline hover:text-slate-300">Termos de Uso</Link> e <Link to="/termos" className="underline hover:text-slate-300">Política de Privacidade</Link>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Decorative interactive showcase or features cards */}
      <section className="relative z-10 border-t border-white/5 bg-slate-900/30 py-20">
        <div className="mx-auto max-w-7xl px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Por que escolher o Fluxo?</h2>
            <p className="text-sm text-slate-400">
              Desenhado sob medida para contadores que buscam alta eficiência operacional e eliminação de processos manuais lentos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-white/5 bg-slate-950/40 p-6 rounded-2xl space-y-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Cpu className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Mapeador Universal</h3>
              <p className="text-sm text-slate-400">
                Compatível com os principais ERPs contábeis do Brasil. Importe e exporte relatórios perfeitamente ajustados à sua taxonomia de contas.
              </p>
            </div>

            <div className="border border-white/5 bg-slate-950/40 p-6 rounded-2xl space-y-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <FileSpreadsheet className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Conexão Inteligente OFX/CSV</h3>
              <p className="text-sm text-slate-400">
                Interpretação exata de históricos complexos. O sistema cria sugestões dinâmicas de contas contábeis de débito e crédito.
              </p>
            </div>

            <div className="border border-white/5 bg-slate-950/40 p-6 rounded-2xl space-y-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Shield className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Controle de Segurança</h3>
              <p className="text-sm text-slate-400">
                Histórico detalhado e registro de lotes de importação. Saiba exatamente o que foi exportado, por quem e quando.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} Fluxo Tecnologia. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link to="/termos" className="hover:text-slate-300 transition-colors">Termos de Uso</Link>
            <span className="text-slate-700">·</span>
            <Link to="/termos" className="hover:text-slate-300 transition-colors">Política de Privacidade</Link>
            <span className="flex items-center gap-1">
              <Shield className="size-3.5" />
              Sessão protegida por criptografia de ponta a ponta
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
