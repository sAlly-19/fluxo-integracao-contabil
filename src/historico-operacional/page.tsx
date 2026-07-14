"use client";

import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Topbar } from "../components/Topbar";
import { AppIcon, PageHeader, PageShell, StatusPill } from "../components/design-system";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../components/ui/tooltip";
import { Input } from "../components/ui/input";
import { getCompanies } from "../lib/api/companies";
import { getHistory } from "../lib/api/history";
import type { Company, ProcessedBatch } from "../lib/types";
import { useAuth } from "../components/AuthContext";

export default function OperationalHistoryPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies", user?.email, user?.role],
    queryFn: () => getCompanies(undefined, user?.email, user?.role),
  });

  const { data: batches = [], isPending: isLoadingHistory } = useQuery({
    queryKey: ["history", user?.email, user?.role, companies.map(c => c.id).join(",")],
    queryFn: async () => {
      if (!user) return [];
      if (user.role === "admin") {
        return getHistory();
      }
      if (companies.length === 0) return [];
      
      // For non-admin, only fetch history for their specific companies to avoid leakage
      const promises = companies.map(c => getHistory(c.id));
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: !!user,
  });

  const companyById = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies]);

  const filteredBatches = batches.filter((batch) => {
    const company = companyById.get(batch.companyId);
    
    // Se a empresa não estiver na lista de empresas do usuário (e ele não for admin), ignorar o lote
    if (!company) {
      return false;
    }

    const searchable = `${batch.fileName} ${batch.kind} ${batch.generatedAt} ${company.code} ${company.name}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase());
  });

  const sortedBatches = useMemo(() => {
    return [...filteredBatches].sort((a, b) => {
      const aTime = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
      const bTime = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
      return isNaN(bTime) ? -1 : isNaN(aTime) ? 1 : bTime - aTime;
    });
  }, [filteredBatches]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const totalItems = sortedBatches.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBatches = sortedBatches.slice(startIndex, endIndex);

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
      <main className="app-shell">
      <Topbar />

      <PageShell className="space-y-6">
        <PageHeader
          badge="Historico operacional"
          title="Arquivos processados"
          description="Consulte os ultimos lotes gerados, arquivos de origem, valores e pendencias de envio."
          actions={
            <Button asChild type="button" variant="outline">
              <Link to="/">
                <AppIcon className="bg-muted" name="arrow" />
                Voltar ao painel
              </Link>
            </Button>
          }
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <AppIcon className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent text-muted-foreground" name="spark" />
            <Input className="pl-11" placeholder="Buscar por nome, tipo, data ou empresa..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="text-sm text-muted-foreground">
            Total processado: <strong>{filteredBatches.reduce((acc, b) => acc + b.totalValue, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card className="overflow-hidden border-border/80 animate-pulse" key={`skeleton-${idx}`}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex shrink-0 items-center justify-center rounded-xl bg-muted p-3">
                      <div className="size-6 bg-muted/80 rounded" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-48 bg-muted/80 rounded" />
                        <div className="h-5 w-16 bg-muted/60 rounded-full" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="h-3 w-32 bg-muted/60 rounded" />
                        <div className="h-3 w-40 bg-muted/60 rounded" />
                      </div>
                      <div className="h-3 w-64 bg-muted/40 rounded" />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="h-5 w-24 bg-muted/80 rounded" />
                    <div className="size-9 rounded-full bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedBatches.length > 0 ? (
          <div className="grid gap-3">
            {paginatedBatches.map((batch) => {
              const company = companyById.get(batch.companyId);

              return (
                <Card className="overflow-hidden border-border/80" key={batch.id}>
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="flex shrink-0 items-center justify-center rounded-xl bg-primary/10 p-3 text-primary">
                        <AppIcon className="bg-transparent" name="sheet" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{batch.fileName}</span>
                          <StatusPill tone={batch.generatedFile.sent ? "success" : "warning"}>{batch.generatedFile.sent ? "Enviado" : "Pendente"}</StatusPill>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Data: {batch.generatedAt && !isNaN(new Date(batch.generatedAt).getTime())
                              ? new Date(batch.generatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                              : "Data inválida"}
                          </span>
                          <span>•</span>
                          <span>Empresa: {company ? `${company.code} - ${company.name}` : `ID: ${batch.companyId}`}</span>
                          <span>•</span>
                          <span>Linhas: {batch.lineCount}</span>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">Origens: {batch.sourceFileNames.join(", ")}</div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <span className="block text-sm font-semibold">{batch.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="h-9 w-9 rounded-full"
                            aria-label="Baixar arquivo TXT novamente"
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = `data:${batch.generatedFile.mimeType};base64,${btoa(batch.generatedFile.content)}`;
                              link.download = batch.generatedFile.name;
                              link.click();
                            }}
                          >
                            <AppIcon className="bg-transparent text-primary" name="spark" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Baixar arquivo TXT novamente
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination Panel */}
            <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Itens por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <span>
                Exibindo {totalItems > 0 ? `${startIndex + 1} - ${Math.min(endIndex, totalItems)}` : "0"} de {totalItems} lote(s) encontrado(s).
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    type="button"
                    variant="outline"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    aria-label="Página anterior"
                  >
                    <span className="font-semibold">‹</span>
                  </Button>
                  {getPageNumbers().map((page, index) => {
                    if (typeof page === "string") {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground font-medium">
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
                        className="h-8 w-8 text-xs font-medium"
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
                    className="h-8 w-8"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    aria-label="Próxima página"
                  >
                    <span className="font-semibold">›</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Nenhum lote processado encontrado no historico.
          </div>
        )}
      </PageShell>
    </main>
    </TooltipProvider>
  );
}
