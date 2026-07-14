import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { SystemPayment } from "../types";

const COLLECTION = "system_payments";

export async function getSystemPayments(): Promise<SystemPayment[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const payments = snapshot.docs.map((snapshotDoc) => {
      const data = snapshotDoc.data();
      return {
        id: snapshotDoc.id,
        userId: data.userId || "",
        userEmail: data.userEmail || "",
        userName: data.userName || "",
        companyName: data.companyName || "",
        amount: Number(data.amount) || 0,
        description: data.description || "",
        status: data.status || "pending",
        dueDate: data.dueDate || "",
        createdAt: data.createdAt || new Date().toISOString(),
        paidAt: data.paidAt,
        paymentLink: data.paymentLink || "",
        phone: data.phone || "",
        autoSendEnabled: data.autoSendEnabled !== false, // Defaults to true
        manualSentAt: data.manualSentAt,
      } as SystemPayment;
    });
    // Sort descending by creation date
    return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn("Error fetching system payments (check Firestore database):", error);
    return [];
  }
}

export async function createSystemPayment(payment: Omit<SystemPayment, "id" | "createdAt">): Promise<SystemPayment> {
  const id = Date.now().toString();
  const fullPayment: SystemPayment = {
    ...payment,
    id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, COLLECTION, id), fullPayment);
  return fullPayment;
}

export async function updateSystemPayment(id: string, updated: Partial<SystemPayment>): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, updated);
}

export async function deleteSystemPayment(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
