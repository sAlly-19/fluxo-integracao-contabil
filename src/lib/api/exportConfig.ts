import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export type CustomExportField =
  | "empresa"
  | "data"
  | "contaDebito"
  | "contaCredito"
  | "valor"
  | "codigoHistorico"
  | "historico"
  | "documento"
  | "literal";

export type CustomExportColumn = {
  id: string;
  field: CustomExportField;
  literalValue?: string;
  label: string;
};

export type CustomExportConfig = {
  companyId: string;
  extension: string;
  separator: string;
  includeHeader: boolean;
  dateFormat: "DD/MM/YYYY" | "DDMMYYYY" | "YYYY-MM-DD" | "DD/MM/YY";
  amountFormat: "comma" | "dot" | "raw";
  columns: CustomExportColumn[];
};

const COLLECTION = "exportConfigs";

export const DEFAULT_EXPORT_COLUMNS: CustomExportColumn[] = [
  { id: "col-1", field: "data", label: "Data" },
  { id: "col-2", field: "contaDebito", label: "Conta Débito" },
  { id: "col-3", field: "contaCredito", label: "Conta Crédito" },
  { id: "col-4", field: "valor", label: "Valor" },
  { id: "col-5", field: "codigoHistorico", label: "Cód. Histórico" },
  { id: "col-6", field: "historico", label: "Histórico" },
  { id: "col-7", field: "documento", label: "Documento" }
];

export const DEFAULT_EXPORT_CONFIG: Omit<CustomExportConfig, "companyId"> = {
  extension: "csv",
  separator: ";",
  includeHeader: true,
  dateFormat: "DD/MM/YYYY",
  amountFormat: "comma",
  columns: DEFAULT_EXPORT_COLUMNS
};

export async function getExportConfig(companyId: string | number): Promise<CustomExportConfig> {
  const defaultVal: CustomExportConfig = {
    ...DEFAULT_EXPORT_CONFIG,
    companyId: companyId.toString()
  };

  if (!companyId) return defaultVal;
  try {
    const docRef = doc(db, COLLECTION, companyId.toString());
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return defaultVal;
    return {
      ...defaultVal,
      ...snapshot.data()
    } as CustomExportConfig;
  } catch (error) {
    console.warn("Could not load export config, using default:", error);
    return defaultVal;
  }
}

export async function saveExportConfig(companyId: string | number, config: CustomExportConfig): Promise<void> {
  const docRef = doc(db, COLLECTION, companyId.toString());
  await setDoc(docRef, config);
}
