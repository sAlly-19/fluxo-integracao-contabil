import { useEffect, useState } from "react";
import { getMaintenanceConfig, saveMaintenanceConfig, MaintenanceConfig } from "../lib/api/system-configs";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { AppIcon } from "./design-system";
import { useToast } from "./ToastContext";

export function AdminMaintenanceTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState<MaintenanceConfig>({ enabled: false, message: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await getMaintenanceConfig();
        setConfig(data);
      } catch (error) {
        console.error("Error loading maintenance config:", error);
        toast.error("Erro", "Não foi possível carregar as configurações de manutenção.");
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveMaintenanceConfig({
        enabled: config.enabled,
        message: config.message.trim(),
      });
      toast.success("Configuração Salva", `O modo de manutenção foi ${config.enabled ? "ativado" : "desativado"} com sucesso!`);
    } catch (error) {
      console.error("Error saving maintenance config:", error);
      toast.error("Erro ao salvar", "Ocorreu um erro ao tentar salvar as configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        Carregando configurações do sistema...
      </div>
    );
  }

  return (
    <div id="maintenance-panel-tab" className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Avisos e Manutenção do Sistema</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie avisos programados de indisponibilidade e controle o banner global do sistema.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-6 text-left max-w-2xl">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
          <div className="space-y-0.5 max-w-[80%]">
            <span className="block text-sm font-bold text-foreground">Ativar Modo de Manutenção</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Exibe um banner global em tempo real no topo de todas as telas avisando que haverá manutenção no sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.enabled ? "bg-amber-500" : "bg-muted"}`}
            role="switch"
            aria-checked={config.enabled}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${config.enabled ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <Label htmlFor="maintenance-message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mensagem do Banner Global
          </Label>
          <Textarea
            id="maintenance-message"
            rows={3}
            placeholder="Ex: O sistema passará por uma manutenção programada das 22h às 00h de hoje. Agradecemos a compreensão."
            value={config.message}
            onChange={(e) => setConfig(prev => ({ ...prev, message: e.target.value }))}
            className="rounded-xl border-border bg-background focus:border-amber-500 focus:ring-amber-500"
          />
          <span className="text-[10px] text-muted-foreground leading-relaxed block">
            Dica: Seja claro sobre o período estimado de indisponibilidade para evitar contatos desnecessários ao suporte.
          </span>
        </div>

        {/* Action Button */}
        <div className="flex justify-start">
          <Button
            type="submit"
            disabled={isSaving}
            className={`rounded-xl font-semibold h-11 px-6 ${config.enabled ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-primary text-primary-foreground hover:bg-primary/95"}`}
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <AppIcon className="size-4" name="save" />
                Salvar Configurações
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
