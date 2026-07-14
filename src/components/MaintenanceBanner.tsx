import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AlertTriangle } from "lucide-react";

export function MaintenanceBanner() {
  const [config, setConfig] = useState<{ enabled: boolean; message: string } | null>(null);

  useEffect(() => {
    const docRef = doc(db, "system_configs", "maintenance_config");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as { enabled: boolean; message: string });
      } else {
        setConfig({ enabled: false, message: "" });
      }
    }, (error) => {
      console.warn("Failed to subscribe to maintenance config:", error);
    });

    return () => unsubscribe();
  }, []);

  if (!config || !config.enabled) return null;

  return (
    <div id="global-maintenance-banner" className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex flex-1 items-center justify-center gap-2 text-center">
          <AlertTriangle className="size-4 shrink-0 animate-bounce text-amber-100" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
            Modo de Manutenção Ativo:
          </span>
          <span className="text-xs font-medium text-white">
            {config.message || "O sistema passará por uma manutenção programada brevemente. Agradecemos a compreensão."}
          </span>
        </div>
      </div>
    </div>
  );
}
