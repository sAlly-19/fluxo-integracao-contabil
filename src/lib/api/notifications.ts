import { collection, doc, getDocs, setDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "notifications";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId?: string;
  companyId?: string | number;
}

export async function getNotifications(userId?: string, isAdmin?: boolean): Promise<AppNotification[]> {
  const q = collection(db, COLLECTION);
  const snapshot = await getDocs(q);
  
  let results = snapshot.docs.map((snapshotDoc) => {
    const data = snapshotDoc.data();
    
    // Normalize createdAt to ISO String
    let createdAtStr = new Date().toISOString();
    if (data.createdAt) {
      if (typeof data.createdAt === "string") {
        createdAtStr = data.createdAt;
      } else if (data.createdAt && typeof data.createdAt === "object" && typeof (data.createdAt as any).toDate === "function") {
        createdAtStr = (data.createdAt as any).toDate().toISOString();
      } else if (data.createdAt && typeof data.createdAt === "object" && "seconds" in (data.createdAt as any)) {
        createdAtStr = new Date((data.createdAt as any).seconds * 1000).toISOString();
      }
    }

    return {
      id: snapshotDoc.id,
      title: data.title || "",
      message: data.message || "",
      read: !!data.read,
      createdAt: createdAtStr,
      userId: data.userId || "",
      companyId: data.companyId || "",
    } as AppNotification;
  });

  if (!isAdmin && userId) {
    const cleanUserId = userId.trim().toLowerCase();
    results = results.filter(n => {
      const nUserId = (n.userId || "").trim().toLowerCase();
      const nCompanyId = (n.companyId || "").trim().toLowerCase();
      
      const isGlobal = !nUserId || nUserId === "all" || nUserId === "" || !nCompanyId || nCompanyId === "all" || nCompanyId === "";
      const isForMe = nUserId === cleanUserId || nCompanyId === cleanUserId;
      return isGlobal || isForMe;
    });
  }

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveNotification(notification: AppNotification): Promise<void> {
  const docRef = doc(db, COLLECTION, notification.id);
  const data = { 
    title: notification.title,
    message: notification.message,
    read: !!notification.read,
    createdAt: serverTimestamp(),
    userId: notification.userId || "all",
    companyId: notification.companyId ? notification.companyId.toString() : "all"
  };
  await setDoc(docRef, data);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await setDoc(docRef, { read: true }, { merge: true });
}
