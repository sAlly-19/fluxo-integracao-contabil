import { useState } from "react";
import { Link } from "react-router-dom";
import { AppIcon, type AppIconName, PageHeader, PageShell, StatusPill } from "./design-system";
import { modules } from "../lib/app-modules";
import type { Company, ModuleId } from "../lib/types";
import { Card, CardContent } from "./ui/card";
import { useToast } from "./ToastContext";
import { Button } from "./ui/button";
import { Sparkles, Upload, FileText, MessageSquare, History, ArrowRight, ArrowLeft, X } from "lucide-react";

const iconByModule: Record<ModuleId, AppIconName> = {
  files: "upload",
  sheets: "sheet"
};

const moduleAccent: Record<ModuleId, string> = {
  files: "from-blue-600 via-indigo-500 to-cyan-500",
  sheets: "from-purple-600 via-violet-500 to-pink-500"
};

const moduleIconBg: Record<ModuleId, string> = {
  files: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  sheets: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
};

export function CompanyModules({ company }: { company: Company }) {
  const selectedModule = modules.find((moduleItem) => moduleItem.id === "files") ?? modules[0];
  const { toast } = useToast();

  const [isTourOpen, setIsTourOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("fluxoic_onboarding_completed_v1");
    }
    return false;
  });
  const [tourStep, setTourStep] = useState(0);

  const TOUR_STEPS = [
    {
      title: "Seja bem-vindo ao Fluxo Integrador Contábil! 👋",
      badge: "CONCEITO DO SISTEMA",
      description: "Este é o painel de fechamento e integração da empresa. Vamos apresentar como o robô de mapeamento ajuda você a poupar tempo todos os meses.",
      icon: <Sparkles className="size-6 text-indigo-500" />
    },
    {
      title: "1. Importar Arquivos (OFX, PDF, CSV) 📂",
      badge: "FECHAMENTO OPERACIONAL",
      description: "Nessa aba você faz o upload dos extratos ou planilhas financeiras do cliente. O robô cruza com o Plano de Contas e preenche automaticamente as contas através das regras de De/Para.",
      icon: <Upload className="size-6 text-blue-500" />
    },
    {
      title: "2. Layout de Planilhas Personalizadas ⚙️",
      badge: "PARAMETRIZAÇÃO DE CLIENTES",
      description: "O cliente enviou um arquivo com colunas fora de ordem? Sem problemas! Configure layouts dinâmicos para ler qualquer modelo de planilha de forma automatizada.",
      icon: <FileText className="size-6 text-purple-500" />
    },
    {
      title: "3. Central de Atendimento & Suporte 💬",
      badge: "SUPORTE CONTÁBIL DE PLANTÃO",
      description: "Tem uma dúvida fiscal complexa ou problema na leitura de algum banco? Nossa Central de Suporte no topo permite abrir chamados diretamente para o administrador do sistema.",
      icon: <MessageSquare className="size-6 text-pink-500" />
    },
    {
      title: "4. Histórico de Conciliações 📊",
      badge: "AUDITORIA & CONFORMIDADE",
      description: "Monitore os lotes anteriores gerados, faça download do arquivo de fechamento (.QUE, .TXT, .CSV ou extensão personalizada) a qualquer momento e acompanhe a eficiência acumulada das automações.",
      icon: <History className="size-6 text-teal-500" />
    }
  ];

  const handleNextTour = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevTour = () => {
    if (tourStep > 0) {
      setTourStep((prev) => prev - 1);
    }
  };

  const completeTour = () => {
    setIsTourOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("fluxoic_onboarding_completed_v1", "true");
    }
    toast.success("Tour Concluído!", "Você já está pronto para integrar e conciliar seus arquivos.");
  };

  const startTour = () => {
    setTourStep(0);
    setIsTourOpen(true);
  };

  return (
    <PageShell className="space-y-8 relative overflow-hidden">
      {/* Decorative background grid and blurs */}
      <div className="absolute top-0 right-0 -z-10 size-[32rem] rounded-full bg-primary/5 blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 size-[32rem] rounded-full bg-indigo-500/5 blur-[128px] pointer-events-none" />

      <PageHeader
        badge="Área de Integração"
        title="Central de Integração Contábil"
        actions={
          <Button
            onClick={startTour}
            variant="outline"
            className="h-9 rounded-xl border-primary/20 bg-primary/[0.03] text-primary font-bold hover:bg-primary/10 gap-1.5 text-xs shadow-sm"
          >
            <Sparkles className="size-3.5 animate-pulse text-primary" />
            Tour de Onboarding
          </Button>
        }
        description={
          <span className="text-muted-foreground font-medium">
            Selecione o módulo operacional desejado para realizar o fechamento mensal ou parametrizar os layouts reais da empresa{" "}
            <strong className="font-bold text-foreground inline-flex items-center gap-1.5 bg-muted/60 border border-border/60 px-2 py-0.5 rounded-md">
              {company.code} - {company.name}
            </strong>.
          </span>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((moduleItem) => {
          const cleanDoc = company.document ? company.document.replace(/\D/g, "") : "";
          const companyUrlId = cleanDoc || company.id;
          const hrefByModule: Record<ModuleId, string> = {
            files: `/empresas/${companyUrlId}/importar-arquivos`,
            sheets: `/empresas/${companyUrlId}/configurar-planilhas`
          };

          return (
            <Link 
              className="group block focus-visible:outline-none focus:outline-none" 
              to={hrefByModule[moduleItem.id]} 
              key={moduleItem.id}
            >
              <Card className="relative h-full overflow-hidden border-border/80 bg-card/45 backdrop-blur-md p-0.5 transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                {/* Glowing edge effect on hover */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${moduleAccent[moduleItem.id]} opacity-80 group-hover:opacity-100 transition-opacity`} />
                
                <CardContent className="flex min-h-[260px] flex-col justify-between p-7 relative">
                  <div className="flex items-start justify-between">
                    <div className={`flex size-14 items-center justify-center rounded-2xl ${moduleIconBg[moduleItem.id]} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shadow-sm`}>
                      <AppIcon
                        className="size-7 bg-transparent text-current"
                        name={iconByModule[moduleItem.id]}
                      />
                    </div>
                    
                    <div className="flex size-9 items-center justify-center rounded-xl bg-muted/40 border border-border/60 text-muted-foreground transition-all duration-300 group-hover:translate-x-1.5 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent">
                      <AppIcon className="size-4 bg-transparent text-current" name="arrow" />
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-3">
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground transition-all group-hover:text-primary">
                      {moduleItem.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                      <strong className="font-bold text-foreground bg-muted/20 px-1 rounded">
                        {moduleItem.descriptionLead}
                      </strong>{" "}
                      {moduleItem.descriptionBody}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-primary/10 bg-gradient-to-r from-primary/[0.03] to-indigo-500/[0.03] backdrop-blur-md">
        <CardContent className="flex flex-col gap-4 p-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <AppIcon className="size-4 bg-transparent text-current" name="spark" />
            </div>
            <span className="font-semibold text-foreground/80">
              <strong className="font-extrabold text-primary">{selectedModule.descriptionLead}</strong> {selectedModule.descriptionBody}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <span className="size-2.5 rounded-full bg-primary animate-pulse" />
            Fluxo Contábil
          </span>
        </CardContent>
      </Card>

      {/* ONBOARDING TOUR MODAL OVERLAY */}
      {isTourOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="relative max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-300 space-y-5">
            
            {/* Close Button */}
            <button 
              type="button" 
              onClick={completeTour}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-muted rounded-lg"
              aria-label="Pular tour"
            >
              <X className="size-4" />
            </button>

            {/* Header / Badge */}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/15 shrink-0">
                {TOUR_STEPS[tourStep].icon}
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black tracking-widest text-primary uppercase bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-full">
                  {TOUR_STEPS[tourStep].badge}
                </span>
                <div className="text-xs text-muted-foreground font-semibold">
                  Passo {tourStep + 1} de {TOUR_STEPS.length}
                </div>
              </div>
            </div>

            {/* Description Text */}
            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-tight text-foreground">
                {TOUR_STEPS[tourStep].title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {TOUR_STEPS[tourStep].description}
              </p>
            </div>

            {/* Progress line dots */}
            <div className="flex gap-1.5 justify-center py-2">
              {TOUR_STEPS.map((_, i) => (
                <span 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === tourStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`} 
                />
              ))}
            </div>

            {/* Footer Navigation Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <button 
                type="button" 
                onClick={completeTour}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Pular guia
              </button>
              
              <div className="flex gap-2">
                {tourStep > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handlePrevTour}
                    className="h-8 rounded-lg text-xs font-semibold px-3 gap-1"
                  >
                    <ArrowLeft className="size-3" />
                    Anterior
                  </Button>
                )}
                
                <Button 
                  onClick={handleNextTour}
                  className="h-8 rounded-lg text-xs font-bold px-4 bg-primary hover:bg-primary/95 gap-1 shadow-sm"
                >
                  {tourStep === TOUR_STEPS.length - 1 ? "Concluir" : "Próximo"}
                  {tourStep !== TOUR_STEPS.length - 1 && <ArrowRight className="size-3" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
