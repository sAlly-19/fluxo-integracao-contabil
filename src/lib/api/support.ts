import { collection, doc, setDoc, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  status: "open" | "closed";
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: "admin" | "user";
  content: string;
  createdAt: string;
}

const TICKETS_COLLECTION = "support_tickets";
const MESSAGES_COLLECTION = "support_messages";

export async function getTickets(userId?: string, role?: "admin" | "user"): Promise<SupportTicket[]> {
  const q = role === "admin" 
    ? query(collection(db, TICKETS_COLLECTION))
    : query(collection(db, TICKETS_COLLECTION), where("userId", "==", userId));
    
  const snapshot = await getDocs(q);
  const tickets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SupportTicket));
  return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createTicket(ticket: Omit<SupportTicket, "id">): Promise<SupportTicket> {
  const id = Date.now().toString();
  const newTicket = { ...ticket, id };
  await setDoc(doc(db, TICKETS_COLLECTION, id), newTicket);
  return newTicket;
}

export async function closeTicket(id: string): Promise<void> {
  await setDoc(doc(db, TICKETS_COLLECTION, id), { status: "closed" }, { merge: true });
}

export async function getMessages(ticketId: string): Promise<SupportMessage[]> {
  const q = query(collection(db, MESSAGES_COLLECTION), where("ticketId", "==", ticketId));
  const snapshot = await getDocs(q);
  const msgs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SupportMessage));
  return msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function sendMessage(msg: Omit<SupportMessage, "id">): Promise<SupportMessage> {
  const id = Date.now().toString() + Math.random().toString(36).substring(7);
  const newMsg = { ...msg, id };
  await setDoc(doc(db, MESSAGES_COLLECTION, id), newMsg);
  return newMsg;
}
