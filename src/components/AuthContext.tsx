import { createContext, useContext, useEffect, useState } from "react";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { logSystemLogin } from "../lib/api/system-users";

interface LoggedUser {
  email: string;
  name: string;
  role: "admin" | "user";
  active: boolean;
  expirationDate?: string;
  companyName?: string;
}

interface AuthContextType {
  user: LoggedUser | null;
  loading: boolean;
  view: "landing" | "login" | "app";
  setView: (view: "landing" | "login" | "app") => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  view: "landing",
  setView: () => {},
  login: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoggedUser | null>(() => {
    const saved = localStorage.getItem("fluxo-session-user");
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<"landing" | "login" | "app">(() => {
    const saved = localStorage.getItem("fluxo-session-user");
    return saved ? "app" : "landing";
  });
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Enable authentication view immediately as firestore rules allow global access
    setAuthReady(true);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Admin Login fallback check to ensure the administrator always has access
      if (cleanEmail === "alissontar18@gmail.com" && password === "@Bethania80") {
        const loggedUser: LoggedUser = {
          email: cleanEmail,
          name: "Administrador",
          role: "admin",
          active: true,
          expirationDate: "2099-12-31",
          companyName: "Administração",
        };

        setUser(loggedUser);
        setView("app");
        window.history.replaceState(null, "", "/admin");
        localStorage.setItem("fluxo-session-user", JSON.stringify(loggedUser));
        setLoading(false);
        logSystemLogin(cleanEmail).catch(console.error);

        // Lazily create or ensure the administrator exists in Firestore so they are visible in users listing
        try {
          const usersRef = collection(db, "system_users");
          const q = query(usersRef, where("email", "==", cleanEmail));
          const snap = await getDocs(q);
          if (snap.empty) {
            await setDoc(doc(db, "system_users", "admin_alisson"), {
              id: "admin_alisson",
              name: "Administrador",
              email: "alissontar18@gmail.com",
              password: "@Bethania80",
              active: true,
              role: "admin",
              expirationDate: "2099-12-31",
              companyName: "Administração",
              phone: "",
            });
          }
        } catch (dbErr) {
          console.warn("Aviso ao salvar administrador no Firestore:", dbErr);
        }

        return { success: true };
      }

      // 2. Real user check in Firestore (handles both normal user and admin)
      const usersRef = collection(db, "system_users");
      const q = query(usersRef, where("email", "==", cleanEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLoading(false);
        return { success: false, error: "Usuário não encontrado. Solicite uma licença no WhatsApp!" };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verify password
      if (userData.password !== password) {
        setLoading(false);
        return { success: false, error: "Senha incorreta." };
      }

      // Verify active status
      if (userData.active === false) {
        setLoading(false);
        return { success: false, error: "Sua licença foi desativada pelo administrador." };
      }

      // Verify expiration date
      if (userData.expirationDate) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        if (userData.expirationDate < today) {
          setLoading(false);
          return { success: false, error: `Sua licença expirou em ${userData.expirationDate.split("-").reverse().join("/")}.` };
        }
      }

      // If all is well, log in!
      const loggedUser: LoggedUser = {
        email: cleanEmail,
        name: userData.name || (userData.role === "admin" ? "Administrador" : "Cliente"),
        role: userData.role || "user",
        active: true,
        expirationDate: userData.expirationDate,
        companyName: userData.companyName || "",
      };

      setUser(loggedUser);
      setView("app");
      
      if (loggedUser.role === "admin") {
        window.history.replaceState(null, "", "/admin");
      } else {
        window.history.replaceState(null, "", "/");
      }
      
      localStorage.setItem("fluxo-session-user", JSON.stringify(loggedUser));
      setLoading(false);
      logSystemLogin(cleanEmail).catch(console.error);
      return { success: true };
    } catch (err: any) {
      console.error("Erro no login:", err);
      setLoading(false);
      return { success: false, error: "Erro de servidor ao tentar realizar login." };
    }
  };

  const logout = () => {
    setUser(null);
    setView("landing");
    localStorage.removeItem("fluxo-session-user");
    window.history.replaceState(null, "", "/");
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, view, setView, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
