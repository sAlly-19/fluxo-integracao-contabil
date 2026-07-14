import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./page";
import OperationalHistoryPage from "./historico-operacional/page";
import CompanyPage from "./empresas/[companyId]/page";
import ImportFilesPage from "./empresas/[companyId]/importar-arquivos/page";
import SheetConfigurationPage from "./empresas/[companyId]/configurar-planilhas/page";
import AccountPlanPage from "./empresas/[companyId]/plano-de-contas/page";
import DefaultAccountsPage from "./empresas/[companyId]/consultas/contas-padroes/page";
import DeParasPage from "./empresas/[companyId]/consultas/de-paras/page";
import RulesPage from "./empresas/[companyId]/consultas/regras/page";
import AdminPage from "./admin/page";
import SupportPage from "./suporte/page";
import TermosPage from "./termos/page";
import NotFound from "./NotFound";
import { LandingPage } from "./components/LandingPage";
import { LoginScreen } from "./components/LoginScreen";
import { useAuth } from "./components/AuthContext";
import { MaintenanceBanner } from "./components/MaintenanceBanner";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/landing" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <MaintenanceBanner />
      <Routes>
        <Route path="/landing" element={<PublicRoute><LandingPage onGoToLogin={() => window.location.href = "/login"} /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginScreen onBackToLanding={() => window.location.href = "/landing"} /></PublicRoute>} />
        <Route path="/termos" element={<TermosPage />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/historico-operacional" element={<ProtectedRoute><OperationalHistoryPage /></ProtectedRoute>} />
        <Route path="/empresas/:companyId" element={<ProtectedRoute><CompanyPage /></ProtectedRoute>} />
        <Route path="/empresas/:companyId/importar-arquivos" element={<ProtectedRoute><ImportFilesPage /></ProtectedRoute>} />
        <Route path="/empresas/:companyId/configurar-planilhas" element={<ProtectedRoute><SheetConfigurationPage /></ProtectedRoute>} />
        <Route path="/empresas/:companyId/plano-de-contas" element={<ProtectedRoute><AccountPlanPage /></ProtectedRoute>} />
        <Route path="/empresas/:companyId/consultas/contas-padroes" element={<ProtectedRoute><DefaultAccountsPage /></ProtectedRoute>} />
        <Route path="/empresas/:companyId/consultas/de-paras" element={<ProtectedRoute><DeParasPage /></ProtectedRoute>} />
        <Route path="/empresas/:companyId/consultas/regras" element={<ProtectedRoute><RulesPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/suporte" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

