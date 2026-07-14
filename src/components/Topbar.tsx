"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Company, EntityId, ProcessedBatch } from "../lib/types";
import { getHistory } from "../lib/api/history";
import { getCompanies } from "../lib/api/companies";
import { getNotifications, markNotificationAsRead } from "../lib/api/notifications";
import { useQuery } from "@tanstack/react-query";
import { AnimatedBand, AnimatedHeader } from "./animate-ui/motion";
import { ConfirmDialog } from "./ConfirmDialog";
import { AppIcon, BrandMark } from "./design-system";
import { Button } from "./ui/button";
import { useAuth } from "./AuthContext";

const ACCOUNTING_ORGS = ["FLUXO CONTABILIDADE"];
const ACCOUNTING_ORG_KEY = "fluxo-selected-accounting-org-v1";

export function Topbar({ title, breadcrumbs }: { title?: string; breadcrumbs?: { label: string }[] }) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("fluxo-theme");
    if (saved) return saved === "dark";
    return document.documentElement.classList.contains("dark");
  });
  const [selectedOrg, setSelectedOrg] = useState(() => {
    const saved = localStorage.getItem(ACCOUNTING_ORG_KEY);
    return saved ?? ACCOUNTING_ORGS[0];
  });
  const displayedOrg = user?.role === "admin"
    ? (user?.name || "Administrador")
    : (user?.companyName || user?.name || "FLUXO CONTABILIDADE");

  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const { data: processedBatches = [] } = useQuery({ queryKey: ["history"], queryFn: () => getHistory() });
  const { data: companies = [] } = useQuery({ 
    queryKey: ["companies", user?.email, user?.role], 
    queryFn: () => getCompanies(undefined, user?.email, user?.role) 
  });
  const { data: apiNotifications = [], refetch: refetchNotifications } = useQuery({ queryKey: ["notifications"], queryFn: () => getNotifications(user?.email) });
  const unreadCount = apiNotifications.filter(n => !n.read).length;
  
  const pendingFiles = processedBatches.filter((batch) => {
    if (batch.generatedFile.sent) return false;
    const company = companies.find(c => c.id === batch.companyId);
    return !!company;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      localStorage.setItem("fluxo-theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("fluxo-theme", "light");
    }
  }, [isDark]);

  function changeOrg(org: string) {
    window.localStorage.setItem(ACCOUNTING_ORG_KEY, org);
    setIsOrgOpen(false);
  }

  const userInitials = user ? user.email.slice(0, 2).toUpperCase() : "US";

  return (
    <AnimatedHeader className="sticky top-0 z-40 border-b border-border/85 bg-background/80 backdrop-blur-md">
      {title && breadcrumbs && (
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 pb-2">
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <span key={item.label}>
                {index > 0 && <span className="mx-1">/</span>}
                {item.label}
              </span>
            ))}
          </nav>
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link className="flex min-w-0 items-center focus:outline-none" to="/" aria-label="Fluxo Contabilidade">
          <BrandMark />
        </Link>


        <div className="flex shrink-0 items-center gap-2">
          {user?.role === "admin" ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 text-xs font-bold text-indigo-400">
              <AppIcon className="size-3.5" name="shield" />
              Administrador
            </div>
          ) : (
            <div className="relative hidden md:block">
              <Button
                className="h-10 rounded-full border border-border bg-card/90 px-3 text-sm font-medium text-foreground shadow-sm shadow-slate-950/5"
                type="button"
                variant="ghost"
                aria-expanded={isOrgOpen}
                onClick={() => setIsOrgOpen((current) => !current)}
              >
                <AppIcon className="size-6 bg-primary/10 text-primary" name="company" />
                <span className="max-w-56 truncate">{displayedOrg}</span>
              </Button>
              {isOrgOpen ? (
                <MenuPanel className="right-0 w-72">
                  <MenuHeader title="Escritório / Usuário" description="Identificação do acesso ativo desta sessão." />
                  <div className="grid gap-2">
                    <button
                      className="rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted bg-primary/10 font-semibold text-primary"
                      type="button"
                      onClick={() => setIsOrgOpen(false)}
                    >
                      {displayedOrg}
                    </button>
                  </div>
                </MenuPanel>
              ) : null}
            </div>
          )}

          <Button asChild aria-label="Historico operacional" className="rounded-full" size="icon" type="button" variant="ghost">
            <Link to="/historico-operacional">
              <AppIcon className="bg-transparent text-muted-foreground" name="history" />
            </Link>
          </Button>

          {user?.role !== "admin" && (
            <div className="relative">
              <Button
                aria-label="Notificacoes"
                className="relative rounded-full"
                size="icon"
                type="button"
                variant="ghost"
                aria-expanded={isNotificationsOpen}
                onClick={() => setIsNotificationsOpen((current) => !current)}
              >
                <AppIcon className="bg-transparent text-muted-foreground" name="alert" />
                {(pendingFiles.length + unreadCount) > 0 ? (
                  <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {Math.min(pendingFiles.length + unreadCount, 99)}
                  </span>
                ) : null}
              </Button>
              {isNotificationsOpen ? (
                <MenuPanel className="right-0 w-100 max-h-[480px] overflow-y-auto">
                  <MenuHeader title="Notificações" description="Alertas operacionais do integrador e administração." />
                  <div className="grid gap-2">
                    {/* 1. Custom Admin Notifications */}
                    {apiNotifications.length > 0 ? (
                      <div className="space-y-2 border-b border-border pb-3 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block px-1">
                          Mensagens do Sistema
                        </span>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {apiNotifications.map((notif) => (
                            <div 
                              key={notif.id}
                              className={`rounded-xl border border-border p-3 text-xs transition-colors relative ${notif.read ? "bg-muted/15" : "bg-primary/5 border-primary/20"}`}
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <strong className="block text-foreground font-semibold leading-snug break-all">
                                  {notif.title}
                                </strong>
                                {!notif.read && (
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      await markNotificationAsRead(notif.id);
                                      refetchNotifications();
                                    }}
                                    className="text-[10px] font-bold text-primary hover:underline shrink-0"
                                    title="Marcar como lida"
                                  >
                                    Lida
                                  </button>
                                )}
                              </div>
                              <span className="block text-muted-foreground mt-1 whitespace-pre-wrap break-all leading-normal">
                                {notif.message}
                              </span>
                              <span className="block text-[9px] text-muted-foreground/60 mt-1.5 font-mono">
                                {new Date(notif.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* 2. Pending Files */}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block px-1">
                      Arquivos Integrador
                    </span>
                    {pendingFiles.length > 0 ? (
                      pendingFiles.slice(0, 4).map((batch) => (
                        <Link
                          className="rounded-xl border border-border bg-muted/35 px-3 py-2 text-xs transition-colors hover:bg-muted block w-full text-left"
                          to="/historico-operacional"
                          key={`${batch.companyId}-${batch.generatedFile.id}`}
                          onClick={() => setIsNotificationsOpen(false)}
                        >
                          <strong className="block text-foreground">Arquivo pendente</strong>
                          <span className="block truncate text-muted-foreground">{batch.fileName}</span>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                        Nenhum arquivo pendente de envio.
                      </div>
                    )}
                    
                    <Link className="text-xs font-semibold text-primary hover:underline text-center block mt-1 pt-2 border-t border-border" to="/historico-operacional" onClick={() => setIsNotificationsOpen(false)}>
                      Ver histórico operacional
                    </Link>
                  </div>
                </MenuPanel>
              ) : null}
            </div>
          )}

          <Button
            aria-label="Alternar tema"
            className="rounded-full"
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => setIsDark((current) => !current)}
          >
            <AppIcon className="bg-transparent text-muted-foreground" name={isDark ? "sun" : "moon"} />
          </Button>

          <div className="relative">
            <Button
              className="size-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 p-0 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-500"
              type="button"
              variant="ghost"
              aria-label="Menu do usuario"
              aria-expanded={isUserOpen}
              onClick={() => setIsUserOpen((current) => !current)}
            >
              {userInitials}
            </Button>
            {isUserOpen ? (
              <MenuPanel className="right-0 w-72">
                <MenuHeader 
                  title={user?.name || user?.email || "Usuário Conectado"} 
                  description={user?.role === "admin" ? "Administrador do Sistema" : "Acesso Concedido • Cliente"} 
                />
                <div className="grid gap-2 text-sm">
                  {user?.role === "admin" && (
                    <Link className="rounded-xl px-3 py-2 font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/15 flex items-center gap-1.5 transition-colors" to="/admin" onClick={() => setIsUserOpen(false)}>
                      <AppIcon className="size-4" name="shield" />
                      Painel Administrativo
                    </Link>
                  )}
                  <Link className="rounded-xl px-3 py-2 hover:bg-muted flex items-center gap-1.5" to="/" onClick={() => setIsUserOpen(false)}>
                    <AppIcon className="size-4" name="home" />
                    Painel inicial
                  </Link>
                  <Link className="rounded-xl px-3 py-2 hover:bg-muted flex items-center gap-1.5" to="/suporte" onClick={() => setIsUserOpen(false)}>
                    <AppIcon className="size-4" name="message-square" />
                    Suporte
                  </Link>
                  <button className="rounded-xl px-3 py-2 text-left hover:bg-muted flex items-center gap-1.5 w-full" type="button" onClick={() => setIsDark((current) => !current)}>
                    <AppIcon className="size-4" name={isDark ? "sun" : "moon"} />
                    Alternar tema
                  </button>
                  <button
                    className="rounded-xl px-3 py-2 text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-medium transition-colors flex items-center gap-1.5 w-full"
                    type="button"
                    onClick={() => {
                      setIsUserOpen(false);
                      logout();
                    }}
                  >
                    <AppIcon className="size-4 text-rose-500" name="logout" />
                    Sair do Sistema (Logout)
                  </button>
                </div>
              </MenuPanel>
            ) : null}
          </div>
        </div>
      </div>
    </AnimatedHeader>
  );
}

export function CompanyCommandBar({
  backHref,
  company,
  showBack = false
}: {
  backHref?: string;
  company: Company;
  showBack?: boolean;
}) {
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <>
      <CommandBand>
        <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-center">
          {showBack ? (
            <Button asChild className="h-[52px] w-fit rounded-2xl border-white/20 bg-white/10 px-5 text-white hover:bg-white/15 hover:text-white" variant="ghost">
              <Link to={backHref ?? `/empresas/${company.document ? company.document.replace(/\D/g, "") : company.id}`}>
                <AppIcon className="bg-white/15 text-white" name="arrow" />
                Voltar
              </Link>
            </Button>
          ) : null}
          <div className="flex h-[52px] min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/20 bg-white text-slate-900 shadow-xl shadow-sky-950/10 xl:max-w-xl">
            <div className="min-w-0 flex-1 px-4 py-2 text-sm font-medium">
              <span className="block truncate">{company.code} - {company.name}</span>
              <span className="block text-xs text-slate-500">{company.document}</span>
            </div>
            <Button className="h-auto rounded-none border-l border-slate-200 px-3 hover:bg-slate-50" type="button" variant="ghost" aria-label="Atualizar dados da empresa" onClick={() => queryClient.invalidateQueries()}>
              <AppIcon className="bg-primary/10 text-primary" name="spark" />
            </Button>
            <Button className="h-auto rounded-none border-l border-slate-200 px-3 text-destructive hover:bg-rose-50" type="button" variant="ghost" aria-label="Sair da empresa selecionada" onClick={() => setIsLeaveDialogOpen(true)}>
              <AppIcon className="bg-rose-50 text-rose-600" name="close" />
            </Button>
          </div>
          <Button
            className="group h-[52px] w-fit rounded-2xl border-white/20 bg-white/10 px-5 text-white hover:bg-white hover:text-primary"
            type="button"
            variant="ghost"
            aria-expanded={isConsultOpen}
            aria-controls="consult-side-nav"
            onClick={() => setIsConsultOpen((current) => !current)}
          >
            <AppIcon className="bg-white/15 text-white transition-colors group-hover:bg-primary/10 group-hover:text-primary" name={isConsultOpen ? "close" : "settings"} />
            Configurar
          </Button>
        </div>
      </CommandBand>
      {isConsultOpen ? <ConsultSideNav companyId={company.document ? company.document.replace(/\D/g, "") : company.id} onClose={() => setIsConsultOpen(false)} /> : null}
      <ConfirmDialog
        open={isLeaveDialogOpen}
        title="Sair desta empresa?"
        description="Voce voltara para a selecao de empresas. Nenhum dado cadastrado sera apagado."
        confirmLabel="Sair"
        onOpenChange={setIsLeaveDialogOpen}
        onConfirm={() => navigate("/")}
      />
    </>
  );
}

function ConsultSideNav({ companyId, onClose }: { companyId: EntityId; onClose: () => void }) {
  const items = [
    { href: `/empresas/${companyId}/plano-de-contas`, icon: "table" as const, label: "Plano de Contas" },
    { href: `/empresas/${companyId}/consultas/de-paras`, icon: "search" as const, label: "De / Paras" },
    { href: `/empresas/${companyId}/consultas/regras`, icon: "settings" as const, label: "Regras" },
    { href: `/empresas/${companyId}/consultas/contas-padroes`, icon: "bank" as const, label: "Contas Padroes" },
    { href: "/historico-operacional", icon: "history" as const, label: "Historico operacional" }
  ];

  return (
    <>
      <button className="fixed inset-0 top-16 z-30 bg-slate-950/20 backdrop-blur-[1px] xl:hidden" type="button" aria-label="Fechar consultas" onClick={onClose} />
      <aside
        id="consult-side-nav"
        className="fixed bottom-0 right-0 top-16 z-30 w-full max-w-80 border-l border-border bg-card/96 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl"
        aria-label="Consultar"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Atalhos</span>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Consultar</h2>
          </div>
          <Button size="icon" type="button" variant="ghost" aria-label="Fechar consultas" onClick={onClose}>
            <AppIcon className="bg-muted text-muted-foreground" name="close" />
          </Button>
        </div>
        <nav className="mt-6 grid gap-3">
          {items.map((item) => (
            <Button
              asChild
              className="h-12 justify-start rounded-2xl bg-primary px-4 text-primary-foreground shadow-md shadow-sky-950/10 hover:bg-primary/90"
              key={item.label}
            >
              <Link to={item.href} onClick={onClose}>
                <AppIcon className="bg-white/15 text-primary-foreground" name={item.icon} />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </aside>
    </>
  );
}

function MenuPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`absolute top-[calc(100%+0.65rem)] z-50 rounded-2xl border border-border bg-card p-3 shadow-2xl shadow-slate-950/20 ${className}`}>
      {children}
    </div>
  );
}

function MenuHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="mb-3 border-b border-border pb-3">
      <strong className="block text-sm text-foreground">{title}</strong>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
    </div>
  );
}

export function CommandBand({ children }: { children: ReactNode }) {
  return (
    <AnimatedBand className="border-b border-border bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-4 py-8 shadow-xl sm:px-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] opacity-40" />
        <div className="absolute top-0 right-1/4 size-64 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      <div className="mx-auto flex max-w-[1180px] w-full flex-col gap-4 md:flex-row md:items-center md:justify-center relative z-10">{children}</div>
    </AnimatedBand>
  );
}
