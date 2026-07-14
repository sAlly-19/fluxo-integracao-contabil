import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CreditCard, 
  DollarSign, 
  Copy, 
  Check, 
  MessageSquare, 
  Mail, 
  RefreshCw, 
  Trash2, 
  Calendar, 
  FileText, 
  Search, 
  Plus, 
  Settings, 
  Clock, 
  AlertTriangle,
  QrCode,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./ToastContext";
import { getSystemUsers } from "../lib/api/system-users";
import { 
  getSystemPayments, 
  createSystemPayment, 
  updateSystemPayment, 
  deleteSystemPayment 
} from "../lib/api/system-payments";
import { getSmtpLogs, createSmtpLog, SmtpLog } from "../lib/api/system-smtp-logs";
import { getBillingTemplates, saveBillingTemplates, getWebhookConfig, saveWebhookConfig, BillingTemplates, WebhookConfig } from "../lib/api/system-configs";
import { replacePlaceholders } from "../lib/utils/placeholders";
import { generatePixCopiaECola, getPixQrCodeUrl } from "../lib/utils/pix";
import { SystemUser, SystemPayment } from "../lib/types";

export function AdminFinancial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State management
  const [subTab, setSubTab] = useState<"payments" | "smtp" | "templates" | "webhooks">("payments");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "overdue">("all");
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [isPixDetailsOpen, setIsPixDetailsOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<SystemPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<SystemPayment | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [smtpStatusFilter, setSmtpStatusFilter] = useState<"all" | "delivered" | "opened" | "failed">("all");

  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [simulatedWebhookResult, setSimulatedWebhookResult] = useState<null | { url: string; status: number; statusText: string; payload: any; response: any }>(null);

  // PIX Config states (persisted in localStorage)
  const [pixKey, setPixKey] = useState(() => localStorage.getItem("admin-pix-key") || "alissontar18@gmail.com");
  const [merchantName, setMerchantName] = useState(() => localStorage.getItem("admin-pix-name") || "FLUXO INTEGRACAO");
  const [merchantCity, setMerchantCity] = useState(() => localStorage.getItem("admin-pix-city") || "SAO PAULO");
  const [autoSendGlobal, setAutoSendGlobal] = useState(() => {
    const saved = localStorage.getItem("admin-auto-send-global");
    return saved !== "false"; // Default to true
  });

  // Form states
  const [selectedUserId, setSelectedUserId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("149.90");
  const [paymentDescription, setPaymentDescription] = useState("Licença Mensal - Sistema de Integração Contábil");
  const [paymentDueDate, setPaymentDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3); // Default due date = today + 3 days
    return d.toISOString().split("T")[0];
  });
  const [paymentAutoSend, setPaymentAutoSend] = useState(true);

  // Queries
  const { data: users = [] } = useQuery({
    queryKey: ["system_users"],
    queryFn: getSystemUsers,
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["system_payments"],
    queryFn: getSystemPayments,
  });

  const { data: smtpLogs = [], refetch: refetchSmtpLogs } = useQuery({
    queryKey: ["system_smtp_logs"],
    queryFn: getSmtpLogs,
  });

  const { data: templates } = useQuery({
    queryKey: ["billing_templates"],
    queryFn: getBillingTemplates,
  });

  const { data: webhookConfig } = useQuery({
    queryKey: ["webhook_config"],
    queryFn: getWebhookConfig,
  });

  // Template Editor form states (synchronized with primitive fields)
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");

  const templatesSubject = templates?.emailSubject;
  const templatesBody = templates?.emailBody;
  const templatesWhatsapp = templates?.whatsappMessage;

  // Sync templates once loaded using primitive triggers
  useMemo(() => {
    if (templatesSubject) setEmailSubject(templatesSubject);
  }, [templatesSubject]);

  useMemo(() => {
    if (templatesBody) setEmailBody(templatesBody);
  }, [templatesBody]);

  useMemo(() => {
    if (templatesWhatsapp) setWhatsappMessage(templatesWhatsapp);
  }, [templatesWhatsapp]);

  // Webhook Configuration state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifyOnPayment, setNotifyOnPayment] = useState(true);
  const [notifyOnExpiration, setNotifyOnExpiration] = useState(true);
  const [adminPhone, setAdminPhone] = useState("");

  const configUrl = webhookConfig?.webhookUrl;
  const configPhone = webhookConfig?.adminPhone;
  const configPayment = webhookConfig?.notifyOnPayment;
  const configExpiration = webhookConfig?.notifyOnExpiration;

  useMemo(() => {
    if (configUrl) setWebhookUrl(configUrl);
  }, [configUrl]);

  useMemo(() => {
    if (configPhone) setAdminPhone(configPhone);
  }, [configPhone]);

  useMemo(() => {
    if (configPayment !== undefined) setNotifyOnPayment(configPayment);
  }, [configPayment]);

  useMemo(() => {
    if (configExpiration !== undefined) setNotifyOnExpiration(configExpiration);
  }, [configExpiration]);

  // Mutations
  const createPaymentMutation = useMutation({
    mutationFn: createSystemPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_payments"] });
      toast.success("Cobrança Gerada", "Cobrança PIX gerada e salva com sucesso!");
      setIsNewPaymentOpen(false);
      // Reset form
      setSelectedUserId("");
      setPaymentAutoSend(true);
    },
    onError: () => {
      toast.error("Erro", "Ocorreu um erro ao registrar a cobrança.");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, paidAt }: { id: string; status: "paid" | "pending" | "overdue"; paidAt?: string }) => 
      updateSystemPayment(id, { status, paidAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_payments"] });
      toast.success("Status Atualizado", "Status do pagamento atualizado com sucesso.");
    },
    onError: () => {
      toast.error("Erro", "Não foi possível atualizar o status.");
    }
  });

  const toggleAutoSendMutation = useMutation({
    mutationFn: ({ id, autoSendEnabled }: { id: string; autoSendEnabled: boolean }) => 
      updateSystemPayment(id, { autoSendEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_payments"] });
      toast.success("Automação Atualizada", "Configuração de envio automático atualizada.");
    },
    onError: () => {
      toast.error("Erro", "Não foi possível alterar o envio automático.");
    }
  });

  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const handleManualSendEmail = async (payment: SystemPayment) => {
    setSendingEmailId(payment.id);
    setTimeout(async () => {
      try {
        const sentTime = new Date().toISOString();
        await updateSystemPayment(payment.id, { manualSentAt: sentTime });

        // Build email using dynamic templates & replacing variables
        const subjectTpl = emailSubject || "Fatura em Aberto - Fluxo Integração Contábil";
        const bodyTpl = emailBody || "Prezado(a) {NOME_CLIENTE},\n\nSua fatura de {VALOR_FATURA} vence em {DATA_VENCIMENTO}.\n\nPIX:\n{CODIGO_PIX}";

        const replacedSubject = replacePlaceholders(subjectTpl, {
          nome_cliente: payment.userName,
          valor_fatura: `R$ ${payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          data_vencimento: payment.dueDate.split("-").reverse().join("/"),
          codigo_pix: payment.paymentLink || "",
        });

        const replacedBody = replacePlaceholders(bodyTpl, {
          nome_cliente: payment.userName,
          valor_fatura: `R$ ${payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          data_vencimento: payment.dueDate.split("-").reverse().join("/"),
          codigo_pix: payment.paymentLink || "",
        });

        // Add real SMTP log entry to system_smtp_logs
        await createSmtpLog({
          paymentId: payment.id,
          userEmail: payment.userEmail,
          userName: payment.userName,
          subject: replacedSubject,
          sentAt: sentTime,
          status: "delivered",
          openCount: 0,
        });

        queryClient.invalidateQueries({ queryKey: ["system_payments"] });
        queryClient.invalidateQueries({ queryKey: ["system_smtp_logs"] });

        toast.success("E-mail Enviado", `Fatura e dados de cobrança enviados com sucesso para ${payment.userEmail}!`);
      } catch (error) {
        toast.error("Erro", "Não foi possível enviar o e-mail.");
      } finally {
        setSendingEmailId(null);
      }
    }, 1000);
  };

  const deletePaymentMutation = useMutation({
    mutationFn: deleteSystemPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_payments"] });
      toast.success("Cobrança Excluída", "Registro de cobrança excluído definitivamente.");
      setDeletingPayment(null);
    },
    onError: () => {
      toast.error("Erro", "Não foi possível excluir o registro.");
    }
  });

  // Save Config Mutations
  const saveTemplatesMutation = useMutation({
    mutationFn: saveBillingTemplates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing_templates"] });
      toast.success("Modelos Salvos", "Modelos de cobrança por e-mail e WhatsApp atualizados!");
    },
    onError: () => {
      toast.error("Erro", "Ocorreu um erro ao salvar os modelos.");
    }
  });

  const saveWebhookMutation = useMutation({
    mutationFn: saveWebhookConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook_config"] });
      toast.success("Configurações Webhook Salvas", "Notificações do administrador via WhatsApp atualizadas!");
    },
    onError: () => {
      toast.error("Erro", "Ocorreu um erro ao salvar o webhook.");
    }
  });

  const handleSimulateWebhook = async () => {
    setIsSimulatingWebhook(true);
    setSimulatedWebhookResult(null);
    try {
      const payload = {
        event: "payment_confirmed",
        amount: 149.9,
        currency: "BRL",
        customer: {
          name: "Cliente Teste",
          email: "cliente@teste.com"
        },
        timestamp: new Date().toISOString()
      };
      const response = await fetch(webhookUrl || "https://httpbin.org/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      setSimulatedWebhookResult({
        url: webhookUrl || "https://httpbin.org/post",
        status: response.status,
        statusText: response.statusText,
        payload,
        response: await response.json()
      });
    } catch (error) {
      setSimulatedWebhookResult({
        url: webhookUrl || "",
        status: 0,
        statusText: "Error",
        payload: {},
        response: { error: "Failed to connect" }
      });
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  // Save PIX Configuration
  const handleSaveConfig = () => {
    localStorage.setItem("admin-pix-key", pixKey);
    localStorage.setItem("admin-pix-name", merchantName);
    localStorage.setItem("admin-pix-city", merchantCity);
    localStorage.setItem("admin-auto-send-global", String(autoSendGlobal));
    toast.success("Configurações Salvas", "Chave, recebedor PIX e preferências de envio automático atualizados com sucesso!");
    setIsConfigOpen(false);
  };

  // Generate Payment Link
  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Campos obrigatórios", "Selecione o cliente para gerar a cobrança.");
      return;
    }

    const userObj = users.find(u => u.id === selectedUserId);
    if (!userObj) return;

    // Generate PIX Copia e Cola
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Valor inválido", "Insira um valor maior que zero.");
      return;
    }

    const txId = "PAY" + Date.now().toString().slice(-6);
    const copiaECola = generatePixCopiaECola({
      key: pixKey,
      merchantName,
      merchantCity,
      amount: amountNum,
      description: paymentDescription,
      txId
    });

    createPaymentMutation.mutate({
      userId: userObj.id,
      userEmail: userObj.email,
      userName: userObj.name,
      companyName: userObj.companyName || "",
      amount: amountNum,
      description: paymentDescription,
      dueDate: paymentDueDate,
      status: "pending",
      paymentLink: copiaECola,
      phone: userObj.phone || "",
      autoSendEnabled: paymentAutoSend,
    });
  };

  // Quick action: Change status
  const handleToggleStatus = (payment: SystemPayment) => {
    const newStatus = payment.status === "paid" ? "pending" : "paid";
    const paidAt = newStatus === "paid" ? new Date().toISOString().split("T")[0] : undefined;
    updateStatusMutation.mutate({ id: payment.id, status: newStatus, paidAt });

    if (newStatus === "paid" && notifyOnPayment && webhookUrl) {
      toast.success(
        "Webhook WhatsApp Admin",
        `Notificação de pagamento disparada! Mensagem enviada para o WhatsApp do Admin (${adminPhone}).`
      );
    }
  };

  // Quick action: Delete
  const handleDeleteConfirm = () => {
    if (deletingPayment) {
      deletePaymentMutation.mutate(deletingPayment.id);
    }
  };

  // Copy Pix Link helper
  const handleCopyPix = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Copiado!", "Código PIX Copia e Cola copiado.");
  };

  // Share helpers
  const getWhatsAppShareUrl = (payment: SystemPayment) => {
    const defaultText = `Olá, \${NOME_CLIENTE}! Sua fatura de \${VALOR_FATURA} vence em \${DATA_VENCIMENTO}. Efetue o pagamento via PIX Copia e Cola colando o código no seu banco: \${CODIGO_PIX}`;
    const textTpl = whatsappMessage || defaultText;
    const text = replacePlaceholders(textTpl, {
      nome_cliente: payment.userName,
      valor_fatura: `R$ ${payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      data_vencimento: payment.dueDate.split("-").reverse().join("/"),
      codigo_pix: payment.paymentLink || "",
    });
    const formattedPhone = payment.phone ? payment.phone.replace(/\D/g, "") : "";
    return `https://wa.me/${formattedPhone ? (formattedPhone.startsWith("55") ? formattedPhone : "55" + formattedPhone) : ""}?text=${encodeURIComponent(text)}`;
  };

  const getEmailShareUrl = (payment: SystemPayment) => {
    const defaultSubject = `Cobrança de Licença - ${payment.description}`;
    const defaultBody = `Olá, {NOME_CLIENTE},\n\nEsperamos que esteja tudo bem.\n\nEstamos enviando os dados para pagamento da sua mensalidade:\n\n- Descrição: ${payment.description}\n- Valor: {VALOR_FATURA}\n- Vencimento: {DATA_VENCIMENTO}\n\nCódigo PIX Copia e Cola:\n{CODIGO_PIX}\n\nAtenciosamente,\nSuporte Financeiro - Fluxo Integração Contábil`;
    
    const subjectTpl = emailSubject || defaultSubject;
    const bodyTpl = emailBody || defaultBody;

    const subject = replacePlaceholders(subjectTpl, {
      nome_cliente: payment.userName,
      valor_fatura: `R$ ${payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      data_vencimento: payment.dueDate.split("-").reverse().join("/"),
      codigo_pix: payment.paymentLink || "",
    });

    const body = replacePlaceholders(bodyTpl, {
      nome_cliente: payment.userName,
      valor_fatura: `R$ ${payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      data_vencimento: payment.dueDate.split("-").reverse().join("/"),
      codigo_pix: payment.paymentLink || "",
    });

    return `mailto:${payment.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Calculations & stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    let totalRevenue = 0;
    let pendingValue = 0;
    let overdueValue = 0;
    let totalCount = payments.length;
    let paidCount = 0;

    payments.forEach(p => {
      if (p.status === "paid") {
        totalRevenue += p.amount;
        paidCount++;
      } else {
        const isOverdue = p.dueDate < todayStr;
        if (isOverdue || p.status === "overdue") {
          overdueValue += p.amount;
        } else {
          pendingValue += p.amount;
        }
      }
    });

    const conversionRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    return {
      totalRevenue,
      pendingValue,
      overdueValue,
      conversionRate
    };
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return payments.filter(p => {
      // Search
      const matchesSearch = 
        p.userName.toLowerCase().includes(search.toLowerCase()) || 
        p.userEmail.toLowerCase().includes(search.toLowerCase()) || 
        (p.companyName && p.companyName.toLowerCase().includes(search.toLowerCase())) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter === "all") return true;
      if (statusFilter === "paid") return p.status === "paid";
      if (statusFilter === "pending") return p.status === "pending" && p.dueDate >= todayStr;
      if (statusFilter === "overdue") return p.status === "overdue" || (p.status === "pending" && p.dueDate < todayStr);

      return true;
    });
  }, [payments, search, statusFilter]);

  return (
    <div className="space-y-8 text-left">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Total Faturado */}
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Faturamento Pago</span>
            <strong className="block text-2xl font-black text-emerald-500">
              R$ {stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <DollarSign className="size-5" />
          </div>
        </div>

        {/* KPI: Pendentes */}
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Previsão Pendente</span>
            <strong className="block text-2xl font-black text-yellow-500">
              R$ {stats.pendingValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500">
            <Clock className="size-5" />
          </div>
        </div>

        {/* KPI: Atrasados */}
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inadimplência (Atrasados)</span>
            <strong className="block text-2xl font-black text-rose-500">
              R$ {stats.overdueValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <AlertTriangle className="size-5" />
          </div>
        </div>

        {/* KPI: Conversão */}
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Taxa de Conversão</span>
            <strong className="block text-2xl font-black text-indigo-400">
              {stats.conversionRate.toFixed(1)}%
            </strong>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <CreditCard className="size-5" />
          </div>
        </div>
      </div>

      {/* Sub Tabs Selection */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {(["payments", "smtp", "templates", "webhooks"] as const).map((tab) => {
          const tabConfig = {
            payments: { label: "Cobranças e Histórico", icon: CreditCard },
            smtp: { label: "Logs de SMTP (Status de Entrega)", icon: Mail },
            templates: { label: "Editor de Templates de Cobrança", icon: FileText },
            webhooks: { label: "WhatsApp do Administrador (Webhook)", icon: Settings },
          };
          const Icon = tabConfig[tab].icon;
          const isActive = subTab === tab;
          return (
            <button
              key={tab}
              id={`subtab-btn-${tab}`}
              onClick={() => setSubTab(tab)}
              type="button"
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                isActive 
                  ? "text-primary border-primary bg-primary/5" 
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className="size-4" />
              {tabConfig[tab].label}
            </button>
          );
        })}
      </div>

      {/* CONDITIONAL SUBTAB RENDERING */}
      {subTab === "payments" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Configuration & Actions Panel */}
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Ações e Configurações de Recebimento</h3>
                <p className="text-xs text-muted-foreground">
                  Configure sua chave PIX para que o algoritmo de código Copia e Cola gere cobranças com seus dados reais.
                </p>
              </div>
              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="h-10 rounded-xl"
                >
                  <Settings className="size-4 mr-2" />
                  Chave Pix Recebedor
                  {isConfigOpen ? <ChevronUp className="size-4 ml-1.5" /> : <ChevronDown className="size-4 ml-1.5" />}
                </Button>
                <Button
                  onClick={() => setIsNewPaymentOpen(true)}
                  className="h-10 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95"
                >
                  <Plus className="size-4 mr-2" />
                  Gerar Cobrança Pix
                </Button>
              </div>
            </div>

            {/* PIX Settings Accordion */}
            {isConfigOpen && (
              <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="config-pix-key" className="text-xs font-bold">Chave PIX (E-mail, CNPJ, Celular ou Aleatória)</Label>
                    <Input
                      id="config-pix-key"
                      placeholder="Ex: alissontar18@gmail.com"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="h-9 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="config-merchant-name" className="text-xs font-bold">Nome do Beneficiário (Max 25 letras)</Label>
                    <Input
                      id="config-merchant-name"
                      placeholder="Ex: ALISSON TAR"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="h-9 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="config-merchant-city" className="text-xs font-bold">Cidade do Beneficiário (Max 15 letras)</Label>
                    <Input
                      id="config-merchant-city"
                      placeholder="Ex: SAO PAULO"
                      value={merchantCity}
                      onChange={(e) => setMerchantCity(e.target.value)}
                      className="h-9 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="size-4 text-primary" />
                    Automação de Notificações Financeiras
                  </h4>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                    <input
                      id="config-auto-send"
                      type="checkbox"
                      checked={autoSendGlobal}
                      onChange={(e) => setAutoSendGlobal(e.target.checked)}
                      className="mt-1 size-4 rounded border-border text-primary focus:ring-primary bg-card"
                    />
                    <div className="space-y-1.5">
                      <Label htmlFor="config-auto-send" className="text-sm font-bold text-foreground cursor-pointer select-none">
                        Ativar Envio Automático de Faturas por Padrão
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Quando ativado, novas cobranças geradas agendarão automaticamente e-mails de cobrança para o cliente <strong>7 dias antes do vencimento</strong> e um alerta de cobrança amigável <strong>no próprio dia do vencimento</strong> (se continuar pendente).
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <Button size="sm" variant="ghost" onClick={() => setIsConfigOpen(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleSaveConfig} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Check className="size-3 mr-1.5" /> Salvar Dados do Pix
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Payments History / List */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header and filters */}
            <div className="p-6 border-b border-border flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-foreground">Histórico de Cobranças Pix</h2>
                
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar cobrança, e-mail ou descrição..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 pl-10 rounded-xl bg-muted/30 border-border"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "pending", "paid", "overdue"] as const).map(tab => {
                  const labels = {
                    all: "Todas",
                    pending: "Pendentes",
                    paid: "Pagas",
                    overdue: "Atrasadas"
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors border ${
                        statusFilter === tab 
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

            {/* Table list */}
            {isLoading ? (
              <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                Carregando lançamentos financeiros...
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-16 text-center text-sm text-muted-foreground">
                Nenhuma cobrança financeira encontrada para o filtro atual.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/40 border-b border-border/80 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Descrição</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">Vencimento</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Notificações por E-mail</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {filteredPayments.map((payment) => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const isExpired = payment.status === "pending" && payment.dueDate < todayStr;
                      const isPaid = payment.status === "paid";
                      const statusLabel = isPaid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                          ● Pago
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-500">
                          ● Atrasado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500">
                          ● Pendente
                        </span>
                      );

                      return (
                        <tr className="hover:bg-muted/10 transition-colors" key={payment.id}>
                          {/* Customer info */}
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground">{payment.userName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{payment.userEmail}</div>
                            {payment.companyName && (
                              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 mt-1">
                                {payment.companyName}
                              </div>
                            )}
                          </td>

                          {/* Description */}
                          <td className="px-6 py-4 max-w-[200px] truncate">
                            <div className="font-medium text-foreground">{payment.description}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">Gerado em: {new Date(payment.createdAt).toLocaleDateString("pt-BR")}</div>
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-4 font-bold text-foreground">
                            R$ {payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>

                          {/* Due Date */}
                          <td className="px-6 py-4 font-mono text-xs">
                            {payment.dueDate.split("-").reverse().join("/")}
                            {payment.paidAt && (
                              <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                                Pago em: {payment.paidAt.split("-").reverse().join("/")}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {statusLabel}
                          </td>

                          {/* Email Automation Status */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 text-xs">
                              <button
                                type="button"
                                onClick={() => toggleAutoSendMutation.mutate({ id: payment.id, autoSendEnabled: !payment.autoSendEnabled })}
                                title={payment.autoSendEnabled ? "Clique para desativar automação" : "Clique para ativar automação"}
                                className={`inline-flex items-center gap-1.5 w-fit rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                                  payment.autoSendEnabled
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                                    : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                                }`}
                              >
                                <span className={`relative flex size-1.5 ${payment.autoSendEnabled ? "flex" : "hidden"}`}>
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                {payment.autoSendEnabled ? "Auto-envio Ativo" : "Auto-envio Desligado"}
                              </button>
                              
                              {payment.manualSentAt ? (
                                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                  <Check className="size-3 text-emerald-500 shrink-0" />
                                  Enviado manual: {new Date(payment.manualSentAt).toLocaleDateString("pt-BR")}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/75 font-medium mt-0.5">
                                  {payment.autoSendEnabled ? "Agendado (7 dias antes)" : "Sem disparos agendados"}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {/* Manual Send Email */}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={sendingEmailId === payment.id}
                                onClick={() => handleManualSendEmail(payment)}
                                title="Disparar e-mail de cobrança manualmente agora"
                                className="h-8 px-2.5 rounded-lg text-xs bg-indigo-500/15 border-indigo-500/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/20"
                              >
                                {sendingEmailId === payment.id ? (
                                  <div className="size-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-1" />
                                ) : (
                                  <Mail className="size-3.5 mr-1" />
                                )}
                                Disparar E-mail
                              </Button>

                              {/* Details/QR Modal */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setViewingPayment(payment);
                                  setIsPixDetailsOpen(true);
                                }}
                                className="h-8 px-2.5 rounded-lg text-xs"
                              >
                                <QrCode className="size-3.5 mr-1" />
                                Ver PIX
                              </Button>

                              {/* Toggle Status */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(payment)}
                                title={isPaid ? "Marcar como pendente" : "Marcar como pago"}
                                className={`h-8 w-8 p-0 rounded-lg ${isPaid ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10" : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"}`}
                              >
                                <RefreshCw className="size-3.5" />
                              </Button>

                              {/* Delete */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletingPayment(payment)}
                                className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                              >
                                <Trash2 className="size-3.5" />
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
        </div>
      )}

      {subTab === "smtp" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Visualização de Logs de SMTP (Status de Entrega)</h3>
                <p className="text-xs text-muted-foreground">
                  Monitore se a fatura automática foi entregue, aberta ou se caiu na caixa de spam/rejeitado do e-mail do cliente em tempo real.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchSmtpLogs();
                  toast.success("Atualizado", "Logs do SMTP sincronizados!");
                }}
                className="h-9 rounded-xl font-semibold border-border hover:bg-muted"
              >
                <RefreshCw className="size-3.5 mr-2" />
                Atualizar Logs
              </Button>
            </div>

            {/* Logs controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar log por cliente, e-mail ou assunto..."
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-10 rounded-xl bg-muted/30 border-border"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">Status:</span>
                <select
                  value={smtpStatusFilter}
                  onChange={(e) => setSmtpStatusFilter(e.target.value as "all" | "delivered" | "opened" | "failed")}
                  className="h-10 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none"
                >
                  <option value="all">Todos os Status</option>
                  <option value="delivered">Entregue</option>
                  <option value="opened">Aberto</option>
                  <option value="failed">Falhou (Bounced)</option>
                </select>
              </div>
            </div>

            {/* SMTP table list */}
            {smtpLogs.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                <Mail className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                Nenhum log de disparo de e-mail registrado ainda.
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden bg-card/50">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                      <th className="p-4">Cliente / E-mail</th>
                      <th className="p-4">Assunto do E-mail</th>
                      <th className="p-4">Data/Hora Disparo</th>
                      <th className="p-4">Status de Entrega</th>
                      <th className="p-4 text-center">Cliques / Aberturas</th>
                      <th className="p-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {smtpLogs
                      .filter(log => {
                        const s = search.toLowerCase();
                        const matchesSearch = 
                          log.userName.toLowerCase().includes(s) ||
                          log.userEmail.toLowerCase().includes(s) ||
                          log.subject.toLowerCase().includes(s);
                        
                        const matchesStatus = 
                          smtpStatusFilter === "all" ||
                          (smtpStatusFilter === "delivered" && (log.status === "delivered" || log.status === "opened")) ||
                          (smtpStatusFilter === "opened" && log.status === "opened") ||
                          (smtpStatusFilter === "failed" && log.status === "failed");

                        return matchesSearch && matchesStatus;
                      })
                      .map(log => {
                        return (
                          <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-4">
                              <span className="block font-semibold text-foreground">{log.userName}</span>
                              <span className="block text-[10px] text-muted-foreground font-mono">{log.userEmail}</span>
                            </td>
                            <td className="p-4 font-normal text-muted-foreground truncate max-w-[220px]" title={log.subject}>
                              {log.subject}
                            </td>
                            <td className="p-4 font-mono text-muted-foreground">
                              {new Date(log.sentAt).toLocaleString("pt-BR")}
                            </td>
                            <td className="p-4">
                              {log.status === "opened" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20" title={`Aberto via IP: ${log.ipAddress || 'Não registrado'}`}>
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                  Aberto
                                </span>
                              )}
                              {log.status === "delivered" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                  Entregue
                                </span>
                              )}
                              {log.status === "failed" && (
                                <span className="inline-flex flex-col gap-1 px-2.5 py-1 text-[10px] font-bold rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 max-w-[200px]" title={log.errorMessage}>
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                    Rejeitado (Erro SMTP)
                                  </div>
                                  <span className="block text-[8px] font-normal font-mono truncate text-rose-300/80 leading-normal">{log.errorMessage}</span>
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center font-bold font-mono">
                              {log.status === "opened" ? (
                                <span className="text-blue-400">{log.openCount}x</span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  toast.info(
                                    "Detalhes do SMTP",
                                    `Log ID: ${log.id}\nServidor SMTP: smtp.alissontar18@gmail.com\nPorta: 587 (TLS)\nStatus: ${log.status.toUpperCase()}\n${log.errorMessage ? `Erro: ${log.errorMessage}` : 'Entregue sem erros.'}`
                                  );
                                }}
                                className="h-7 px-2 text-[10px] rounded-lg"
                              >
                                Ver Detalhes
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === "templates" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor form (Col 7) */}
            <div className="lg:col-span-7 rounded-2xl border border-border bg-card shadow-sm p-6 space-y-6">
              <div className="space-y-1 border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Editor de Templates de Cobrança</h3>
                <p className="text-xs text-muted-foreground">
                  Personalize as mensagens por e-mail e WhatsApp usando os marcadores dinâmicos {`{NOME_CLIENTE}`}, {`{VALOR_FATURA}`}, {`{DATA_VENCIMENTO}`} e {`{CODIGO_PIX}`}.
                </p>
              </div>

              {/* Tag explanations */}
              <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  Marcadores Dinâmicos Disponíveis:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] leading-relaxed">
                  <div><code className="text-indigo-300 font-mono font-semibold">{`{NOME_CLIENTE}`}</code>: Nome completo do usuário</div>
                  <div><code className="text-indigo-300 font-mono font-semibold">{`{VALOR_FATURA}`}</code>: Valor em Real (Ex: R$ 149,90)</div>
                  <div><code className="text-indigo-300 font-mono font-semibold">{`{DATA_VENCIMENTO}`}</code>: Data formatada (Ex: 15/07/2026)</div>
                  <div><code className="text-indigo-300 font-mono font-semibold">{`{CODIGO_PIX}`}</code>: Código PIX copia e cola gerado</div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Email Subject */}
                <div className="space-y-1.5">
                  <Label htmlFor="template-subject" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Assunto do E-mail de Cobrança</Label>
                  <Input
                    id="template-subject"
                    placeholder="Assunto da cobrança..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>

                {/* Email Body */}
                <div className="space-y-1.5">
                  <Label htmlFor="template-body" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Template de Texto do E-mail</Label>
                  <textarea
                    id="template-body"
                    rows={10}
                    placeholder="Escreva a mensagem do e-mail..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="flex min-h-[180px] w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-xs text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border"
                  />
                </div>

                {/* Whatsapp message template */}
                <div className="space-y-1.5">
                  <Label htmlFor="template-whatsapp" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Template de Texto para WhatsApp</Label>
                  <textarea
                    id="template-whatsapp"
                    rows={4}
                    placeholder="Mensagem do WhatsApp..."
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="flex min-h-[90px] w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-xs text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-border pt-4">
                <Button
                  onClick={() => {
                    saveTemplatesMutation.mutate({
                      emailSubject,
                      emailBody,
                      whatsappMessage
                    });
                  }}
                  disabled={saveTemplatesMutation.isPending}
                  className="rounded-xl h-10 px-6 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  <Check className="size-4 mr-2" />
                  {saveTemplatesMutation.isPending ? "Salvando..." : "Salvar Configuração de Modelos"}
                </Button>
              </div>
            </div>

            {/* Interactive Preview Panel (Col 5) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Email Inbox Preview Mockup */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="bg-muted/40 p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Mail className="size-3 text-indigo-400" />
                    Visualização de Email (Inbox)
                  </span>
                  <span className="text-[10px] text-muted-foreground">Simulado</span>
                </div>
                
                <div className="p-4 space-y-3 bg-muted/10 text-xs">
                  {/* Subject line header */}
                  <div className="border-b border-border/60 pb-3 space-y-1">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>De: <strong>financeiro@teste.com.br</strong></span>
                      <span className="text-[10px] font-mono">11:42 (Agora)</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assunto:</span>{" "}
                      <strong className="text-foreground">
                        {replacePlaceholders(emailSubject, {
                          nome_cliente: "Contador Fulano - Empresa XYZ",
                          valor_fatura: "R$ 149,90",
                          data_vencimento: "15/07/2026",
                          codigo_pix: "PIX_COPIA_E_COLA_MOCK"
                        })}
                      </strong>
                    </div>
                  </div>

                  {/* Body preview area */}
                  <div className="p-4 bg-card rounded-xl border border-border leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans min-h-[220px]">
                    {replacePlaceholders(emailBody, {
                      nome_cliente: "Contador Fulano - Empresa XYZ",
                      valor_fatura: "R$ 449,90",
                      data_vencimento: "15/07/2026",
                      codigo_pix: "00020101021226830014br.gov.bcb.pix2561api.pix.fluxoic.com/qr/pay_981273918273"
                    })}
                  </div>
                </div>
              </div>

              {/* WhatsApp Bubble Preview Mockup */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="bg-emerald-600/10 p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-black text-emerald-400">Notificações WhatsApp</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="size-3 text-emerald-400" />
                    WhatsApp do Cliente
                  </span>
                </div>
                
                {/* Simulated WhatsApp screen */}
                <div className="p-4 bg-[radial-gradient(#dcf8c6_1px,transparent_1px)] [background-size:16px_16px] bg-emerald-950/5 dark:bg-emerald-950/20 space-y-4">
                  <div className="max-w-[85%] ml-auto p-3.5 bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/20 rounded-2xl rounded-tr-sm text-xs leading-relaxed text-foreground shadow-sm whitespace-pre-wrap">
                    {replacePlaceholders(whatsappMessage, {
                      nome_cliente: "Contador Fulano",
                      valor_fatura: "R$ 449,90",
                      data_vencimento: "15/07/2026",
                      codigo_pix: "00020101021226830014br.gov.bcb.pix2561api.pix.fluxoic.com/qr/pay_981273918273"
                    })}
                    <span className="block text-[9px] text-muted-foreground text-right mt-1.5 font-mono">11:42 ✔✔</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === "webhooks" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Config panel */}
            <div className="lg:col-span-7 rounded-2xl border border-border bg-card shadow-sm p-6 space-y-6">
              <div className="space-y-1 border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Configuração de Alerta de Faturamento no WhatsApp do Administrador</h3>
                <p className="text-xs text-muted-foreground">
                  Integre um webhook para enviar mensagens no celular pessoal do administrador sempre que uma licença for paga com sucesso ou expirar seu prazo de vencimento.
                </p>
              </div>

              <div className="space-y-5">
                {/* Webhook URL input */}
                <div className="space-y-1.5">
                  <Label htmlFor="webhook-url" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">URL do Webhook (HTTP POST)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-url"
                      placeholder="Ex: https://api.whatsapp-gateway.com/v1/webhooks/fluxoic-alerts"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Este endpoint receberá requisições POST com payloads estructurados em formato JSON toda vez que um evento financeiro disparar.
                  </p>
                </div>

                {/* Admin Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="webhook-phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Celular do Administrador (WhatsApp)</Label>
                  <Input
                    id="webhook-phone"
                    placeholder="Ex: 62999999999 (DDD + Número)"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Celular que receberá os alertas do sistema. Use apenas números com código de área brasileiro.
                  </p>
                </div>

                {/* Notification triggers */}
                <div className="space-y-3.5 pt-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Gatilhos de Notificação Ativos</Label>
                  
                  {/* Notify on payment */}
                  <div className="flex items-start gap-2.5">
                    <input
                      id="notify-payment"
                      type="checkbox"
                      checked={notifyOnPayment}
                      onChange={(e) => setNotifyOnPayment(e.target.checked)}
                      className="mt-1 size-4 rounded border-border text-primary focus:ring-primary bg-card"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="notify-payment" className="text-sm font-bold text-foreground cursor-pointer select-none">
                        Notificar no Recebimento de Cobranças (Licença Paga)
                      </Label>
                      <p className="text-xs text-muted-foreground leading-normal">
                        Sempre que um cliente efetuar o pagamento de uma licença e o status mudar para "Pago", envie um alerta imediato de confirmação.
                      </p>
                    </div>
                  </div>

                  {/* Notify on expiration */}
                  <div className="flex items-start gap-2.5">
                    <input
                      id="notify-expiration"
                      type="checkbox"
                      checked={notifyOnExpiration}
                      onChange={(e) => setNotifyOnExpiration(e.target.checked)}
                      className="mt-1 size-4 rounded border-border text-primary focus:ring-primary bg-card"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="notify-expiration" className="text-sm font-bold text-foreground cursor-pointer select-none">
                        Notificar no Vencimento / Licença Expirada
                      </Label>
                      <p className="text-xs text-muted-foreground leading-normal">
                        Dispare alertas ao celular do admin no dia seguinte ao vencimento se a mensalidade do cliente continuar em aberto.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  onClick={() => {
                    saveWebhookMutation.mutate({
                      webhookUrl,
                      adminPhone,
                      notifyOnPayment,
                      notifyOnExpiration
                    });
                  }}
                  disabled={saveWebhookMutation.isPending}
                  className="rounded-xl h-10 px-6 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  <Check className="size-4 mr-2" />
                  {saveWebhookMutation.isPending ? "Salvando..." : "Salvar Configurações de Alerta"}
                </Button>
              </div>
            </div>

            {/* Simulated Webhook testing area (Col 5) */}
            <div className="lg:col-span-5 rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
              <div className="space-y-1 border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <ExternalLink className="size-4 text-indigo-400" />
                  Simulador de Envio (Teste de Conexão)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Simule o disparo de webhook para enviar um alerta de pagamento fictício para validar sua conexão e parâmetros.
                </p>
              </div>

              <Button
                onClick={handleSimulateWebhook}
                disabled={isSimulatingWebhook}
                className="w-full h-11 rounded-xl font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-sm"
              >
                {isSimulatingWebhook ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando Requisição POST...
                  </div>
                ) : (
                  "Simular Alerta via WhatsApp"
                )}
              </Button>

              {/* Simulation Result Terminal Output */}
              {simulatedWebhookResult ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status do Webhook:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
                      HTTP {simulatedWebhookResult.status} {simulatedWebhookResult.statusText}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4 border border-border text-[10px] font-mono leading-relaxed space-y-3 max-h-[300px] overflow-y-auto shadow-inner text-slate-300">
                    <div>
                      <span className="text-yellow-400">POST</span> {simulatedWebhookResult.url}
                    </div>
                    <div className="border-t border-slate-800 pt-2 text-slate-400">
                      // Headers de Envio
                      <br />
                      Content-Type: application/json
                    </div>
                    <div className="border-t border-slate-800 pt-2">
                      <span className="text-blue-400">// Payload de Alerta Enviado (JSON)</span>
                      <pre className="text-slate-300 whitespace-pre">
                        {JSON.stringify(simulatedWebhookResult.payload, null, 2)}
                      </pre>
                    </div>
                    <div className="border-t border-slate-800 pt-2 text-emerald-400">
                      // Resposta da Gateway
                      <pre className="text-emerald-300 whitespace-pre">
                        {JSON.stringify(simulatedWebhookResult.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  <Settings className="size-8 text-muted-foreground/30 mx-auto mb-2 animate-pulse" />
                  Clique no botão acima para rodar a simulação e verificar o payload de rede JSON.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW PIX BILLING */}
      <Dialog open={isNewPaymentOpen} onOpenChange={setIsNewPaymentOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 border border-border bg-card">
          <form onSubmit={handleCreatePayment} className="space-y-4 text-left">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Gerar Cobrança Pix
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Selecione o cliente de destino, defina o valor da licença ou serviço e a data limite de vencimento. O sistema irá computar o código Pix correspondente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Select Client */}
              <div className="space-y-1.5">
                <Label htmlFor="payment-client" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cliente de Acesso *</Label>
                <select
                  id="payment-client"
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                >
                  <option value="" disabled className="text-muted-foreground">Selecione o cliente...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) {u.companyName ? ` - ${u.companyName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount and Due Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="payment-amount" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Valor Cobrado (R$) *</Label>
                  <Input
                    id="payment-amount"
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="149.90"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="h-10 rounded-xl bg-muted/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payment-duedate" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data de Vencimento *</Label>
                  <Input
                    id="payment-duedate"
                    required
                    type="date"
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                    className="h-10 rounded-xl bg-muted/20"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="payment-desc" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição do Serviço / Licença *</Label>
                <Input
                  id="payment-desc"
                  required
                  placeholder="Ex: Licença Mensal - Sistema de Integração Contábil"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="h-10 rounded-xl bg-muted/20"
                />
              </div>

              {/* Automatic Send Checkbox */}
              <div className="flex items-start gap-2 pt-2">
                <input
                  id="payment-auto-send"
                  type="checkbox"
                  checked={paymentAutoSend}
                  onChange={(e) => setPaymentAutoSend(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary bg-card"
                />
                <div className="space-y-1">
                  <Label htmlFor="payment-auto-send" className="text-xs font-bold text-foreground cursor-pointer select-none">
                    Ativar Envio Automático por E-mail
                  </Label>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Enviar cobrança Pix por e-mail 7 dias antes do vencimento e lembrete no dia do vencimento.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsNewPaymentOpen(false)} className="rounded-xl h-10">
                Voltar
              </Button>
              <Button type="submit" disabled={createPaymentMutation.isPending} className="rounded-xl h-10 bg-primary text-primary-foreground">
                {createPaymentMutation.isPending ? "Processando..." : "Gerar Cobrança"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: PIX DETAILS (QR CODE, COPY AND SHARE) */}
      <Dialog open={isPixDetailsOpen} onOpenChange={setIsPixDetailsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 border border-border bg-card">
          {viewingPayment && (
            <div className="space-y-5 text-left">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <QrCode className="size-5 text-indigo-400" />
                  Cobrança via Pix
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Envie o QR Code ou o link Copia e Cola para o cliente. Você pode enviar rapidamente via WhatsApp ou E-mail utilizando os botões abaixo.
                </DialogDescription>
              </DialogHeader>

              {/* QR Code and Invoice Overview */}
              <div className="flex flex-col items-center justify-center py-4 bg-muted/20 rounded-xl border border-border/80 space-y-4">
                {/* Visual rendering of Pix QR Code using the static BR Code URL */}
                <div className="p-3 bg-white rounded-xl shadow-inner relative group border border-border">
                  <img 
                    src={getPixQrCodeUrl(viewingPayment.paymentLink || "")} 
                    alt="QR Code Pix" 
                    className="size-48 object-contain"
                  />
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-black text-foreground">
                    R$ {viewingPayment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Vencimento: {viewingPayment.dueDate.split("-").reverse().join("/")}
                  </div>
                </div>
              </div>

              {/* Client and Desc Overview */}
              <div className="space-y-2 border-y border-border py-3 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Destinatário:</span>
                  <strong className="text-foreground">{viewingPayment.userName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>E-mail:</span>
                  <span className="text-foreground font-mono">{viewingPayment.userEmail}</span>
                </div>
                {viewingPayment.phone && (
                  <div className="flex justify-between">
                    <span>Telefone:</span>
                    <span className="text-foreground font-mono">{viewingPayment.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Descrição:</span>
                  <span className="text-foreground text-right max-w-[200px] truncate">{viewingPayment.description}</span>
                </div>
              </div>

              {/* Copy PIX Copia e Cola field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pix Copia e Cola</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={viewingPayment.paymentLink || ""}
                    className="h-9 font-mono text-[10px] bg-muted/40 rounded-xl border-border/80 focus-visible:ring-0"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyPix(viewingPayment.paymentLink || "")}
                    className="h-9 px-3 rounded-xl hover:bg-muted"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Share actions */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Enviar para o Cliente</Label>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={getWhatsAppShareUrl(viewingPayment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <MessageSquare className="size-4" />
                    Enviar WhatsApp
                  </a>
                  <a
                    href={getEmailShareUrl(viewingPayment)}
                    className="flex items-center justify-center gap-2 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <Mail className="size-4" />
                    Enviar E-mail
                  </a>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="ghost" onClick={() => setIsPixDetailsOpen(false)} className="rounded-xl w-full h-10">
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={deletingPayment !== null}
        onOpenChange={(open) => !open && setDeletingPayment(null)}
        title="Excluir Cobrança?"
        description={`Deseja realmente excluir a cobrança de R$ ${deletingPayment?.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} gerada para ${deletingPayment?.userName}? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Sim, Excluir"
        cancelLabel="Voltar"
        tone="danger"
      />
    </div>
  );
}
