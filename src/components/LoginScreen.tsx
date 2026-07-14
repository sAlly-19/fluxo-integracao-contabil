import { useState } from "react";
import { Sparkles, ArrowRight, Shield, Activity, FileSpreadsheet, ChevronLeft, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function LoginScreen({ onBackToLanding }: { onBackToLanding: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, preencha o e-mail.");
      return;
    }
    if (!password) {
      setError("Por favor, preencha a senha.");
      return;
    }
    setIsLoading(true);
    setError("");

    const result = await login(email, password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || "Credenciais inválidas.");
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError("");
    const result = await login("demo@fluxo.com.br", "demo");
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || "O login de demonstração não está disponível. Por favor, entre como Administrador.");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-950 text-slate-100 lg:flex-row font-sans relative">
      {/* Glow effects in background */}
      <div className="absolute top-0 left-1/4 size-[500px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 size-[600px] rounded-full bg-indigo-600/5 blur-[130px] pointer-events-none" />

      {/* Left side: Content & Login Form */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-12 lg:max-w-2xl xl:max-w-3xl relative z-10 border-r border-white/5">
        {/* Header Logo & Back Button in flow */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 lg:mt-0">
          <div className="flex items-center gap-2">
            <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
              <Sparkles className="size-5 text-white" />
              <div className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-indigo-400 animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-sans text-lg font-bold tracking-tight leading-none text-white">Fluxo</span>
              <span className="font-sans text-[10px] font-semibold text-indigo-400 tracking-wider uppercase mt-1 leading-none">INTEGRAÇÃO CONTÁBIL</span>
            </div>
          </div>

          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 hover:bg-white/10 w-fit"
          >
            <ChevronLeft className="size-4" />
            Voltar para a Apresentação
          </button>
        </div>

        {/* Central Form Card */}
        <div className="mx-auto my-12 w-full max-w-md space-y-8 text-left">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Acesse o Sistema
            </h1>
            <p className="text-sm text-slate-400">
              Entre com as credenciais administrativas ou use uma licença ativa fornecida.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive-foreground">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                E-mail de acesso
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-white/10 bg-slate-900 text-white px-4 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Senha
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border-white/10 bg-slate-900 text-white px-4 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-md shadow-blue-950/20"
            >
              {isLoading ? "Autenticando..." : "Entrar no Sistema"}
              {!isLoading && <ArrowRight className="size-4 ml-2" />}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} Fluxo Tecnologia. Todos os direitos reservados.</span>
          <div className="flex items-center gap-3">
            <Link to="/termos" className="hover:text-slate-300 transition-colors text-slate-400">
              Termos de Uso e Privacidade
            </Link>
            <span className="flex items-center gap-1">
              <Shield className="size-3.5" />
              Sessão protegida
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Modern Visual Presentation (Stripe/Linear style) */}
      <div className="relative hidden flex-1 items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-12 lg:flex overflow-hidden">
        {/* Glowing grid line */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

        {/* High-fidelity mock panel */}
        <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-3 rounded-full bg-rose-500/70" />
              <div className="flex size-3 rounded-full bg-amber-500/70" />
              <div className="flex size-3 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-[10px] font-mono tracking-wider text-slate-500">CONVERSOR_LOTES_V4.X</span>
          </div>

          <div className="mt-6 space-y-6 text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <FileSpreadsheet className="size-3.5 text-emerald-400" />
                  extrato_bancario_julho.ofx
                </span>
                <span className="font-mono text-slate-500">14.8 KB</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all animate-pulse" />
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-semibold text-slate-300">Regras de De/Para</span>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">Automação Ativa</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-xs font-mono">
                <span className="truncate text-slate-400">TAR CALC INST</span>
                <span className="text-indigo-400 font-bold">&rarr;</span>
                <span className="truncate text-indigo-300">Tarifas de Cobrança</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-xs font-mono">
                <span className="truncate text-slate-400">PGTO FORN XYZ</span>
                <span className="text-indigo-400 font-bold">&rarr;</span>
                <span className="truncate text-indigo-300">Fornecedores Diversos</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Activity className="size-4" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-white">Taxa de Conversão</span>
                  <span className="block text-[10px] text-slate-400">99.4% das linhas parametrizadas</span>
                </div>
              </div>
              <span className="font-mono text-lg font-bold text-emerald-400">100% OK</span>
            </div>
          </div>
        </div>

        {/* Decorative quote */}
        <div className="absolute bottom-12 left-12 right-12 text-center">
          <blockquote className="text-sm font-medium text-slate-400">
            "A ferramenta definitiva para integrar extratos bancários, arquivos OFX, CSV e PDFs diretamente em lançamentos contábeis estruturados."
          </blockquote>
        </div>
      </div>
    </div>
  );
}
