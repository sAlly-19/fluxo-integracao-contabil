"use client";

import { useParams } from "react-router-dom";
import { CompanyModules } from "../../components/CompanyModules";
import { CompanyCommandBar, Topbar } from "../../components/Topbar";
import { useCompanyById } from "../../lib/use-company";
import { useAuth } from "../../components/AuthContext";

export default function CompanyPage() {
  const params = useParams<{ companyId: string }>();
  const { user } = useAuth();
  const company = useCompanyById(params.companyId, user?.email, user?.role);

  if (!company || !company.id) {
    return (
      <main className="app-shell">
        <Topbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-6">
            <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">Empresa não encontrada</h2>
          <p className="text-muted-foreground mt-2">Esta empresa não existe ou você não tem permissão para acessá-la.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Topbar />
      <CompanyCommandBar company={company} />
      <CompanyModules company={company} />
    </main>
  );
}
