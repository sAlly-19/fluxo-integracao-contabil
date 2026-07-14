import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCompany } from "./api/companies";
import { getCompanyFallback } from "./company";
import type { Company } from "./types";

export function useCompanyById(companyId: string | number | undefined, userId?: string, role?: "admin" | "user"): Company {
  const { data } = useQuery({
    queryKey: ["company", companyId, userId, role],
    queryFn: () => getCompany(companyId ? companyId.toString() : "", userId, role),
    enabled: !!companyId,
  });

  const fallback = useMemo(() => getCompanyFallback(companyId), [companyId]);

  return data ?? fallback;
}
