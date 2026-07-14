import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { SystemUser } from "../types";

const COLLECTION = "system_users";

export async function getSystemUsers(): Promise<SystemUser[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const users = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || "",
        email: data.email || "",
        password: data.password || "",
        active: data.active !== false,
        role: data.role || "user",
        expirationDate: data.expirationDate || "",
        companyName: data.companyName || "",
        phone: data.phone || "",
      } as SystemUser;
    });
    return users;
  } catch (error: any) {
    console.warn("Aviso ao carregar usuários do sistema (verifique as regras do Firestore):", error.message || error);
    // If it is a permission denied error, propagate it cleanly or handle it in UI
    throw error;
  }
}

export async function createSystemUser(user: Omit<SystemUser, "id">): Promise<SystemUser> {
  try {
    const id = Date.now().toString();
    const newUser: SystemUser = {
      id,
      ...user,
    };
    await setDoc(doc(db, COLLECTION, id), newUser);
    return newUser;
  } catch (error: any) {
    console.warn("Erro ao criar usuário do sistema:", error.message || error);
    throw error;
  }
}

export async function updateSystemUser(id: string, user: Partial<SystemUser>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, user);
  } catch (error: any) {
    console.warn("Erro ao atualizar usuário do sistema:", error.message || error);
    throw error;
  }
}

export async function deleteSystemUser(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error: any) {
    console.warn("Erro ao remover usuário do sistema:", error.message || error);
    throw error;
  }
}

export type SystemLogin = {
  id: string;
  email: string;
  timestamp: string;
};

export async function logSystemLogin(email: string): Promise<void> {
  try {
    const loginRef = doc(collection(db, "system_logins"));
    await setDoc(loginRef, {
      email,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.warn("Erro ao registrar login do sistema:", error.message || error);
  }
}

export async function getSystemLogins(): Promise<SystemLogin[]> {
  try {
    const snapshot = await getDocs(collection(db, "system_logins"));
    const logins = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SystemLogin));
    
    // Sort descending by timestamp
    return logins.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error: any) {
    console.warn("Aviso ao carregar logs de login (verifique as regras do Firestore):", error.message || error);
    throw error;
  }
}
