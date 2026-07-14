import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface SmtpLog {
  id: string;
  paymentId: string;
  userEmail: string;
  userName: string;
  subject: string;
  sentAt: string;
  status: "delivered" | "opened" | "failed"; // "entregue", "aberto", "rejeitado"
  errorMessage?: string;
  openCount: number;
  ipAddress?: string;
}

const COLLECTION = "system_smtp_logs";

export async function getSmtpLogs(): Promise<SmtpLog[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const logs = snapshot.docs.map((snapshotDoc) => {
      const data = snapshotDoc.data();
      return {
        id: snapshotDoc.id,
        paymentId: data.paymentId || "",
        userEmail: data.userEmail || "",
        userName: data.userName || "",
        subject: data.subject || "",
        sentAt: data.sentAt || "",
        status: data.status || "delivered",
        errorMessage: data.errorMessage || "",
        openCount: Number(data.openCount) || 0,
        ipAddress: data.ipAddress || "",
      } as SmtpLog;
    });

    return logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  } catch (err) {
    console.warn("Error fetching SMTP logs (check Firestore database):", err);
    return [];
  }
}

export async function createSmtpLog(log: Omit<SmtpLog, "id">): Promise<SmtpLog> {
  const id = "smtp_log_" + Date.now();
  const fullLog = { ...log, id };
  await setDoc(doc(db, COLLECTION, id), fullLog);
  return fullLog;
}
