"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clearAccountPlanEntries, getAccountPlanEntries, saveAccountPlanEntries } from "../lib/account-plan-store";
import type { AccountPlanEntry, Company } from "../lib/types";
import { AppIcon, PageShell, StatusPill } from "./design-system";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";

export interface ImportLayoutConfig {
  delimiter: string;
  skipRows: number;
  colAccount: number;
  colSynthetic: number;
  colClassification: number;
  colNickname: number;
}

const DEFAULT_LAYOUT: ImportLayoutConfig = {
  delimiter: ";",
  skipRows: 0,
  colAccount: 0,
  colSynthetic: 1,
  colClassification: 2,
  colNickname: 3,
};

function cleanAccountPlanText(value: string | undefined): string {
  return (value ?? "")
    .replace(/Comercializao/g, "Comercialização")
    .replace(/Transferncias/g, "Transferências")
    .replace(/Depsito/g, "Depósito")
    .replace(/Importaes/g, "Importações")
    .replace(/Importao/g, "Importação")
    .replace(/Alimentao/g, "Alimentação")
    .replace(/Autnomos/g, "Autônomos")
    .replace(/Mdica/g, "Médica")
    .replace(/Gratificaes/g, "Gratificações")
    .replace(/Informaes/g, "Informações")
    .replace(/Previdncia/g, "Previdência")
    .replace(/Rescises/g, "Rescisões")
    .replace(/Frias/g, "Férias")
    .replace(/Títulos/g, "Títulos")
    .replace(/Crdito/g, "Crédito")
    .replace(/Dbito/g, "Débito");
}

