import type { Company } from "./types";
import { getCompany as getApiCompany } from "./api/companies";

export function getCompanyFallback(companyId: string | number | undefined): Company {
  const id = companyId ? Number(companyId) : 0;
  return {
    id,
    code: companyId ? String(companyId) : "",
    name: "EMPRESA SELECIONADA",
    document: "",
    nickname: "Empresa",
    lastProcess: "Ainda nao processada",
    mode: "Customizada",
    taxation: "Lucro Presumido"
  };
}

export async function getCompanyById(companyId: string | number | undefined): Promise<Company> {
  if (!companyId) return getCompanyFallback("");
  const comp = await getApiCompany(companyId.toString());
  return comp ?? getCompanyFallback(companyId);
}

export function getCompanyHref(company: Company) {
  const cleanDocument = company.document ? company.document.replace(/\D/g, "") : "";
  return `/empresas/${cleanDocument || company.id}`;
}
