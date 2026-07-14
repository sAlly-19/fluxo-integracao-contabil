"use client";

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Dashboard } from "./components/Dashboard";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { AppIcon } from "./components/design-system";
import { CommandBand, Topbar } from "./components/Topbar";
import { Button } from "./components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select } from "./components/ui/select";
import { cn } from "./lib/utils";
import { getCompanyHref } from "./lib/company";
import { createCompany, deleteCompany, getCompanies, updateCompany } from "./lib/api/companies";
import { getHistory } from "./lib/api/history";
import { fetchCnpjInfo } from "./lib/api/cnpj";
import type { Company, MonthlyEntry, NewCompany, ProcessedBatch } from "./lib/types";
import { useDebounce } from "./lib/use-debounce";
import { useToast } from "./components/ToastContext";
import { getFriendlyErrorMessage } from "./lib/error-handler";
import { useAuth } from "./components/AuthContext";

const taxationOptions = ["Lucro Real", "Lucro Presumido", "Simples Nacional", "Imunes/Isentas"] as const;

function formatCnpjCpf(value: string) {
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    return cleanValue
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
}

const emptyCompany: NewCompany = {
  accountingCode: "",
  document: "",
  name: "",
  nickname: "",
  taxation: "Lucro Presumido"
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [dashboardQuery, setDashboardQuery] = useState("");
  const debouncedDashboardQuery = useDebounce(dashboardQuery, 300);
  const debouncedQuery = useDebounce(query, 300);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [cnpjInfo, setCnpjInfo] = useState<{ name?: string; nickname?: string; error?: string } | null>(null);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<NewCompany>({
    defaultValues: emptyCompany,
    mode: "onChange"
  });
  const canSave = form.formState.isValid;

  useEffect(() => {
    const document = form.getValues("document");
    const cleanDocument = document?.replace(/\D/g, "");
    
    if (!document || (cleanDocument.length !== 11 && cleanDocument.length !== 14)) {
      setCnpjInfo(null);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsCnpjLoading(true);
      const info = await fetchCnpjInfo(document);
      setCnpjInfo(info);
      
      if (info.name && !form.getValues("name")) {
        form.setValue("name", info.name, { shouldValidate: true });
      }
      
      if (info.nickname && !form.getValues("nickname")) {
        form.setValue("nickname", info.nickname, { shouldValidate: true });
      }
      
      setIsCnpjLoading(false);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [form, form.getValues("document")]);

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies", debouncedDashboardQuery, user?.email, user?.role],
    queryFn: () => getCompanies(debouncedDashboardQuery, user?.email, user?.role),
  });

  const { data: searchCompanies = [] } = useQuery({
    queryKey: ["companies", debouncedQuery, user?.email, user?.role],
    queryFn: () => getCompanies(debouncedQuery, user?.email, user?.role),
    enabled: isSearchOpen,
  });

  const { data: processedBatches = [] } = useQuery({
    queryKey: ["history"],
    queryFn: () => getHistory(),
  });

  const createMutation = useMutation({
    mutationFn: (newCompany: NewCompany) => createCompany(newCompany, user?.email),
    onSuccess: (createdCompany) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa cadastrada com sucesso", "A empresa foi adicionada ao sistema.");
      window.setTimeout(() => {
        closeModal();
        navigate(getCompanyHref(createdCompany));
        createMutation.reset();
      }, 1000);
    },
    onError: (error) => {
      const friendly = getFriendlyErrorMessage(error);
      toast.error(friendly.title, friendly.description);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedCompany }: { id: string | number; updatedCompany: NewCompany }) => updateCompany(id.toString(), updatedCompany),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa atualizada com sucesso", "Os dados cadastrais foram alterados.");
      window.setTimeout(() => {
        setEditingCompany(null);
        updateMutation.reset();
      }, 1000);
    },
    onError: (error) => {
      const friendly = getFriendlyErrorMessage(error);
      toast.error(friendly.title, friendly.description);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteCompany(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa excluída com sucesso", "A empresa foi removida do painel.");
      window.setTimeout(() => {
        setEditingCompany(null);
        deleteMutation.reset();
      }, 1000);
    },
    onError: (error) => {
      const friendly = getFriendlyErrorMessage(error);
      toast.error(friendly.title, friendly.description);
    }
  });

  const filteredProcessedBatches = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return processedBatches;
    
    const companyIds = new Set(companies.map(c => c.id.toString()));
    return processedBatches.filter(b => b.companyId && companyIds.has(b.companyId.toString()));
  }, [processedBatches, companies, user]);

  const companiesWithProcess = useMemo(() => {
    return companies.map((company) => {
      const companyBatches = filteredProcessedBatches.filter((b) => {
        if (!b?.companyId || !company?.id) return false;
        return b.companyId.toString() === company.id.toString();
      });
      if (companyBatches.length > 0) {
        const lastBatch = companyBatches.sort((a, b) => {
          const aTime = a?.generatedAt ? new Date(a.generatedAt).getTime() : 0;
          const bTime = b?.generatedAt ? new Date(b.generatedAt).getTime() : 0;
          return isNaN(bTime) ? -1 : isNaN(aTime) ? 1 : bTime - aTime;
        })[0];
        
        let lastProcessStr = "-";
        if (lastBatch?.generatedAt) {
          const parsedDate = new Date(lastBatch.generatedAt);
          if (!isNaN(parsedDate.getTime())) {
            lastProcessStr = parsedDate.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
          }
        }
        
        return {
          ...company,
          lastProcess: lastProcessStr
        };
      }
      return company;
    });
  }, [companies, filteredProcessedBatches]);

  const integrationStats = useMemo(() => {
    const totalLines = filteredProcessedBatches.reduce((acc, batch) => acc + batch.lineCount, 0);
    const totalValue = filteredProcessedBatches.reduce((acc, batch) => acc + batch.totalValue, 0);
    
    const total = companies.length;
    const customizadas = companies.filter((c) => c.mode === "Customizada").length;
    const simples = companies.filter((c) => c.mode === "Simples").length;
    const customPercent = total > 0 ? Math.round((customizadas / total) * 100) : 0;
    const simplesPercent = total > 0 ? Math.round((simples / total) * 100) : 0;
    const taxationCounts = {
      lucroReal: companies.filter((c) => c.taxation === "Lucro Real").length,
      lucroPresumido: companies.filter((c) => c.taxation === "Lucro Presumido").length,
      simplesNacional: companies.filter((c) => c.taxation === "Simples Nacional").length,
      imunesIsentas: companies.filter((c) => c.taxation === "Imunes/Isentas").length
    };

    return {
      companiesCount: total,
      linesGenerated: totalLines,
      totalValueIntegrated: totalValue,
      total,
      customizadas,
      simples,
      customPercent,
      simplesPercent,
      taxationCounts,
      taxationPercents: {
        lucroReal: total > 0 ? Math.round((taxationCounts.lucroReal / total) * 100) : 0,
        lucroPresumido: total > 0 ? Math.round((taxationCounts.lucroPresumido / total) * 100) : 0,
        simplesNacional: total > 0 ? Math.round((taxationCounts.simplesNacional / total) * 100) : 0,
        imunesIsentas: total > 0 ? Math.round((taxationCounts.imunesIsentas / total) * 100) : 0
      }
    };
  }, [companies, filteredProcessedBatches]);

  const monthlyEntries = useMemo(() => buildMonthlyEntries(filteredProcessedBatches), [filteredProcessedBatches]);
  const maxEntryValue = Math.max(...monthlyEntries.map((e) => e.value), 1);
  const totalEntries = filteredProcessedBatches.reduce((sum, batch) => sum + batch.lineCount, 0);

  const existingCompany = useMemo(() => {
    const document = form.getValues("document");
    if (!document) return null;
    const cleanDocument = document.replace(/\D/g, "");
    return companies.find(c => {
      const cleanCompanyDoc = c.document.replace(/\D/g, "");
      return cleanCompanyDoc === cleanDocument;
    });
  }, [companies, form.getValues("document")]);

  function saveCompany(newCompany: NewCompany) {
    if (createMutation.isPending || createMutation.isSuccess) return;
    
    if (existingCompany) {
      toast.error("Empresa já cadastrada", `Já existe uma empresa com o CNPJ ${newCompany.document.replace(/\D/g, "")}.`);
      return;
    }
    
    createMutation.mutate(newCompany);
  }

  function selectCompany(company: Company) {
    setQuery(`${company.code} - ${company.name}`);
    setIsSearchOpen(false);
    navigate(getCompanyHref(company));
  }

  function closeModal() {
    setIsModalOpen(false);
    form.reset(emptyCompany);
  }

  return (
    <main className="min-h-screen bg-muted/30 pb-24 text-foreground selection:bg-primary/20 selection:text-primary">
      <Topbar />
      <CommandBand>
          <div className="relative w-full sm:w-[480px]">
            <AppIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" name="search" />
            <Input
              className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-white shadow-lg backdrop-blur-md transition-all placeholder:text-white/40 focus-visible:bg-white/10 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 sm:text-sm"
              placeholder="Pesquisa rápida de empresa..."
              value={query}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
            />
            {isSearchOpen ? (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-border bg-card p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 z-50">
                {searchCompanies.length > 0 ? (
                  searchCompanies.map((company) => (
                    <button
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      key={company.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectCompany(company);
                      }}
                    >
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-semibold text-foreground">
                          {company.code} - {company.name}
                        </strong>
                        <span className="mt-0.5 block text-xs text-muted-foreground font-mono">{company.document}</span>
                      </span>
                      <AppIcon className="bg-primary/10 text-primary" name="arrow" />
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-xs font-medium text-muted-foreground text-center">Nenhuma empresa cadastrada com este termo.</p>
                )}
              </div>
            ) : null}
          </div>
          <Button className="h-[48px] rounded-xl px-5 shadow-lg shadow-primary/15 font-bold transition-all hover:scale-[1.02] gap-2" type="button" variant="premium" onClick={() => setIsModalOpen(true)}>
            <AppIcon className="bg-white/15 text-white" name="plus" />
            Nova Empresa
          </Button>
      </CommandBand>
      <Dashboard
        companies={companiesWithProcess}
        dashboardQuery={dashboardQuery}
        integrationStats={integrationStats}
        maxEntryValue={maxEntryValue}
        monthlyEntries={monthlyEntries}
        onDashboardQueryChange={setDashboardQuery}
        onEditCompany={setEditingCompany}
        onSelectCompany={selectCompany}
        onToggleShowAllCompanies={() => setShowAllCompanies((current) => !current)}
        showAllCompanies={showAllCompanies}
        totalEntries={totalEntries}
        isLoading={isLoadingCompanies}
      />
      <Dialog open={isModalOpen} onOpenChange={(open) => (open ? setIsModalOpen(true) : closeModal())}>
        <DialogContent className="max-w-3xl border-border bg-card p-0 overflow-hidden shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-8 space-y-6"
          >
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Nova Empresa</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium text-sm">
                Cadastre uma nova empresa para iniciar a integração contábil e a parametrização de De/Para de arquivos.
              </DialogDescription>
            </DialogHeader>

            <form className="grid gap-5" onSubmit={(e) => {
              if (createMutation.isPending || createMutation.isSuccess) {
                e.preventDefault();
                return;
              }
              form.handleSubmit(saveCompany)(e);
            }}>
              {createMutation.isError ? (
                <div className="rounded-xl border border-rose-200/40 bg-rose-500/[0.04] p-4 text-sm text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 font-medium">
                  <strong className="block font-bold mb-1">Não foi possível salvar a empresa:</strong>
                  {createMutation.error instanceof Error ? createMutation.error.message : "Erro desconhecido. Verifique as regras de banco de dados."}
                </div>
              ) : null}

              {createMutation.isSuccess ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-sm text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400 font-medium">
                  <strong className="block font-bold mb-1">Empresa cadastrada com sucesso!</strong>
                  Redirecionando para a página de integrações...
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {/* CPF or CNPJ input */}
                <div className="grid gap-1 sm:col-span-2">
                  <div className={cn(
                    "relative border rounded-xl bg-muted/20 px-3.5 pt-5 pb-1.5 focus-within:ring-2 transition-all group",
                    form.formState.errors.document 
                      ? "border-destructive/40 focus-within:ring-destructive/15 focus-within:border-destructive" 
                      : "border-border/80 focus-within:ring-primary/15 focus-within:border-primary"
                  )}>
                    <Input 
                      id="document" 
                      autoFocus 
                      placeholder="99.999.999/0001-99" 
                      disabled={createMutation.isPending || createMutation.isSuccess}
                      className="h-7 w-full border-0 bg-transparent p-5 text-sm font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-foreground"
                      {...form.register("document", { 
                        required: "CPF ou CNPJ é obrigatório",
                        onChange: (e) => {
                          e.target.value = formatCnpjCpf(e.target.value);
                        },
                        validate: {
                          unique: (value) => {
                            if (!value) return true;
                            const cleanDocument = value.replace(/\D/g, "");
                            if (existingCompany) {
                              return `Empresa já cadastrada com este CNPJ`;
                            }
                            return true;
                          }
                        }
                      })} 
                    />
                    <Label htmlFor="document" className="absolute left-3.5 top-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all group-focus-within:text-primary">
                      CPF ou CNPJ *
                    </Label>
                    {isCnpjLoading && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {cnpjInfo?.error && !existingCompany && (
                    <span className="text-xs text-amber-600 font-bold px-1">{cnpjInfo.error}</span>
                  )}
                  {existingCompany && (
                    <span className="text-xs text-destructive font-bold px-1">Empresa já cadastrada com este CNPJ</span>
                  )}
                  {form.formState.errors.document && !existingCompany && (
                    <span className="text-xs text-destructive font-bold px-1">{form.formState.errors.document.message}</span>
                  )}
                </div>

                {/* Name input */}
                <div className="grid gap-1 sm:col-span-2">
                  <div className={cn(
                    "relative border rounded-xl bg-muted/20 px-3.5 pt-5 pb-1.5 focus-within:ring-2 transition-all group",
                    form.formState.errors.name 
                      ? "border-destructive/40 focus-within:ring-destructive/15 focus-within:border-destructive" 
                      : "border-border/80 focus-within:ring-primary/15 focus-within:border-primary"
                  )}>
                    <Input 
                      id="name" 
                      placeholder="Razão social ou nome completo" 
                      disabled={createMutation.isPending || createMutation.isSuccess}
                      className="h-7 w-full border-0 bg-transparent p-5 text-sm font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-foreground"
                      {...form.register("name", { required: "Nome é obrigatório" })} 
                    />
                    <Label htmlFor="name" className="absolute left-3.5 top-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all group-focus-within:text-primary">
                      Nome / Razão Social *
                    </Label>
                  </div>
                  {cnpjInfo?.name && !existingCompany && (
                    <span className="text-xs text-emerald-600 font-bold px-1 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Nome preenchido via CNPJ
                    </span>
                  )}
                  {form.formState.errors.name && (
                    <span className="text-xs text-destructive font-bold px-1">{form.formState.errors.name.message}</span>
                  )}
                </div>

                {/* Nickname input */}
                <div className="grid gap-1">
                  <div className={cn(
                    "relative border rounded-xl bg-muted/20 px-3.5 pt-5 pb-1.5 focus-within:ring-2 transition-all group",
                    form.formState.errors.nickname 
                      ? "border-destructive/40 focus-within:ring-destructive/15 focus-within:border-destructive" 
                      : "border-border/80 focus-within:ring-primary/15 focus-within:border-primary"
                  )}>
                    <Input 
                      id="nickname" 
                      maxLength={30} 
                      placeholder="Nome de exibição curto" 
                      disabled={createMutation.isPending || createMutation.isSuccess}
                      className="h-7 w-full border-0 bg-transparent p-5 text-sm font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-foreground"
                      {...form.register("nickname", { required: "Apelido é obrigatório" })} 
                    />
                    <Label htmlFor="nickname" className="absolute left-3.5 top-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all group-focus-within:text-primary">
                      Apelido *
                    </Label>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground px-1">
                    {form.formState.errors.nickname ? (
                      <span className="text-destructive font-bold">{form.formState.errors.nickname.message}</span>
                    ) : (
                      cnpjInfo?.nickname && !existingCompany ? (
                        <span className="text-emerald-600">Sugerido via CNPJ</span>
                      ) : <span />
                    )}
                    <span>{form.watch("nickname")?.length ?? 0} / 30</span>
                  </div>
                </div>

                {/* Accounting Code input */}
                <div className="grid gap-1">
                  <div className={cn(
                    "relative border rounded-xl bg-muted/20 px-3.5 pt-5 pb-1.5 focus-within:ring-2 transition-all group",
                    form.formState.errors.accountingCode 
                      ? "border-destructive/40 focus-within:ring-destructive/15 focus-within:border-destructive" 
                      : "border-border/80 focus-within:ring-primary/15 focus-within:border-primary"
                  )}>
                    <Input 
                      id="accountingCode" 
                      placeholder="Ex.: 1204" 
                      disabled={createMutation.isPending || createMutation.isSuccess}
                      className="h-7 w-full border-0 bg-transparent p-5 text-sm font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-foreground"
                      {...form.register("accountingCode", { required: "Código no sistema contábil é obrigatório" })} 
                    />
                    <Label htmlFor="accountingCode" className="absolute left-3.5 top-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all group-focus-within:text-primary">
                      Código Sistema Contábil *
                    </Label>
                  </div>
                  {form.formState.errors.accountingCode && (
                    <span className="text-xs text-destructive font-bold px-1">{form.formState.errors.accountingCode.message}</span>
                  )}
                </div>

                {/* Taxation select */}
                <div className="grid gap-1 sm:col-span-2">
                  <Controller
                    control={form.control}
                    name="taxation"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        className="pb-20"
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={createMutation.isPending || createMutation.isSuccess}
                        options={taxationOptions}
                        label="Enquadramento Tributário *"
                      />
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border/50 gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeModal} 
                  disabled={createMutation.isPending || createMutation.isSuccess}
                  className="h-10 rounded-xl px-5 border-border/80 bg-background hover:bg-muted font-bold transition-all text-sm"
                >
                  Cancelar
                </Button>
                <Button 
                  disabled={createMutation.isPending || createMutation.isSuccess || !!existingCompany || !canSave} 
                  type="submit"
                  className="h-10 rounded-xl px-5 font-bold shadow-lg shadow-primary/15 hover:scale-[1.01] transition-all text-sm"
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar Empresa"}
                </Button>
              </DialogFooter>
            </form>
          </motion.div>
        </DialogContent>
      </Dialog>
      {editingCompany ? (
        <EditCompanyDialog
          company={editingCompany}
          onClose={() => {
            setEditingCompany(null);
            updateMutation.reset();
            deleteMutation.reset();
          }}
          onDelete={() => deleteMutation.mutate(editingCompany.id)}
          onSave={(updatedCompany) => updateMutation.mutate({ id: editingCompany.id, updatedCompany })}
          isPending={updateMutation.isPending || deleteMutation.isPending}
          isSuccess={updateMutation.isSuccess || deleteMutation.isSuccess}
          error={updateMutation.error instanceof Error ? updateMutation.error.message : updateMutation.isError ? "Erro ao atualizar a empresa." : deleteMutation.isError ? "Erro ao excluir a empresa." : null}
        />
      ) : null}
    </main>
  );
}

function buildMonthlyEntries(processedBatches: ProcessedBatch[]): MonthlyEntry[] {
  const now = new Date();
  const buckets = Array.from({ length: 4 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (3 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      value: 0,
      tone: index % 2 === 0 ? "primary" : "dark"
    } satisfies MonthlyEntry & { key: string };
  });

  for (const batch of processedBatches) {
    const date = parseProcessedBatchDate(batch.generatedAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) {
      bucket.value += batch.lineCount;
    }
  }

  return buckets.map(({ key: _key, ...entry }) => entry);
}

function parseProcessedBatchDate(value: string | undefined) {
  if (!value) return new Date();
  const ptBrMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (ptBrMatch) {
    const year = ptBrMatch[3].length === 2 ? `20${ptBrMatch[3]}` : ptBrMatch[3];
    return new Date(Number(year), Number(ptBrMatch[2]) - 1, Number(ptBrMatch[1]));
  }

  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

function EditCompanyDialog({
  company,
  onClose,
  onDelete,
  onSave,
  isPending,
  isSuccess,
  error
}: {
  company: Company;
  onClose: () => void;
  onDelete: () => void;
  onSave: (company: NewCompany) => void;
  isPending?: boolean;
  isSuccess?: boolean;
  error?: string | null;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const editForm = useForm<NewCompany>({
    defaultValues: {
      accountingCode: company.code,
      document: formatCnpjCpf(company.document),
      name: company.name,
      nickname: company.nickname,
      taxation: company.taxation
    },
    mode: "onChange"
  });

  return (
    <>
      <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
        <DialogContent className="max-w-2xl border-border bg-card p-0 overflow-hidden shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-8 space-y-6"
          >
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Editar Empresa</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium text-sm">
                Atualize os dados cadastrais ou exclua esta empresa do painel de monitoramento.
              </DialogDescription>
            </DialogHeader>

            <form className="grid gap-5" onSubmit={(e) => {
              if (isPending || isSuccess) {
                e.preventDefault();
                return;
              }
              editForm.handleSubmit(onSave)(e);
            }}>
              {error ? (
                <div className="rounded-xl border border-rose-200/40 bg-rose-500/[0.04] p-4 text-sm text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 font-medium font-medium">
                  <strong className="block font-bold mb-1">Erro:</strong>
                  {error}
                </div>
              ) : null}

              {isSuccess ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-sm text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400 font-medium">
                  <strong className="block font-bold mb-1">Sucesso!</strong>
                  Operação realizada com sucesso. Fechando modal...
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {/* CPF or CNPJ input */}
                <div className="grid gap-1 sm:col-span-2">
                  <div className={cn(
                    "relative border rounded-xl bg-muted/20 px-3.5 pt-5 pb-1.5 focus-within:ring-2 transition-all group",
                    editForm.formState.errors.document 
                      ? "border-destructive/40 focus-within:ring-destructive/15 focus-within:border-destructive" 
                      : "border-border/80 focus-within:ring-primary/15 focus-within:border-primary"
                  )}>
                    <Input 
                      id="edit-document" 
                      autoFocus 
                      placeholder="99.999.999/0001-99" 
                      disabled={isPending || isSuccess}
                      className="h-7 w-full border-0 bg-transparent p-0 text-sm font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-foreground"
                      {...editForm.register("document", { 
                        required: "CPF ou CNPJ é obrigatório",
                        onChange: (e) => {
                          e.target.value = formatCnpjCpf(e.target.value);
                        }
                      })} 
                    />
                    <Label htmlFor="edit-document" className="absolute left-3.5 top-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all group-focus-within:text-primary">
                      CPF ou CNPJ *
                    </Label>
                  </div>
                  {editForm.formState.errors.document && (
                    <span className="text-xs text-destructive font-bold px-1">{editForm.formState.errors.document.message}</span>
                  )}
                </div>

                {/* Name input */}
                <div className="grid gap-1 sm:col-span-2">
                  <div className={cn(
                    "relative border rounded-xl bg-muted/20 px-3.5 pt-5 pb-1.5 focus-within:ring-2 transition-all group",
                    editForm.formState.errors.name 
                      ? "border-destructive/40 focus-within:ring-destructive/15 focus-within:border-destructive" 
                      : "border-border/80 focus-within:ring-primary/15 focus-within:border-primary"
                  )}>
                    <Input 
                      id="edit-name" 
                      placeholder="Razão social ou nome completo" 
                      disabled={isPending || isSuccess}
                      className="h-7 w-full border-0 bg-transparent p-0 text-sm font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-foreground"
                      {...editForm.register("name", { required: "Nome é obrigatório" })} 
                    />
                    <Label htmlFor="edit-name" className="absolute left-3.5 top-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all group-focus-within:text-primary">
                      Nome / Razão Social *
                    </Label>
                  </div>
                  {editForm.formState.errors.name && (
                    <span className="text-xs text-destructive font-bold px-1">{editForm.formState.errors.name.message}</span>
                  )}
                </div>

                {/* Nickname input */}
                <div className="grid gap-1">
                  <div className={cn(
                    "relative border rounded-xl bg-muted/20 px-3.5 pt-5 pb-1.5 focus-within:ring-2 transition-all group",
                    editForm.formState.errors.nickname 
                      ? "border-destructive/40 focus-within:ring-destructive/15 focus-within:border-destructive" 
                      : "border-border/80 focus-within:ring-primary/15 focus-within:border-primary"
                  )}>
                    <Input 
                      id="edit-nickname" 
                      maxLength={30} 
                      placeholder="Nome de exibição curto" 
                      disabled={isPending || isSuccess}
                      className="h-7 w-full border-0 bg-transparent p-0 text-sm font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-foreground"
                      {...editForm.register("nickname", { required: "Apelido é obrigatório" })} 
                    />
                    <Label htmlFor="edit-nickname" className="absolute left-3.5 top-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all group-focus-within:text-primary">
                      Apelido *
                    </Label>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground px-1">
                    {editForm.formState.errors.nickname ? (
                      <span className="text-destructive font-bold">{editForm.formState.errors.nickname.message}</span>
                    ) : <span />}
                    <span>{editForm.watch("nickname")?.length ?? 0} / 30</span>
                  </div>
                </div>

                {/* Accounting Code input */}
                <div className="grid gap-1">
                  <div className={cn(
                    "relative border rounded-xl bg-muted/20 px-3.5 pt-5 pb-1.5 focus-within:ring-2 transition-all group",
                    editForm.formState.errors.accountingCode 
                      ? "border-destructive/40 focus-within:ring-destructive/15 focus-within:border-destructive" 
                      : "border-border/80 focus-within:ring-primary/15 focus-within:border-primary"
                  )}>
                    <Input 
                      id="edit-accountingCode" 
                      placeholder="Ex.: 1204" 
                      disabled={isPending || isSuccess}
                      className="h-7 w-full border-0 bg-transparent p-0 text-sm font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-foreground"
                      {...editForm.register("accountingCode", { required: "Código no sistema contábil é obrigatório" })} 
                    />
                    <Label htmlFor="edit-accountingCode" className="absolute left-3.5 top-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all group-focus-within:text-primary">
                      Código Sistema Contábil *
                    </Label>
                  </div>
                  {editForm.formState.errors.accountingCode && (
                    <span className="text-xs text-destructive font-bold px-1">{editForm.formState.errors.accountingCode.message}</span>
                  )}
                </div>

                {/* Taxation select */}
                <div className="grid gap-1 sm:col-span-2">
                  <Controller
                    control={editForm.control}
                    name="taxation"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending || isSuccess}
                        options={taxationOptions}
                        label="Enquadramento Tributário *"
                      />
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="sm:justify-between gap-3 pt-4 border-t border-border/50">
                <Button 
                  className="text-destructive hover:bg-rose-500/10 hover:text-destructive h-10 rounded-xl px-4 border-rose-500/10 text-xs font-extrabold tracking-tight uppercase" 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDeleteDialogOpen(true)} 
                  disabled={isPending || isSuccess}
                >
                  Excluir empresa
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={isPending || isSuccess}
                    className="h-10 rounded-xl px-5 border-border/80 bg-background hover:bg-muted font-bold transition-all text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    disabled={isPending || isSuccess} 
                    type="submit"
                    className="h-10 rounded-xl px-5 font-bold shadow-lg shadow-primary/15 hover:scale-[1.01] transition-all text-sm"
                  >
                    {isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </motion.div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Excluir empresa?"
        description={`A empresa ${company.code} - ${company.name} sera removida da lista local. Os lotes ja processados permanecem no historico operacional.`}
        confirmLabel="Excluir"
        tone="danger"
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={onDelete}
      />
    </>
  );
}