export function AccountPlanScreen({ company }: { company: Company }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<AccountPlanEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Load configuration or use defaults
  const [layoutConfig, setLayoutConfig] = useState<ImportLayoutConfig>(() => {
    const saved = localStorage.getItem(`fluxo-account-plan-layout-${company.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading import layout config:", e);
      }
    }
    return { ...DEFAULT_LAYOUT };
  });

  // Temporarily hold config in form before saving
  const [tempConfig, setTempConfig] = useState<ImportLayoutConfig>({ ...layoutConfig });

  useEffect(() => {
    setIsLoading(true);
    getAccountPlanEntries(company.id)
      .then((data) => {
        setEntries(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
    setQuery("");
  }, [company.id]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter((entry) =>
      `${entry.reducedAccount ?? entry.account} ${entry.synthetic} ${entry.classificationCode ?? ""} ${entry.classification} ${entry.nickname}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [entries, query]);

  async function clearPlan() {
    setEntries([]);
    setQuery("");
    await clearAccountPlanEntries(company.id);
  }

  const parseWithCustomLayout = (text: string, config: ImportLayoutConfig): AccountPlanEntry[] => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const result: AccountPlanEntry[] = [];
    
    // Skip starting header rows
    const dataLines = lines.slice(config.skipRows);

    dataLines.forEach((line, index) => {
      // Skip separator lines or header labels if found
      if (line.includes("____") || line.startsWith('"Conta"')) return;

      const delimiter = config.delimiter === "Tab" ? "\t" : config.delimiter;
      const parts = line.split(delimiter).map(part => part.replace(/^"|"$/g, "").trim());

      const account = parts[config.colAccount] || "";
      const synthetic = parts[config.colSynthetic] || "";
      const classification = parts[config.colClassification] || "";
      const nickname = parts[config.colNickname] || "";

      if (!account || !classification) return;

      const classificationMatch = classification.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
      const classificationCode = classificationMatch?.[1] ?? "";
      const normalizedClassification = classificationMatch?.[2]?.trim() || classification.trim();

      result.push({
        id: (index + 1) as any as number,
        account: cleanAccountPlanText(account),
        reducedAccount: cleanAccountPlanText(account),
        synthetic: cleanAccountPlanText(synthetic),
        classificationCode: cleanAccountPlanText(classificationCode),
        classification: cleanAccountPlanText(normalizedClassification),
        nickname: cleanAccountPlanText(nickname),
      });
    });

    return result;
  };

  async function importCsv(file?: File) {
    if (!file) {
      return;
    }

    setIsLoading(true);
    try {
      const text = await readAccountPlanFileText(file);
      const parsedEntries = parseWithCustomLayout(text, layoutConfig);
      await saveAccountPlanEntries(company.id, parsedEntries);
      setEntries(parsedEntries);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteEntry(entryId: string | number) {
    const updatedEntries = entries.filter((entry) => entry.id !== entryId);
    setEntries(updatedEntries);
    await saveAccountPlanEntries(company.id, updatedEntries);
  }

  const handleSaveConfig = () => {
    setLayoutConfig(tempConfig);
    localStorage.setItem(`fluxo-account-plan-layout-${company.id}`, JSON.stringify(tempConfig));
    setIsLayoutModalOpen(false);
  };

  const hasEntries = entries.length > 0;

  if (isLoading) {
    return (
      <PageShell className="space-y-5">
        {/* Search Bar Skeleton */}
        <Card className="mx-auto max-w-5xl">
          <CardContent className="p-4">
            <div className="h-12 w-full bg-muted/40 rounded-2xl animate-pulse" />
          </CardContent>
        </Card>

        {/* List Skeleton */}
        <Card className="mx-auto max-w-5xl border-border bg-card/40 backdrop-blur-md shadow-sm overflow-hidden animate-pulse">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-border/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="h-5 w-48 bg-muted/60 rounded" />
                <div className="h-3 w-80 bg-muted/40 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-32 bg-muted/50 rounded-full" />
                <div className="h-10 w-28 bg-muted/50 rounded-xl" />
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="h-4 w-12 bg-muted/50 rounded" />
                <div className="h-4 w-24 bg-muted/50 rounded" />
                <div className="h-4 w-10 bg-muted/50 rounded" />
                <div className="h-4 w-32 bg-muted/50 rounded" />
                <div className="h-4 w-48 bg-muted/50 rounded" />
                <div className="h-4 w-20 bg-muted/50 rounded" />
              </div>
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="h-12 w-full bg-muted/20 rounded-xl border border-border/20" />
              ))}
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-5">
      <div className="mx-auto max-w-5xl flex justify-between items-center px-2">
        <div className="text-left">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Configurações de Layout</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Defina o layout do arquivo de importação do plano de contas para abranger qualquer sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setTempConfig({ ...layoutConfig });
              setIsLayoutModalOpen(true);
            }}
            className="rounded-xl h-9 text-xs font-semibold px-3 bg-card border-border/80 hover:bg-muted"
          >
            <AppIcon name="settings" className="size-3.5" />
            Configurar Layout
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setIsDocModalOpen(true)}
            className="rounded-xl h-9 text-xs font-semibold px-3 text-primary hover:bg-primary/5"
          >
            <AppIcon name="history" className="size-3.5" />
            Ver Documentação
          </Button>
        </div>
      </div>

      <Card className="mx-auto max-w-5xl">
        <CardContent className="p-4">
          <div className="flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative min-w-0 flex-1">
              <AppIcon className="pointer-events-none absolute right-3 top-1/2 size-7 -translate-y-1/2 bg-transparent text-sky-500" name="search" />
              <Input
                className="h-12 rounded-none border-0 pr-12 text-base shadow-none focus-visible:ring-0"
                placeholder="Pesquise os registros desejados"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <input
              ref={fileInputRef}
              accept=".csv,.txt,text/csv,text/plain"
              className="sr-only"
              type="file"
              onChange={(event) => importCsv(event.target.files?.[0])}
            />

            {hasEntries ? (
              <Button className="h-12 rounded-none border-l px-6 text-destructive hover:bg-rose-50" type="button" variant="ghost" onClick={clearPlan}>
                <AppIcon className="bg-rose-50 text-rose-600" name="close" />
                Excluir Plano
              </Button>
            ) : (
              <Button className="h-12 rounded-none px-6" type="button" onClick={() => fileInputRef.current?.click()}>
                <AppIcon className="bg-white/15 text-primary-foreground" name="upload" />
                Importar (.CSV / .TXT)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {hasEntries ? (
        <ImportedAccountPlan
          entries={filteredEntries}
          totalEntries={entries.length}
          onDeleteEntry={deleteEntry}
          onImportClick={() => fileInputRef.current?.click()}
        />
      ) : (
        <EmptyAccountPlan company={company} onImportClick={() => fileInputRef.current?.click()} onDocClick={() => setIsDocModalOpen(true)} />
      )}

      {/* --- MODAL CONFIGURAÇÃO LAYOUT --- */}
      {isLayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
              <div className="text-left">
                <h3 className="text-base font-bold text-foreground">Configurar Layout de Importação</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Sincronize as colunas do seu arquivo CSV/TXT do plano de contas.</p>
              </div>
              <button onClick={() => setIsLayoutModalOpen(false)} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <AppIcon name="close" className="size-4 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Separador (Delimitador)</label>
                  <select 
                    value={tempConfig.delimiter} 
                    onChange={(e) => setTempConfig(prev => ({ ...prev, delimiter: e.target.value }))}
                    className="w-full h-10 rounded-xl bg-background border border-border px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value=";">Ponto e vírgula (;)</option>
                    <option value=",">Vírgula (,)</option>
                    <option value="Tab">Tabulação (Tab)</option>
                    <option value="|">Pipe (|)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Linhas para pular (Header)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={tempConfig.skipRows} 
                    onChange={(e) => setTempConfig(prev => ({ ...prev, skipRows: parseInt(e.target.value) || 0 }))}
                    className="w-full h-10 rounded-xl bg-background border border-border px-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-3">Índice das Colunas (Iniciando em 0)</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Coluna Conta Reduzida</label>
                    <input 
                      type="number" 
                      min={0}
                      value={tempConfig.colAccount} 
                      onChange={(e) => setTempConfig(prev => ({ ...prev, colAccount: parseInt(e.target.value) || 0 }))}
                      className="w-full h-10 rounded-xl bg-background border border-border px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Coluna Sintética</label>
                    <input 
                      type="number" 
                      min={0}
                      value={tempConfig.colSynthetic} 
                      onChange={(e) => setTempConfig(prev => ({ ...prev, colSynthetic: parseInt(e.target.value) || 0 }))}
                      className="w-full h-10 rounded-xl bg-background border border-border px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Coluna Classificação / Descrição</label>
                    <input 
                      type="number" 
                      min={0}
                      value={tempConfig.colClassification} 
                      onChange={(e) => setTempConfig(prev => ({ ...prev, colClassification: parseInt(e.target.value) || 0 }))}
                      className="w-full h-10 rounded-xl bg-background border border-border px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Coluna Apelido / Código Interno</label>
                    <input 
                      type="number" 
                      min={0}
                      value={tempConfig.colNickname} 
                      onChange={(e) => setTempConfig(prev => ({ ...prev, colNickname: parseInt(e.target.value) || 0 }))}
                      className="w-full h-10 rounded-xl bg-background border border-border px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl h-10 px-4 text-xs font-semibold" onClick={() => setIsLayoutModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" className="rounded-xl h-10 px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95" onClick={handleSaveConfig}>
                Salvar Layout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DOCUMENTAÇÃO --- */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
              <div className="text-left">
                <h3 className="text-base font-bold text-foreground">Documentação de Importação de Planos</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Aprenda a estruturar o arquivo e configurar o layout ideal.</p>
              </div>
              <button onClick={() => setIsDocModalOpen(false)} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <AppIcon name="close" className="size-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left max-h-[420px] overflow-y-auto text-sm leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-foreground">1. Formato do Arquivo</h4>
                <p className="text-muted-foreground text-xs">
                  O arquivo de plano de contas deve ser do tipo de texto plano (ex: <strong>.CSV</strong> ou <strong>.TXT</strong>), preferencialmente codificado em UTF-8 ou Windows-1252 (ANSI). Cada linha do arquivo representa um registro de conta contábil.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">2. Configuração do Delimitador</h4>
                <p className="text-muted-foreground text-xs">
                  O delimitador separa as colunas na mesma linha. Os delimitadores suportados são Ponto e Vírgula (<code>;</code>), Vírgula (<code>,</code>), Tabulação (Tab) e Pipe (<code>|</code>). Certifique-se de selecionar o delimitador correspondente ao seu arquivo na janela de configuração de layout.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">3. Mapeamento de Colunas (Índice Base-0)</h4>
                <p className="text-muted-foreground text-xs">
                  Para mapear as colunas do seu arquivo para o sistema, você deve usar índices começando em <strong>0</strong> (onde 0 é a 1ª coluna, 1 é a 2ª, etc.). Exemplo:
                </p>
                <div className="bg-muted p-3 rounded-xl font-mono text-xs text-foreground overflow-x-auto space-y-1 border border-border">
                  <div>// Exemplo de linha CSV delimitada por ponto e vírgula:</div>
                  <div>10101;S;1.01.01.01.0001 Caixa Geral;CAIXA_GERAL</div>
                  <div className="text-indigo-400 mt-2">// Mapeamento Correspondente:</div>
                  <div>• Conta Reduzida: 0 &nbsp;&nbsp;(Valor: "10101")</div>
                  <div>• Sintética: 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Valor: "S")</div>
                  <div>• Classificação: 2 &nbsp;(Valor: "1.01.01.01.0001 Caixa Geral")</div>
                  <div>• Apelido: 3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Valor: "CAIXA_GERAL")</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">4. Linhas de Cabeçalho (Pular Linhas)</h4>
                <p className="text-muted-foreground text-xs">
                  Caso o seu arquivo contenha linhas de introdução, cabeçalho da empresa ou títulos de relatórios no topo que não sejam contas reais, aumente o valor de "Linhas para pular" (por exemplo, se possuir 3 linhas de títulos antes da tabela contábil, configure como <code>3</code>).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">5. Compatibilidade Universal</h4>
                <p className="text-muted-foreground text-xs">
                  Com esse mecanismo personalizável, você pode exportar relatórios contábeis de qualquer ERP contábil do mercado (Domínio ERP, Alterdata, Questor, Contmatic, Prosoft, Alterdata, etc.) no formato de texto, verificar a ordem das colunas e importá-los sem dificuldades!
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/10 flex justify-end">
              <Button type="button" className="rounded-xl h-10 px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95" onClick={() => setIsDocModalOpen(false)}>
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

async function readAccountPlanFileText(file: File) {
  const buffer = await file.arrayBuffer();

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function EmptyAccountPlan({ company, onImportClick, onDocClick }: { company: Company; onImportClick: () => void; onDocClick: () => void }) {
  return (
    <Card className="mx-auto max-w-4xl border-border bg-card shadow-sm">
      <CardContent className="grid gap-5 p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-2xl">:(</div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Nenhum plano de contas foi importado</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            A empresa <strong className="text-foreground">{company.code} - {company.name}</strong> ainda não possui plano de contas específico.
            Importe um CSV/TXT configurado de acordo com seu ERP para liberar a seleção de contas nos De/Paras.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={onImportClick} className="rounded-xl">
            <AppIcon className="bg-white/15 text-primary-foreground" name="upload" />
            Importar plano de contas
          </Button>
          <Button type="button" variant="outline" onClick={onDocClick} className="rounded-xl">
            Ver documentação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ImportedAccountPlan({
  entries,
  onDeleteEntry,
  onImportClick,
  totalEntries
}: {
  entries: AccountPlanEntry[];
  onDeleteEntry: (entryId: string | number) => void;
  onImportClick: () => void;
  totalEntries: number;
}) {
  return (
    <TooltipProvider>
      <Card className="mx-auto max-w-5xl border-border bg-card/45 backdrop-blur-md shadow-sm overflow-hidden text-left">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b border-border/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Plano de contas importado</h1>
            <p className="text-xs text-muted-foreground font-medium">Dados carregados a partir do layout configurado para a empresa.</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill tone="success">{totalEntries} contas sincronizadas</StatusPill>
            <Button type="button" variant="outline" onClick={onImportClick} className="h-10 rounded-xl px-4 border-border/80 bg-background hover:bg-muted font-semibold transition-all text-sm">
              Reimportar Arquivo
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto p-4 sm:p-6">
          <table className="w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
                <th className="pb-2 px-4 w-16">Ação</th>
                <th className="pb-2 px-4">Conta Reduzida</th>
                <th className="pb-2 px-4 text-center">S</th>
                <th className="pb-2 px-4">Classificação</th>
                <th className="pb-2 px-4">Descrição</th>
                <th className="pb-2 px-4">Apelido</th>
              </tr>
            </thead>
            <tbody>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <tr className="group transition-all duration-150" key={entry.id}>
                    <td className="py-3 px-4 bg-card/45 dark:bg-card/25 border-y border-l border-border/40 group-hover:border-primary/20 group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/[0.03] rounded-l-xl transition-all duration-150">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            aria-label={`Excluir conta ${entry.account}`}
                            onClick={() => onDeleteEntry(entry.id)}
                            className="size-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                          >
                            <AppIcon className="size-3.5 bg-transparent text-rose-500" name="close" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Excluir Conta
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="py-3 px-4 bg-card/45 dark:bg-card/25 border-y border-border/40 group-hover:border-primary/20 group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/[0.03] transition-all duration-150 font-bold text-foreground">
                      {entry.reducedAccount ?? entry.account}
                    </td>
                    <td className="py-3 px-4 bg-card/45 dark:bg-card/25 border-y border-border/40 group-hover:border-primary/20 group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/[0.03] transition-all duration-150 text-center font-mono text-xs text-muted-foreground">
                      {entry.synthetic || "-"}
                    </td>
                    <td className="py-3 px-4 bg-card/45 dark:bg-card/25 border-y border-border/40 group-hover:border-primary/20 group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/[0.03] transition-all duration-150 font-mono text-xs text-muted-foreground">
                      {entry.classificationCode || "-"}
                    </td>
                    <td className="py-3 px-4 bg-card/45 dark:bg-card/25 border-y border-border/40 group-hover:border-primary/20 group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/[0.03] transition-all duration-150 font-semibold text-foreground">
                      {entry.classification}
                    </td>
                    <td className="py-3 px-4 bg-card/45 dark:bg-card/25 border-y border-r border-border/40 group-hover:border-primary/20 group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/[0.03] rounded-r-xl transition-all duration-150 text-xs text-muted-foreground font-medium font-mono">
                      {entry.nickname || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center bg-card/40 border border-border/40 rounded-xl">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto p-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted border border-border/60 text-muted-foreground mb-4">
                        <AppIcon className="size-6 bg-transparent" name="search" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Nenhuma conta encontrada</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tente refinar a busca com outros termos de classificação ou conta.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
