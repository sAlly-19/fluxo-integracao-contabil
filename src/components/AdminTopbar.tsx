import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { AnimatedHeader } from "./animate-ui/motion";
import { AppIcon, BrandMark } from "./design-system";
import { Button } from "./ui/button";

function MenuPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`absolute top-[calc(100%+0.65rem)] z-50 rounded-2xl border border-border bg-card p-3 shadow-2xl shadow-slate-950/20 ${className}`}>
      {children}
    </div>
  );
}

function MenuHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="mb-3 border-b border-border pb-3">
      <strong className="block text-sm text-foreground">{title}</strong>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
    </div>
  );
}

export function AdminTopbar() {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("fluxo-theme");
    if (saved) return saved === "dark";
    return document.documentElement.classList.contains("dark");
  });
  const [isUserOpen, setIsUserOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      localStorage.setItem("fluxo-theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("fluxo-theme", "light");
    }
  }, [isDark]);

  const userInitials = user ? user.email.slice(0, 2).toUpperCase() : "AD";

  return (
    <AnimatedHeader className="sticky top-0 z-40 border-b border-indigo-500/20 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link className="flex min-w-0 items-center focus:outline-none" to="/admin" aria-label="Painel Administrativo">
          <BrandMark />
          <span className="ml-3 border-l pl-3 text-sm font-semibold tracking-wide text-indigo-500 uppercase">Administração</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          
          <Button asChild aria-label="Suporte" className="rounded-full" size="icon" type="button" variant="ghost">
            <Link to="/suporte">
              <AppIcon className="bg-transparent text-muted-foreground" name="message-square" />
            </Link>
          </Button>

          <div className="relative ml-2">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-sm ring-2 ring-transparent transition-all hover:ring-indigo-400 focus:outline-none"
              type="button"
              aria-label="Menu do usuario"
              aria-expanded={isUserOpen}
              onClick={() => setIsUserOpen((current) => !current)}
            >
              {userInitials}
            </button>
            {isUserOpen ? (
              <MenuPanel className="right-0 w-64">
                <MenuHeader
                  title={user?.name || "Administrador Supremo"}
                  description="Acesso Total ao Sistema"
                />
                <div className="grid gap-2 text-sm">
                  <button className="rounded-xl px-3 py-2 text-left hover:bg-muted flex items-center gap-1.5 w-full" type="button" onClick={() => setIsDark((current) => !current)}>
                    <AppIcon className="size-4" name={isDark ? "sun" : "moon"} />
                    Alternar tema
                  </button>
                  <button
                    className="rounded-xl px-3 py-2 text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-medium transition-colors flex items-center gap-1.5 w-full"
                    type="button"
                    onClick={() => {
                      setIsUserOpen(false);
                      logout();
                    }}
                  >
                    <AppIcon className="size-4 text-rose-500" name="logout" />
                    Sair do Sistema (Logout)
                  </button>
                </div>
              </MenuPanel>
            ) : null}
          </div>
        </div>
      </div>
    </AnimatedHeader>
  );
}
