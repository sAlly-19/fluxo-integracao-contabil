import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../components/AuthContext";
import { AdminTopbar } from "../components/AdminTopbar";
import { AppIcon } from "../components/design-system";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select } from "../components/ui/select";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/ToastContext";
import { getSystemUsers, createSystemUser, updateSystemUser, deleteSystemUser, getSystemLogins } from "../lib/api/system-users";
import { getNotifications, saveNotification } from "../lib/api/notifications";
import { SystemUser } from "../lib/types";
import { AdminFinancial } from "../components/AdminFinancial";
import { AdminMaintenanceTab } from "../components/AdminMaintenanceTab";
import type { AppNotification } from "../lib/api/notifications";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Security Guard: Redirect if not admin
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user || user.role !== "admin") {
    navigate("/", { replace: true });
    return null;
  }

  const [activeTab, setActiveTab] = useState<"users" | "logins" | "financial" | "notifications" | "maintenance">("users");
  const [userFilterTab, setUserFilterTab] = useState<"all" | "active" | "expiring" | "expired" | "blocked">("all");

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", targetType: "all" as "all" | "active" | "specific", targetUserId: "" });

  const [editingNotification, setEditingNotification] = useState<AppNotification | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    expirationDate: "",
    active: true,
    companyName: "",
    phone: "",
  });

  // Form operations
  const openAddModal = () => {
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    const expiryStr = defaultExpiry.toISOString().split("T")[0];

    const generatedPassword = "FX-" + Math.floor(1000 + Math.random() * 9000);

    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: generatedPassword,
      expirationDate: expiryStr,
      active: true,
      companyName: "",
      phone: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (systemUser: SystemUser) => {
    setEditingUser(systemUser);
    setFormData({
      name: systemUser.name,
      email: systemUser.email,
      password: systemUser.password || "",
      expirationDate: systemUser.expirationDate,
      active: systemUser.active,
      companyName: systemUser.companyName || "",
      phone: systemUser.phone || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Fetch system users
  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ["system_users"],
    queryFn: getSystemUsers,
    enabled: !!user && user.role === "admin",
    retry: false,
  });

  // Fetch recent logins
  const { data: recentLogins = [], isLoading: isLoadingLogins, isError: isErrorLogins, error: errorLogins } = useQuery({
    queryKey: ["system_logins"],
    queryFn: getSystemLogins,
    enabled: !!user && user.role === "admin" && activeTab === "logins",
    retry: false,
  });

  // Fetch notifications
  const { data: notifications = [], isLoading: isLoadingNotifications, isError: isErrorNotifications, error: errorNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(undefined, true),
    enabled: !!user && user.role === "admin" && activeTab === "notifications",
    retry: false,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.expirationDate) {
      toast.warning("Dados Incompletos", "Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim(),
      expirationDate: formData.expirationDate,
      active: formData.active,
      role: "user" as const,
      companyName: formData.companyName.trim(),
      phone: formData.phone.trim(),
    };

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: payload });
    } else {
      const emailExists = users.some(u => u.email.toLowerCase() === payload.email);
      if (emailExists) {
        toast.warning("E-mail Duplicado", "Já existe uma licença ativa com esse e-mail de acesso.");
        return;
      }
      createMutation.mutate(payload);
    }
  };

  // Query mutations
  const createMutation = useMutation({
    mutationFn: createSystemUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      toast.success("Sucesso", "Usuário e licença gerados com sucesso!");
      closeModal();
    },
    onError: (err) => {
      toast.error("Erro", "Não foi possível gerar o usuário.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SystemUser> }) => updateSystemUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      toast.success("Sucesso", "Licença atualizada com sucesso!");
      closeModal();
    },
    onError: (err) => {
      toast.error("Erro", "Não foi possível atualizar o usuário.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSystemUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      toast.success("Sucesso", "Usuário removido com sucesso.");
      setDeletingUser(null);
    },
    onError: (err) => {
      toast.error("Erro", "Não foi possível remover o usuário.");
    },
  });

  const toggleUserStatus = (systemUser: SystemUser) => {
    updateMutation.mutate({
      id: systemUser.id,
      data: { active: !systemUser.active }
    });
  };

  const toggleShowPassword = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const copyCredentials = (systemUser: SystemUser) => {
    const text = `🔑 *Suas Credenciais de Acesso ao Fluxo:*

🌐 *Acesse:* https://fluxo-integracao.com.br
📧 *E-mail:* ${systemUser.email}
🔒 *Senha:* ${systemUser.password}
📅 *Válido até:* ${systemUser.expirationDate.split("-").reverse().join("/")}

Seja bem-vindo ao futuro da integração contábil!`;

    navigator.clipboard.writeText(text);
    toast.success("Copiado!", "Instruções de login copiadas para a área de transferência.");
  };

  // Notification mutations
  const sendNotificationMutation = useMutation({
    mutationFn: (notification: { title: string; message: string; targetUserId?: string }) => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return saveNotification({
        id,
        title: notification.title,
        message: notification.message,
        read: false,
        createdAt: new Date().toISOString(),
        userId: user?.email,
        companyId: notification.targetUserId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Sucesso", "Notificação enviada com sucesso!");
      closeNotificationModal();
    },
    onError: (err) => {
      toast.error("Erro", "Não foi possível enviar a notificação.");
    },
  });

  const closeNotificationModal = () => {
    setIsNotificationModalOpen(false);
    setNotificationForm({ title: "", message: "", targetType: "all", targetUserId: "" });
  };

  const handleNotificationSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationForm.title || !notificationForm.message) {
      toast.warning("Dados Incompletos", "Por favor, preencha título e mensagem.");
      return;
    }
    
    let targetEmail: string | undefined = undefined;
    if (notificationForm.targetType === "specific" && notificationForm.targetUserId) {
      const selectedUser = users.find(u => (u.companyName || u.name || u.email) === notificationForm.targetUserId);
      targetEmail = selectedUser ? selectedUser.email : undefined;
    }

    sendNotificationMutation.mutate({
      title: notificationForm.title,
      message: notificationForm.message,
      targetUserId: targetEmail,
    });
  };

  // Preset helper
  const setExpiryPreset = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    setFormData(prev => ({ ...prev, expirationDate: target.toISOString().split("T")[0] }));
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeekStr = nextWeekDate.toISOString().split("T")[0];

  // Check and trigger auto-notifications for expiring licenses (< 3 days)
  useEffect(() => {
    if (users.length === 0) return;

    const checkAndNotifyExpirations = async () => {
      const expiringUsers = users.filter((u) => {
        if (!u.active) return false;
        const diffTime = new Date(u.expirationDate).getTime() - new Date(todayStr).getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return daysLeft >= 0 && daysLeft < 3;
      });

      if (expiringUsers.length === 0) return;

      try {
        // Fetch existing notifications to avoid duplicate alerts
        const existingNotifs = await getNotifications(undefined, true);
        
        for (const u of expiringUsers) {
          const expectedTitle = `Aviso: Licença de ${u.name} expirando em menos de 3 dias!`;
          const alreadyNotified = existingNotifs.some(n => n.title === expectedTitle);

          if (!alreadyNotified) {
            // Auto send warning to the admin
            const newNotif: AppNotification = {
              id: `expire-warning-${u.id}-${u.expirationDate}`,
              title: expectedTitle,
              message: `A licença do cliente ${u.name} (${u.companyName || "Sem empresa"}) cadastrada sob o e-mail ${u.email} está programada para expirar em menos de 3 dias (Data de expiração: ${u.expirationDate.split("-").reverse().join("/")}). Por favor, entre em contato para renovação.`,
              read: false,
              createdAt: new Date().toISOString(),
              userId: "admin", // Mark for admin
              companyId: "admin",
            };
            await saveNotification(newNotif);
            console.log(`Auto-generated warning for expiring user: ${u.name}`);
          }
        }
      } catch (err) {
        console.error("Failed to execute auto expiration checks:", err);
      }
    };

    checkAndNotifyExpirations();
  }, [users, todayStr]);

  // Filter users based on search and selected tab
  const filteredUsers = users.filter(u => {
    // Search match
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) || 
                          (u.companyName && u.companyName.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;

    // Tab match
    if (userFilterTab === "all") return true;
    if (userFilterTab === "blocked") return !u.active;
    
    // Status depends on active & expiration date
    const isExpired = u.expirationDate < todayStr;
    const isExpiringSoon = !isExpired && u.expirationDate <= nextWeekStr;

    if (userFilterTab === "expired") return u.active && isExpired;
    if (userFilterTab === "expiring") return u.active && isExpiringSoon;
    if (userFilterTab === "active") return u.active && !isExpired;

    return true;
  });

  // Statistics
  const totalCount = users.length;
  const activeCount = users.filter(u => u.active && u.expirationDate >= todayStr).length;
  const blockedCount = users.filter(u => !u.active).length;
  const expiredCount = users.filter(u => u.active && u.expirationDate < todayStr).length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <AdminTopbar />

      <main className="flex-1 mx-auto max-w-[1600px] w-full px-4 py-8 sm:px-6 space-y-8">
        {/* Banner Header */}
        <div className="relative rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-6 py-8 shadow-xl overflow-hidden text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] opacity-30" />
            <div className="absolute top-0 right-1/4 size-64 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400">
                <AppIcon className="size-3.5" name="shield" />
                Painel Administrativo
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Gestão de Licenças e Permissões</h1>
              <p className="text-sm text-slate-400">
                Cadastre clientes, defina senhas seguras, controle datas de validade de teste e bloqueie acessos instantaneamente.
              </p>
            </div>

            <Button
              onClick={openAddModal}
              className="h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 shadow-md shadow-primary/20 shrink-0"
            >
              <AppIcon className="size-4 mr-2" name="plus" />
              Gerar Nova Licença
            </Button>
          </div>
        </div>

        {/* Firebase / Firestore Permission Error Onboarding Card */}
        {(() => {
          const isPermissionError = 
            (isError && String(error).toLowerCase().includes("permission")) ||
            (isErrorLogins && String(errorLogins).toLowerCase().includes("permission")) ||
            (isErrorNotifications && String(errorNotifications).toLowerCase().includes("permission"));
          
          if (!isPermissionError) return null;

          return (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4 shadow-md transition-all animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <AppIcon className="size-6" name="alert" />
                </div>
                <div className="space-y-1 text-left">
                  <h3 className="text-base font-bold text-amber-500">Erro de Permissão no Firestore (Projeto: fluxo-integracao-contabil)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    O sistema foi configurado com sucesso para o novo projeto <strong>fluxo-integracao-contabil</strong>. No entanto, o seu banco de dados Cloud Firestore não pôde ser lido ou gravado devido a restrições de permissão ou falta de inicialização no console do Firebase.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-border/60 pt-4 text-left">
                <h4 className="text-sm font-bold text-foreground mb-2">Como resolver no seu Console Firebase:</h4>
                <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-2.5 pl-2">
                  <li>Acesse o <strong><a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Console Firebase</a></strong> e selecione o projeto <code>fluxo-integracao-contabil</code>.</li>
                  <li>No menu lateral esquerdo, vá em <strong>Build &gt; Firestore Database</strong> e certifique-se de que o banco de dados foi criado (clique em "Criar banco de dados" em modo de teste ou produção).</li>
                  <li>Na aba <strong>Rules (Regras)</strong>, publique as regras de segurança para permitir as leituras e gravações. Exemplo de regra aberta:
                    <pre className="mt-2 p-3 bg-muted text-foreground rounded-lg font-mono text-[11px] overflow-x-auto border border-border">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                    </pre>
                  </li>
                  <li>Clique em <strong>Publish (Publicar)</strong> para aplicar as novas regras. Em instantes o sistema estará operacional com o seu novo banco de dados!</li>
                </ol>
              </div>
            </div>
          );
        })()}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total de Licenças</span>
              <strong className="block text-3xl font-black">{totalCount}</strong>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <AppIcon className="size-6" name="company" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clientes Ativos</span>
              <strong className="block text-3xl font-black text-emerald-500">{activeCount}</strong>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <AppIcon className="size-6" name="check" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expiradas (30 dias)</span>
              <strong className="block text-3xl font-black text-amber-500">{expiredCount}</strong>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <AppIcon className="size-6" name="alert" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bloqueadas</span>
              <strong className="block text-3xl font-black text-rose-500">{blockedCount}</strong>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <AppIcon className="size-6" name="trash" />
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === "users" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Licenças e Permissões
          </button>
          <button
            onClick={() => setActiveTab("logins")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === "logins" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Últimos Logins
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === "financial" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Financeiro
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === "notifications" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Notificações
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === "maintenance" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Manutenção
          </button>
        </div>

        {/* Main Content Area */}
        {activeTab === "users" ? (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Expiring soon (less than 3 days) alerts at the top of users list */}
            {users.filter(u => {
              if (!u.active) return false;
              const diffTime = new Date(u.expirationDate).getTime() - new Date(todayStr).getTime();
              const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return daysLeft >= 0 && daysLeft < 3;
            }).length > 0 && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500/20 text-amber-600 dark:text-amber-400 p-2 rounded-xl shrink-0">
                    <AppIcon className="size-5" name="alert" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400">Atenção: Licenças com Expiração em menos de 3 dias!</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      As seguintes licenças de clientes estão prestes a expirar e precisam de renovação urgente:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {users.filter(u => {
                        if (!u.active) return false;
                        const diffTime = new Date(u.expirationDate).getTime() - new Date(todayStr).getTime();
                        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return daysLeft >= 0 && daysLeft < 3;
                      }).map(u => {
                        const diffTime = new Date(u.expirationDate).getTime() - new Date(todayStr).getTime();
                        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return (
                          <span 
                            key={u.id} 
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300"
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            {u.name} ({u.companyName || "Sem empresa"}) - {daysLeft === 0 ? "Expira hoje!" : `Expira em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}`} ({u.expirationDate.split("-").reverse().join("/")})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Header, Filters & Search */}
            <div className="p-6 border-b border-border flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-foreground self-start sm:self-center">Licenças Cadastradas</h2>
                
                <div className="relative w-full sm:max-w-xs">
                  <AppIcon className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" name="search" />
                  <Input
                    placeholder="Pesquisar por cliente, e-mail ou empresa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 pl-10 rounded-xl bg-muted/30 border-border"
                  />
                </div>
              </div>
              
              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "active", "expiring", "expired", "blocked"] as const).map(tab => {
                  const labels = {
                    all: "Todas",
                    active: "Ativas",
                    expiring: "Expirando em <7d",
                    expired: "Expiradas",
                    blocked: "Bloqueadas"
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setUserFilterTab(tab)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors border ${
                        userFilterTab === tab 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>
            </div>

          {/* User Table */}
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Carregando licenças do sistema...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              {search ? "Nenhum usuário correspondente à pesquisa." : "Nenhuma licença de cliente criada ainda."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Cliente / Empresa</th>
                    <th className="px-6 py-4">E-mail de Acesso</th>
                    <th className="px-6 py-4">Senha Provisória</th>
                    <th className="px-6 py-4">Expiração</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {filteredUsers.map((item) => {
                    const isExpired = item.expirationDate < todayStr;
                    const isExpiringSoon = !isExpired && item.expirationDate <= nextWeekStr;

                    const statusBadge = !item.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-500">
                        ● Bloqueado
                      </span>
                    ) : isExpired ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500">
                        ● Expirado
                      </span>
                    ) : isExpiringSoon ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-500">
                        ● Expirando ({item.expirationDate.split("-").reverse().join("/")})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                        ● Ativo
                      </span>
                    );

                    return (
                      <tr className="hover:bg-muted/10 transition-colors" key={item.id}>
                        {/* Name / Company */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{item.name}</div>
                          {item.companyName && (
                            <div className="text-xs text-muted-foreground mt-0.5">{item.companyName}</div>
                          )}
                        </td>

                        {/* Email / Contact */}
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs">{item.email}</div>
                          {item.phone && (
                            <div className="text-xs text-muted-foreground mt-0.5">{item.phone}</div>
                          )}
                        </td>

                        {/* Password display with toggle */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span>{showPasswords[item.id] ? item.password : "••••••••"}</span>
                            <button
                              onClick={() => toggleShowPassword(item.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                              title={showPasswords[item.id] ? "Ocultar senha" : "Ver senha"}
                            >
                              <AppIcon className="size-4" name={showPasswords[item.id] ? "sun" : "moon"} />
                            </button>
                          </div>
                        </td>

                        {/* Expiration date */}
                        <td className="px-6 py-4 font-mono text-xs">
                          {item.expirationDate.split("-").reverse().join("/")}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {statusBadge}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy details for whatsapp */}
                            <Button
                              onClick={() => copyCredentials(item)}
                              size="icon"
                              variant="ghost"
                              className="size-8 rounded-lg text-slate-400 hover:text-indigo-400"
                              title="Copiar dados para enviar"
                            >
                              <AppIcon className="size-4" name="alert" />
                            </Button>

                            {/* Status toggle */}
                            <Button
                              onClick={() => toggleUserStatus(item)}
                              size="icon"
                              variant="ghost"
                              className={`size-8 rounded-lg ${item.active ? "text-amber-500 hover:text-amber-600" : "text-emerald-500 hover:text-emerald-600"}`}
                              title={item.active ? "Bloquear Acesso" : "Ativar Acesso"}
                            >
                              <AppIcon className="size-4" name="check" />
                            </Button>

                            {/* Edit */}
                            <Button
                              onClick={() => openEditModal(item)}
                              size="icon"
                              variant="ghost"
                              className="size-8 rounded-lg text-blue-500 hover:text-blue-600"
                              title="Editar"
                            >
                              <AppIcon className="size-4" name="company" />
                            </Button>

                            {/* Delete */}
                            <Button
                              onClick={() => setDeletingUser(item)}
                              size="icon"
                              variant="ghost"
                              className="size-8 rounded-lg text-rose-500 hover:text-rose-600"
                              title="Excluir"
                            >
                              <AppIcon className="size-4" name="trash" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        ) : activeTab === "logins" ? (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-foreground">Auditoria de Logins</h2>
            </div>
            
            {isLoadingLogins ? (
              <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                Carregando registros de login...
              </div>
            ) : recentLogins.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Nenhum login registrado recentemente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/40 border-b border-border/80 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Data e Hora</th>
                      <th className="px-6 py-4">E-mail do Usuário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {recentLogins.map((login) => {
                      const dateObj = new Date(login.timestamp);
                      const dateStr = dateObj.toLocaleDateString("pt-BR");
                      const timeStr = dateObj.toLocaleTimeString("pt-BR");
                      return (
                        <tr className="hover:bg-muted/10 transition-colors" key={login.id}>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground">{dateStr}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{timeStr}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-mono text-xs text-indigo-400">{login.email}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === "notifications" ? (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Enviar Notificações</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Envie comunicados para todos os clientes ou para um cliente específico</p>
              </div>
              <Button
                onClick={() => {
                  setNotificationForm({ title: "", message: "", targetType: "all", targetUserId: "" });
                  setIsNotificationModalOpen(true);
                }}
                className="h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 shadow-md shadow-primary/20 shrink-0"
              >
                <AppIcon className="size-4 mr-2" name="plus" />
                Nova Notificação
              </Button>
            </div>

            {/* Notifications History */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/40 border-b border-border/80 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Título</th>
                    <th className="px-6 py-4">Destinatário</th>
                    <th className="px-6 py-4">Data de Envio</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {notifications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                        Nenhuma notificação enviada ainda.
                      </td>
                    </tr>
                  ) : (
                    notifications.map((notification) => (
                      <tr key={notification.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{notification.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{notification.message}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-indigo-400">
                            {notification.companyId ? `Empresa ID: ${notification.companyId}` : "Todos os clientes"}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {new Date(notification.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${notification.read ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                            {notification.read ? "Lida" : "Enviada"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "maintenance" ? (
          <AdminMaintenanceTab />
        ) : (
          <AdminFinancial />
        )}
      </main>

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6 border border-border bg-card">
          <form onSubmit={handleSave} className="space-y-5 text-left">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {editingUser ? "Editar Licença" : "Gerar Nova Licença de Teste"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Forneça os dados cadastrais do cliente. A senha provisória gerada poderá ser enviada no WhatsApp do cliente para primeiro login.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome do Cliente *
                </Label>
                <Input
                  id="modal-name"
                  placeholder="Nome completo do responsável"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="rounded-xl border-border bg-background"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="modal-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    E-mail de Acesso *
                  </Label>
                  <Input
                    id="modal-email"
                    type="email"
                    placeholder="email@cliente.com"
                    required
                    disabled={!!editingUser}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="rounded-xl border-border bg-background disabled:opacity-60"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="modal-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Senha de Acesso *
                  </Label>
                  <Input
                    id="modal-password"
                    placeholder="Defina uma senha"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="rounded-xl border-border bg-background font-mono text-sm"
                  />
                </div>
              </div>

              {/* Company & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-company" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Empresa / Escritório
                  </Label>
                  <Input
                    id="modal-company"
                    placeholder="Nome da empresa"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="rounded-xl border-border bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    WhatsApp para Contato
                  </Label>
                  <Input
                    id="modal-phone"
                    placeholder="(62) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="rounded-xl border-border bg-background"
                  />
                </div>
              </div>

              {/* Expiration Date with Presets */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-expiration" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Data de Expiração da Licença *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="modal-expiration"
                    type="date"
                    required
                    value={formData.expirationDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                    className="rounded-xl border-border bg-background flex-1 font-mono text-sm"
                  />
                  <div className="flex gap-1 shrink-0">
                    <Button type="button" onClick={() => setExpiryPreset(30)} variant="outline" className="text-[10px] h-10 px-2 rounded-xl">
                      +30d
                    </Button>
                    <Button type="button" onClick={() => setExpiryPreset(180)} variant="outline" className="text-[10px] h-10 px-2 rounded-xl">
                      +6m
                    </Button>
                    <Button type="button" onClick={() => setExpiryPreset(365)} variant="outline" className="text-[10px] h-10 px-2 rounded-xl">
                      +1ano
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  id="modal-active"
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="modal-active" className="text-xs font-medium text-muted-foreground select-none">
                  Licença Habilitada (Usuário pode efetuar login imediatamente)
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={closeModal} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editingUser ? "Salvar Alterações" : "Gerar Licença"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notification Modal */}
      <Dialog open={isNotificationModalOpen} onOpenChange={(open) => {
          if (!open) {
            setNotificationForm({ title: "", message: "", targetType: "all", targetUserId: "" });
          }
          setIsNotificationModalOpen(open);
        }}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6 border border-border bg-card">
          <form onSubmit={handleNotificationSave} className="space-y-5 text-left">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {editingNotification ? "Editar Notificação" : "Nova Notificação"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Preencha os dados para enviar uma notificação aos clientes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="notification-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Título *
                </Label>
                <Input
                  id="notification-title"
                  placeholder="Título da notificação"
                  required
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  className="rounded-xl border-border bg-background"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="notification-message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mensagem *
                </Label>
                <Textarea
                  id="notification-message"
                  placeholder="Conteúdo da notificação..."
                  required
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  className="rounded-xl border-border bg-background min-h-[120px]"
                  rows={4}
                />
              </div>

              {/* Target Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Destinatários *
                </Label>
                <Select
                  value={notificationForm.targetType}
                  onValueChange={(value) => setNotificationForm(prev => ({ ...prev, targetType: value as "all" | "active" | "specific" }))}
                  options={["all", "active", "specific"]}
                  label="Selecionar destinatários"
                />
              </div>

              {/* Specific User Selection */}
              {notificationForm.targetType === "specific" && (
                <div className="space-y-1.5">
                  <Label htmlFor="notification-user" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Selecionar Cliente
                  </Label>
                  <Select
                    value={notificationForm.targetUserId}
                    onValueChange={(value) => setNotificationForm(prev => ({ ...prev, targetUserId: value }))}
                    options={users.filter(u => u.role !== "admin").map(u => u.companyName || u.name || u.email)}
                    label="Cliente"
                    placeholder="Selecione um cliente"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsNotificationModalOpen(false); setEditingNotification(null); }} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95"
                disabled={!notificationForm.title || !notificationForm.message}
              >
                {editingNotification ? "Salvar Alterações" : "Enviar Notificação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        title="Remover Licença de Uso"
        description={`Tem certeza que deseja excluir permanentemente as credenciais e licença de ${deletingUser?.name}? O acesso ao sistema será encerrado.`}
        open={deletingUser !== null}
        onOpenChange={() => setDeletingUser(null)}
        onConfirm={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
      />
    </div>
  );
}
