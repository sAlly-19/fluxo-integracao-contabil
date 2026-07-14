"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "../components/Topbar";
import { AppIcon, PageHeader, PageShell, StatusPill } from "../components/design-system";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useAuth } from "../components/AuthContext";
import { getTickets, createTicket, getMessages, sendMessage, closeTicket, SupportTicket } from "../lib/api/support";
import { useToast } from "../components/ToastContext";
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Search, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  MessageCircle, 
  HelpCircle, 
  Check, 
  ArrowLeft,
  X 
} from "lucide-react";

export default function SupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [newSubjectCategory, setNewSubjectCategory] = useState("Problema de Mapeamento De/Para");
  const [newSubjectDetails, setNewSubjectDetails] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [isOpeningForm, setIsOpeningForm] = useState(false);

  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ["support_tickets", user?.email, user?.role],
    queryFn: () => getTickets(user?.email, user?.role),
    enabled: !!user,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["support_messages", activeTicket?.id],
    queryFn: () => getMessages(activeTicket!.id),
    enabled: !!activeTicket,
  });

  const createTicketMutation = useMutation({
    mutationFn: (subject: string) =>
      createTicket({
        userId: user!.email,
        userEmail: user!.email,
        userName: user!.name,
        subject,
        status: "open",
        createdAt: new Date().toISOString(),
      }),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["support_tickets"] });
      setNewSubjectDetails("");
      setIsOpeningForm(false);
      setActiveTicket(ticket);
      toast.success("Chamado aberto", "Seu chamado foi criado e um consultor já está analisando.");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      sendMessage({
        ticketId: activeTicket!.id,
        senderId: user!.email,
        senderName: user!.name,
        senderRole: user!.role === "admin" ? "admin" : "user",
        content,
        createdAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support_messages", activeTicket?.id] });
      setNewMessage("");
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: (id: string) => closeTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support_tickets"] });
      toast.success("Chamado concluído", "O chamado foi encerrado com sucesso.");
      setActiveTicket(null);
    }
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = `${newSubjectCategory}: ${newSubjectDetails.trim()}`;
    if (!newSubjectDetails.trim()) return;
    createTicketMutation.mutate(finalSubject);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket) return;
    sendMessageMutation.mutate(newMessage);
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = 
        ticket.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        ticket.userName.toLowerCase().includes(ticketSearch.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tickets, ticketSearch, statusFilter]);

  return (
    <div className="min-h-screen bg-muted/30 text-foreground selection:bg-primary/20 selection:text-primary">
      <Topbar />
      
      <PageShell className="relative pb-12">
      
      {/* Background aesthetics */}
      <div className="absolute top-0 right-0 -z-10 size-[32rem] rounded-full bg-primary/5 blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 size-[32rem] rounded-full bg-indigo-500/5 blur-[128px] pointer-events-none" />

      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader 
          badge="Suporte Contábil • Atendimento"
          title="Central de Suporte" 
          description={
            <span className="text-muted-foreground font-medium">
              Esclareça dúvidas sobre De/Para, faturamento ou reporte inconsistências de arquivos diretamente com nossa equipe técnica de contadores.
            </span>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
          {/* LEFT PANEL: Tickets List & Alternate Support Channels */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/40 px-5 py-4 flex flex-row items-center justify-between border-b border-border/50">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-bold text-foreground">Meus Chamados</CardTitle>
                  <CardDescription className="text-xs">Consulte ou gerencie seus chamados</CardDescription>
                </div>
                {!isOpeningForm && user?.role !== "admin" && (
                  <Button 
                    onClick={() => setIsOpeningForm(true)} 
                    size="sm" 
                    className="h-8 rounded-lg text-xs font-bold bg-primary hover:bg-primary/95 gap-1"
                  >
                    <Plus className="size-3 shrink-0" />
                    Novo
                  </Button>
                )}
              </CardHeader>

              {/* Search and Category Filters */}
              <div className="p-4 border-b border-border/50 bg-muted/10 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar chamados..." 
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="pl-9 h-9 rounded-xl bg-background/50 text-xs border-border"
                  />
                </div>
                
                {/* Status Toggle buttons */}
                <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === "all" 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("open")}
                    className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === "open" 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Abertos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("closed")}
                    className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === "closed" 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Fechados
                  </button>
                </div>
              </div>

              {/* Tickets List Body */}
              <div className="divide-y divide-border/60 max-h-[340px] overflow-y-auto bg-card/40">
                {isLoadingTickets ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Carregando atendimentos...
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Nenhum chamado localizado nesta categoria.
                  </div>
                ) : (
                  filteredTickets.map(ticket => {
                    const isSelected = activeTicket?.id === ticket.id;
                    const isOpen = ticket.status === "open";
                    return (
                      <div 
                        key={ticket.id}
                        onClick={() => {
                          setIsOpeningForm(false);
                          setActiveTicket(ticket);
                        }}
                        className={`p-4 cursor-pointer transition-all border-l-4 text-xs space-y-2 ${
                          isSelected 
                            ? "bg-primary/[0.03] border-primary" 
                            : "hover:bg-muted/30 border-transparent"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className={`font-bold line-clamp-1 flex-1 ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {ticket.subject}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                            isOpen 
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                              : "bg-muted text-muted-foreground border-border"
                          }`}>
                            <span className={`size-1.5 rounded-full ${isOpen ? "bg-amber-500 animate-pulse" : "bg-muted-foreground"}`} />
                            {isOpen ? "Aberto" : "Concluído"}
                          </span>
                        </div>
                        {user?.role === "admin" && (
                          <div className="text-[10px] text-muted-foreground font-semibold">
                            Empresa: {ticket.userName}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 font-mono">
                          <span>ID: #{ticket.id.slice(-6)}</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Offline/Direct Contacts Help desk */}
            <Card className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 shadow-sm p-4 space-y-3.5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="size-4 text-indigo-400" />
                Contatos Diretos
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Prefere falar por telefone ou precisa de suporte contábil presencial urgente?
              </p>
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-foreground">(62) 99858-0032</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-foreground">alissontar18@gmail.com</span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-foreground">Segunda a Sexta</span>
                    <span className="block text-[10px] text-muted-foreground/80">08:00 às 18:00 (Fuso Brasília)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT PANEL: Dynamic Opening Form / Active Chat Workspace */}
          <div className="lg:col-span-8">
            {isOpeningForm ? (
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                <CardHeader className="bg-muted/40 p-5 border-b border-border/50 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-foreground">Criar Novo Chamado de Suporte</CardTitle>
                    <CardDescription className="text-xs">Selecione uma categoria para agilizar o atendimento</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpeningForm(false)}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <X className="size-4" />
                  </Button>
                </CardHeader>
                <form onSubmit={handleCreateTicket}>
                  <CardContent className="p-6 space-y-4">
                    {/* Category Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Categoria do Problema</label>
                      <select
                        value={newSubjectCategory}
                        onChange={(e) => setNewSubjectCategory(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-muted/20 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="Dúvida de Conciliação (De/Para)">Dúvida de Conciliação (De/Para)</option>
                        <option value="Erro na Importação de OFX/PDF">Erro na Importação de OFX/PDF</option>
                        <option value="Inconsistência de Faturamento">Inconsistência de Faturamento</option>
                        <option value="Melhorias ou Erro de Sistema">Melhorias ou Erro de Sistema</option>
                        <option value="Outros Assuntos">Outros Assuntos</option>
                      </select>
                    </div>

                    {/* Details input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Detalhes do Chamado</label>
                      <textarea
                        rows={5}
                        placeholder="Descreva o que está acontecendo detalhadamente (por exemplo: 'O extrato do banco Itaú não está carregando o complemento de data correto...')"
                        value={newSubjectDetails}
                        onChange={(e) => setNewSubjectDetails(e.target.value)}
                        className="flex min-h-[120px] w-full rounded-xl border border-input bg-muted/10 px-3 py-2.5 text-xs text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 border-border"
                        required
                      />
                    </div>
                  </CardContent>
                  <div className="bg-muted/20 px-6 py-4 border-t border-border/50 flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsOpeningForm(false)}
                      className="rounded-xl h-9 text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={!newSubjectDetails.trim() || createTicketMutation.isPending}
                      className="rounded-xl h-9 text-xs font-bold bg-primary hover:bg-primary/95"
                    >
                      {createTicketMutation.isPending ? "Abrindo..." : "Abrir Chamado Agora"}
                    </Button>
                  </div>
                </form>
              </Card>
            ) : activeTicket ? (
              /* Chat view */
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-[550px] animate-in fade-in duration-300">
                {/* Active Chat Header */}
                <div className="p-4 border-b border-border/60 bg-muted/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Chat avatar representation */}
                    <div className="relative">
                      <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-500">
                        <User className="size-5" />
                      </div>
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border border-card" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground truncate max-w-[280px]" title={activeTicket.subject}>
                        {activeTicket.subject}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span className="font-semibold text-emerald-500 flex items-center gap-1">
                          Administrador
                        </span>
                        <span>•</span>
                        <span>Suporte</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTicket.status === "open" ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => closeTicketMutation.mutate(activeTicket.id)}
                        disabled={closeTicketMutation.isPending}
                        className="h-8 rounded-lg text-[10px] uppercase tracking-wider font-bold text-rose-500 border-rose-500/20 hover:bg-rose-500/5 hover:text-rose-600"
                      >
                        Encerrar
                      </Button>
                    ) : null}
                    
                    {/* Mobile Back list helper */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTicket(null)}
                      className="lg:hidden h-8 w-8 p-0"
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages Panel Scroll Area */}
                <div className="flex-1 overflow-y-auto p-5 bg-muted/5 space-y-4">
                  {isLoadingMessages ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Carregando mensagens anteriores...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                      <MessageSquare className="size-8 text-indigo-500/30 animate-bounce" />
                      <div className="space-y-1">
                        <span className="block text-xs font-bold text-foreground">Seu chamado está aberto!</span>
                        <p className="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">
                          Nossos especialistas contábeis já foram notificados. Envie sua dúvida adicional abaixo.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.email;
                      const isAdmin = msg.senderRole === "admin";
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] ${isMe ? "ml-auto" : "mr-auto"}`}>
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground/80 mb-1 font-medium">
                            <span>{isMe ? "Você" : msg.senderName}</span>
                            {isAdmin && (
                              <span className="px-1 py-0.2 bg-indigo-500/10 text-indigo-500 rounded text-[8px] font-black uppercase">Admin</span>
                            )}
                            <span>•</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div className={`px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                            isMe 
                              ? "bg-slate-900 text-white rounded-2xl rounded-tr-none dark:bg-slate-100 dark:text-slate-950 font-medium" 
                              : "bg-card border border-border text-foreground rounded-2xl rounded-tl-none"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send chat block */}
                {activeTicket.status === "open" ? (
                  <div className="p-4 bg-muted/30 border-t border-border/50">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input 
                        placeholder="Digite sua mensagem de suporte..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 h-10 rounded-xl bg-background border-border text-xs focus-visible:ring-1 focus-visible:ring-primary"
                      />
                      <Button 
                        type="submit" 
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="h-10 rounded-xl px-4 bg-primary hover:bg-primary/95 font-bold"
                      >
                        <Send className="size-3.5 mr-1.5 shrink-0" />
                        Enviar
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 border-t border-border/50 bg-muted/20 text-center text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    Atendimento finalizado. Este chamado foi encerrado por completo.
                  </div>
                )}
              </Card>
            ) : (
              /* No selection state representation */
              <div className="h-[550px] border border-dashed border-border/80 bg-muted/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="size-16 rounded-3xl bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10 text-indigo-500 shadow-sm shadow-indigo-500/5">
                  <MessageCircle className="size-8" />
                </div>
                <div className="space-y-1 max-w-[280px]">
                  <span className="block text-sm font-bold text-foreground">Nenhum Atendimento Ativo</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {user?.role === "admin" 
                      ? "Selecione um chamado de cliente na barra lateral esquerda para interagir ou responder."
                      : "Selecione um chamado existente na barra lateral esquerda ou crie um novo para falar com nossa equipe contábil."
                    }
                  </p>
                </div>
                {user?.role !== "admin" && (
                  <Button 
                    onClick={() => setIsOpeningForm(true)} 
                    className="rounded-xl h-9 px-4 font-semibold text-xs bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-500/15 text-white gap-1.5"
                  >
                    <Plus className="size-4 shrink-0" />
                    Abrir Novo Chamado
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
    </div>
  );
}
