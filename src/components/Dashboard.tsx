"use client";

import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import type { Company, MonthlyEntry } from "../lib/types";
import { AppIcon, DataCard, MetricCard, PageHeader, PageShell, StatusPill } from "./design-system";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";
import { motion } from "motion/react";

export function Dashboard({
  companies,
  dashboardQuery,
  integrationStats,
  maxEntryValue,
  monthlyEntries,
  onDashboardQueryChange,
  onEditCompany,
  onSelectCompany,
  onToggleShowAllCompanies,
  showAllCompanies, isLoading,
  totalEntries
}: {
  companies: Company[];
  dashboardQuery: string;
  integrationStats: {
    total: number;
    customizadas: number;
    simples: number;
    customPercent: number;
    simplesPercent: number;
    taxationCounts: {
      lucroReal: number;
      lucroPresumido: number;
      simplesNacional: number;
      imunesIsentas: number;
    };
    taxationPercents: {
      lucroReal: number;
      lucroPresumido: number;
      simplesNacional: number;
      imunesIsentas: number;
    };
  };
  maxEntryValue: number;
  monthlyEntries: MonthlyEntry[];
  onDashboardQueryChange: (query: string) => void;
  onEditCompany: (company: Company) => void;
  onSelectCompany: (company: Company) => void;
  onToggleShowAllCompanies: () => void;
  showAllCompanies: boolean; isLoading?: boolean;
  totalEntries: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const normalizedDashboardQuery = dashboardQuery.trim().toLowerCase();
  const filteredCompanies = companies.filter((company) => {
    if (!normalizedDashboardQuery) {
      return true;
    }

    const searchable = `${company.code} ${company.name} ${company.document} ${company.nickname} ${company.taxation} ${company.lastProcess}`.toLowerCase();
    return searchable.includes(normalizedDashboardQuery);
  });

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedDashboardQuery, showAllCompanies]);

  const totalItems = filteredCompanies.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleCompanies = filteredCompanies.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("ellipsis-1");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("ellipsis-2");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <TooltipProvider>
      <PageShell className="space-y-8">
      <PageHeader
        badge="Fluxo Contabilidade • Dashboard"
        title="Monitor Integrador Contábil"
        description={
          <span className="text-muted-foreground font-medium text-sm">
            Gerencie layouts de arquivos, configure regras personalizadas "De-Para", monitore e exporte lançamentos prontos para sua contabilidade com segurança máxima.
          </span>
        }
        actions={
          <div className="flex w-full min-w-[280px] sm:min-w-[320px] items-center gap-2.5 rounded-xl border border-border/80 bg-card/60 px-3.5 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/15 focus-within:border-primary transition-all">
            <AppIcon className="size-5 bg-transparent text-muted-foreground" name="search" />
            <Input
              className="h-6 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/40 text-foreground"
              placeholder="Pesquisar por CNPJ, código ou nome..."
              value={dashboardQuery}
              onChange={(event) => onDashboardQueryChange(event.target.value)}
            />
          </div>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon="company" label="Empresas Cadastradas" value={integrationStats.total.toString()} description="Portfólio ativo" />
        <MetricCard icon="file" label="Registros Processados" value={totalEntries.toLocaleString("pt-BR")} description="Últimos 4 meses" />
        <MetricCard icon="activity" label="Modelos Simples" value={integrationStats.simples.toString()} description={`${integrationStats.simplesPercent}% da base total`} />
        <MetricCard icon="sheet" label="Modelos Customizados" value={integrationStats.customizadas.toString()} description={`${integrationStats.customPercent}% da base total`} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <DataCard
          className="border-border/80 bg-card/45 backdrop-blur-md shadow-sm"
          description="Evolução operacional consolidada dos lançamentos"
          title="Histórico de Volume de Lançamentos"
        >
          <div className="mt-4 relative rounded-xl border border-border/50 bg-background/50 p-6">
            <div className="flex gap-4">
              {/* Y-Axis Value Labels */}
              <div className="flex flex-col justify-between text-[10px] font-bold font-mono text-muted-foreground/75 h-56 pb-6 select-none w-14 text-right">
                <span>{maxEntryValue.toLocaleString("pt-BR")}</span>
                <span>{Math.round(maxEntryValue * 0.75).toLocaleString("pt-BR")}</span>
                <span>{Math.round(maxEntryValue * 0.5).toLocaleString("pt-BR")}</span>
                <span>{Math.round(maxEntryValue * 0.25).toLocaleString("pt-BR")}</span>
                <span>0</span>
              </div>

              {/* Chart Grid and Bars */}
              <div className="relative flex-1 h-56 pb-6">
                {/* Horizontal Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between h-48 pointer-events-none">
                  <div className="border-t border-border/40 w-full" />
                  <div className="border-t border-border/40 border-dashed w-full" />
                  <div className="border-t border-border/40 border-dashed w-full" />
                  <div className="border-t border-border/40 border-dashed w-full" />
                  <div className="border-t border-border/40 w-full" />
                </div>

                {/* Bars Grid */}
                <div className="absolute inset-0 flex items-end justify-around gap-4 h-48 z-10">
                  {monthlyEntries.map((item, index) => {
                    const heightPercent = Math.max((item.value / maxEntryValue) * 100, 8);
                    return (
                      <div className="flex h-full flex-col items-center justify-end gap-2 group relative" key={item.month}>
                        {/* Interactive tooltip content with spring animation */}
                        <div className="absolute -top-12 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-white dark:bg-slate-800 text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-xl border border-white/10 flex flex-col items-center whitespace-nowrap">
                          <span>{item.value.toLocaleString("pt-BR")} linhas</span>
                          <span className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">Volume Mensal</span>
                        </div>
                        
                        {/* Bar */}
                        <div className="relative flex h-full w-full max-w-[40px] items-end overflow-hidden rounded-xl bg-muted/20 border border-border/30 shadow-inner group/bar hover:border-primary/40 transition-colors duration-200">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: index * 0.12 }}
                            className="w-full rounded-t-lg bg-gradient-to-t from-primary/70 via-primary to-indigo-500 shadow-lg group-hover:from-primary group-hover:to-indigo-400 transition-all duration-300 cursor-pointer"
                          />
                        </div>
                        
                        {/* Month Label */}
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mt-2 select-none group-hover:text-primary transition-colors">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs bg-muted/30 p-3 rounded-xl border border-border/40">
            <span className="text-muted-foreground font-medium">Lançamentos totais gerados</span>
            <strong className="text-sm font-extrabold text-foreground">{totalEntries.toLocaleString("pt-BR")}</strong>
          </div>
        </DataCard>

        <Card className="border-border/80 bg-card/45 backdrop-blur-md shadow-sm flex flex-col justify-between overflow-hidden">
          <CardHeader>
            <CardDescription>Composição Tributária</CardDescription>
            <CardTitle className="text-xl font-bold tracking-tight">{integrationStats.total.toString().padStart(2, "0")} Empresas Ativas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              whileHover={{ scale: 1.05, rotate: 3 }}
              className="mx-auto flex size-44 items-center justify-center rounded-full p-2.5 shadow-md relative cursor-pointer"
              style={{
                background: buildTaxationConicGradient(integrationStats.taxationPercents)
              }}
            >
              {/* White overlay to turn it into a gorgeous donut chart */}
              <div className="flex size-full flex-col items-center justify-center rounded-full bg-card shadow-inner border border-border/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
                <strong className="text-3xl font-black text-foreground">{integrationStats.total}</strong>
                <span className="text-[10px] font-medium text-muted-foreground">CNPJs</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <DashboardStat color="bg-blue-500" label="Lucro Real" percent={integrationStats.taxationPercents.lucroReal} value={integrationStats.taxationCounts.lucroReal} />
              <DashboardStat color="bg-emerald-500" label="Lucro Presumido" percent={integrationStats.taxationPercents.lucroPresumido} value={integrationStats.taxationCounts.lucroPresumido} />
              <DashboardStat color="bg-amber-500" label="Simples Nac." percent={integrationStats.taxationPercents.simplesNacional} value={integrationStats.taxationCounts.simplesNacional} />
              <DashboardStat color="bg-purple-500" label="Imunes/Isentas" percent={integrationStats.taxationPercents.imunesIsentas} value={integrationStats.taxationCounts.imunesIsentas} />
            </div>
            
            <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground font-semibold bg-muted/40 py-2 px-3 rounded-lg border border-border/30">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado em tempo real com o banco de dados
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/80 bg-card/45 backdrop-blur-md shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-5">
          <div className="space-y-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary">Operações Recentes</CardDescription>
            <CardTitle className="text-xl font-bold tracking-tight">Painel de Empresas Contratantes</CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onToggleShowAllCompanies}
            className="h-10 rounded-xl px-4 border-border/80 bg-background/50 hover:bg-muted font-semibold transition-all text-sm gap-2"
          >
            {showAllCompanies ? "Ver Principais" : "Exibir Todos os CNPJs"}
            <AppIcon className="size-4 bg-transparent text-current" name="arrow" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto p-4">
            <table className="w-full border-separate border-spacing-y-2.5 text-left">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  <th className="pb-1 px-4 font-extrabold text-[10px]">Ações</th>
                  <th className="pb-1 px-4 font-extrabold text-[10px]">Empresa / Razão Social</th>
                  <th className="pb-1 px-4 font-extrabold text-[10px]">Último Fechamento</th>
                  <th className="pb-1 px-4 font-extrabold text-[10px] text-center">Tributação</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr className="animate-pulse" key={`skeleton-${index}`}>
                      <td className="py-4 px-4 bg-card/40 dark:bg-card/20 border-y border-l border-border/40 rounded-l-xl">
                        <div className="flex gap-2">
                          <div className="size-8 rounded-lg bg-muted/60" />
                          <div className="size-8 rounded-lg bg-muted/60" />
                        </div>
                      </td>
                      <td className="py-4 px-4 bg-card/40 dark:bg-card/20 border-y border-border/40">
                        <div className="space-y-2">
                          <div className="h-4 w-48 bg-muted/80 rounded" />
                          <div className="h-3 w-32 bg-muted/50 rounded" />
                        </div>
                      </td>
                      <td className="py-4 px-4 bg-card/40 dark:bg-card/20 border-y border-border/40">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded bg-muted/60" />
                          <div className="h-4 w-28 bg-muted/60 rounded" />
                        </div>
                      </td>
                      <td className="py-4 px-4 bg-card/40 dark:bg-card/20 border-y border-r border-border/40 rounded-r-xl text-center">
                        <div className="h-5 w-24 bg-muted/80 rounded-lg mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : visibleCompanies.length > 0 ? (
                  visibleCompanies.map((company) => (
                    <tr
                      className="group transition-all duration-200"
                      key={company.id}
                    >
                       <td className="py-4 px-4 bg-card/40 dark:bg-card/20 border-y border-l border-border/40 group-hover:border-primary/20 group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/[0.03] rounded-l-xl transition-all duration-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                type="button"
                                variant="outline"
                                aria-label={`Editar ${company.name}`}
                                onClick={() => onEditCompany(company)}
                                className="size-8 rounded-lg border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                              >
                                <AppIcon className="size-3.5 bg-transparent" name="settings" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Configurações & Edição
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                type="button"
                                variant="default"
                                aria-label={`Abrir ${company.name}`}
                                onClick={() => onSelectCompany(company)}
                                className="size-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md shadow-primary/15"
                              >
                                <AppIcon className="size-3.5 bg-transparent" name="arrow" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Acessar Integração
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="py-4 px-4 bg-card/40 dark:bg-card/20 border-y border-border/40 group-hover:border-primary/20 group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/[0.03] transition-all duration-200">
                        <div className="flex flex-col min-w-[200px]">
                          <button
                            className="text-left font-extrabold text-foreground hover:text-primary transition-colors text-sm truncate max-w-md focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/20"
                            type="button"
                            onClick={() => onSelectCompany(company)}
                          >
                            {company.code} - {company.name}
                          </button>
                          <span className="text-[11px] text-muted-foreground/90 font-semibold font-mono mt-1 tracking-tight flex items-center gap-1.5">
                            <span className="text-[9px] text-primary/75 font-extrabold uppercase bg-primary/10 border border-primary/15 px-1 rounded">CNPJ</span>
                            {company.document}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 bg-card/40 dark:bg-card/20 border-y border-border/40 group-hover:border-primary/20 group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/[0.03] transition-all duration-200 whitespace-nowrap">
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-muted border border-border/50 text-muted-foreground transition-all group-hover:scale-105">
                            <AppIcon className="size-3.5 bg-transparent text-current" name="calendar" />
                          </div>
                          <span className="text-foreground/80">{company.lastProcess || "Sem lançamentos recentes"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 bg-card/40 dark:bg-card/20 border-y border-r border-border/40 group-hover:border-primary/20 group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/[0.03] rounded-r-xl transition-all duration-200 text-center whitespace-nowrap">
                        <Badge
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border shadow-sm",
                            company.taxation === "Simples Nacional"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
                              : company.taxation === "Lucro Real"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400"
                              : company.taxation === "Lucro Presumido"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400"
                              : "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400"
                          )}
                        >
                          {company.taxation}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center bg-card/40 border border-border/40 rounded-xl">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto p-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted border border-border/60 text-muted-foreground mb-4">
                          <AppIcon className="size-6 bg-transparent" name="search" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Nenhuma empresa encontrada</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Refine a busca usando outro termo ou cadastre uma nova empresa acima.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-border/50 p-6 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-2.5">
              <span>Registros por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-border/80 bg-background px-2 text-xs text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              >
                <option value={6}>6 registros</option>
                <option value={12}>12 registros</option>
                <option value={24}>24 registros</option>
                <option value={50}>50 registros</option>
              </select>
            </div>
            
            <span className="font-semibold text-muted-foreground">
              Mostrando {totalItems > 0 ? `${startIndex + 1} a ${Math.min(endIndex, totalItems)}` : "0"} de {totalItems} empresa(s) cadastrada(s).
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="icon"
                  type="button"
                  variant="outline"
                  className="h-8 w-8 rounded-lg border-border/80 text-foreground"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  aria-label="Anterior"
                >
                  <span className="font-extrabold text-sm">‹</span>
                </Button>
                {getPageNumbers().map((page, index) => {
                  if (typeof page === "string") {
                    return (
                      <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground font-bold">
                        ...
                      </span>
                    );
                  }
                  return (
                    <Button
                      key={page}
                      size="icon"
                      type="button"
                      variant={currentPage === page ? "default" : "outline"}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                          : "border-border/80 text-muted-foreground hover:bg-muted"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  size="icon"
                  type="button"
                  variant="outline"
                  className="h-8 w-8 rounded-lg border-border/80 text-foreground"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  aria-label="Próximo"
                >
                  <span className="font-extrabold text-sm">›</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
    </TooltipProvider>
  );
}

function DashboardStat({
  color,
  label,
  percent,
  value
}: {
  color: string;
  label: string;
  percent: number;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-3 flex flex-col justify-between hover:border-primary/20 transition-all duration-200">
      <div className="flex items-center gap-1.5">
        <span className={cn("size-2 rounded-full", color)} />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mt-2">
        <strong className="text-lg font-black text-foreground">{value}</strong>
        <span className="text-[10px] font-bold text-muted-foreground font-mono">({percent}%)</span>
      </div>
    </div>
  );
}

function buildTaxationConicGradient(percents: {
  lucroReal: number;
  lucroPresumido: number;
  simplesNacional: number;
  imunesIsentas: number;
}) {
  const slices = [
    { color: "#3b82f6", value: percents.lucroReal },
    { color: "#10b981", value: percents.lucroPresumido },
    { color: "#f59e0b", value: percents.simplesNacional },
    { color: "#8b5cf6", value: percents.imunesIsentas }
  ];
  let start = 0;
  const parts = slices.map((slice) => {
    const end = start + slice.value;
    const part = `${slice.color} ${start}% ${end}%`;
    start = end;
    return part;
  });

  return `conic-gradient(${parts.join(", ")}, var(--muted) ${start}% 100%)`;
}
