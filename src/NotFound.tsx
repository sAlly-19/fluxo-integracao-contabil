import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "./components/design-system";

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <BrandMark />
      <h1 className="mt-8 text-4xl font-bold tracking-tight text-primary">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">Página não encontrada.</p>
      <p className="mt-1 text-sm text-muted-foreground/80">Redirecionando para a página inicial...</p>
    </div>
  );
}
