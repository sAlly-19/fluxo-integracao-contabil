import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface BillingTemplates {
  emailSubject: string;
  emailBody: string;
  whatsappMessage: string;
}

export interface WebhookConfig {
  webhookUrl: string;
  notifyOnPayment: boolean;
  notifyOnExpiration: boolean;
  adminPhone: string;
}

const COLLECTION = "system_configs";

const DEFAULT_TEMPLATES: BillingTemplates = {
  emailSubject: "Fatura em Aberto - Fluxo Integração Contábil",
  emailBody: `Prezado(a) {NOME_CLIENTE},

Sua fatura de {VALOR_FATURA} com vencimento em {DATA_VENCIMENTO} já está disponível para pagamento.

Você pode pagar utilizando o código PIX Copia e Cola abaixo:

{CODIGO_PIX}

Dica: Abra o app do seu banco, escolha a opção "Pagar via Pix" e selecione "Pix Copia e Cola". Cole o código acima para efetuar o pagamento instantâneo com segurança.

Atenciosamente,
Equipe Financeira Fluxo Integração Contábil`,
  whatsappMessage: "Olá, {NOME_CLIENTE}! Sua fatura de {VALOR_FATURA} vence em {DATA_VENCIMENTO}. Efetue o pagamento via PIX Copia e Cola colando o código no seu banco: {CODIGO_PIX}"
};

const DEFAULT_WEBHOOK: WebhookConfig = {
  webhookUrl: "https://api.whatsapp-gateway.com/v1/webhooks/fluxoic-alerts",
  notifyOnPayment: true,
  notifyOnExpiration: true,
  adminPhone: "62999999999",
};

export async function getBillingTemplates(): Promise<BillingTemplates> {
  try {
    const docRef = doc(db, COLLECTION, "billing_templates");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as BillingTemplates;
    }
    // Set defaults if not present
    await setDoc(docRef, DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  } catch (err) {
    console.warn("Error fetching templates (check Firestore database):", err);
    return DEFAULT_TEMPLATES;
  }
}

export async function saveBillingTemplates(templates: BillingTemplates): Promise<void> {
  const docRef = doc(db, COLLECTION, "billing_templates");
  await setDoc(docRef, templates);
}

export async function getWebhookConfig(): Promise<WebhookConfig> {
  try {
    const docRef = doc(db, COLLECTION, "webhook_config");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as WebhookConfig;
    }
    // Set defaults if not present
    await setDoc(docRef, DEFAULT_WEBHOOK);
    return DEFAULT_WEBHOOK;
  } catch (err) {
    console.warn("Error fetching webhook config (check Firestore database):", err);
    return DEFAULT_WEBHOOK;
  }
}

export async function saveWebhookConfig(config: WebhookConfig): Promise<void> {
  const docRef = doc(db, COLLECTION, "webhook_config");
  await setDoc(docRef, config);
}

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
}

const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  enabled: false,
  message: "O sistema passará por uma manutenção programada brevemente. Agradecemos a compreensão.",
};

export async function getMaintenanceConfig(): Promise<MaintenanceConfig> {
  try {
    const docRef = doc(db, COLLECTION, "maintenance_config");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as MaintenanceConfig;
    }
    // Set defaults if not present
    await setDoc(docRef, DEFAULT_MAINTENANCE);
    return DEFAULT_MAINTENANCE;
  } catch (err) {
    console.warn("Error fetching maintenance config (check Firestore database):", err);
    return DEFAULT_MAINTENANCE;
  }
}

export async function saveMaintenanceConfig(config: MaintenanceConfig): Promise<void> {
  const docRef = doc(db, COLLECTION, "maintenance_config");
  await setDoc(docRef, config);
}
