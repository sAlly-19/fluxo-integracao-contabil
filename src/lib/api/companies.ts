import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Company, NewCompany, TaxationType } from "../types";

const COLLECTION = "companies";

export async function getCompanies(search?: string, userId?: string, role?: "admin" | "user"): Promise<Company[]> {
  let q;
  if (role !== "admin" && userId) {
    q = query(collection(db, COLLECTION), where("userId", "==", userId));
  } else {
    q = collection(db, COLLECTION);
  }
  
  const snapshot = await getDocs(q);
  let companies = snapshot.docs.map((snapshotDoc) => {
    const data = snapshotDoc.data() as Partial<Company>;
    return normalizeCompany({ ...data, id: snapshotDoc.id } as Company);
  });
  
  if (search) {
    const s = search.toLowerCase();
    companies = companies.filter(c => 
      c.name.toLowerCase().includes(s) || 
      c.code.toLowerCase().includes(s) || 
      c.document.includes(s)
    );
  }
  
  return companies.sort((a, b) => Number(b.id) - Number(a.id));
}

export async function getCompany(id: string, userId?: string, role?: "admin" | "user"): Promise<Company | null> {
  const docRef = doc(db, COLLECTION, id);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    const data = snapshot.data() as Partial<Company>;
    const company = normalizeCompany({ ...data, id: snapshot.id } as Company);
    
    // Security check: non-admin users can only access their own companies
    if (role !== "admin" && userId && company.userId !== userId) {
      return null;
    }
    
    return company;
  }

  // If not found by ID, try searching by document (CNPJ/CPF)
  let q;
  if (role !== "admin" && userId) {
    q = query(collection(db, COLLECTION), where("userId", "==", userId));
  } else {
    q = collection(db, COLLECTION);
  }
  const allCompaniesSnapshot = await getDocs(q);
  const cleanId = id.replace(/\D/g, "");
  
  for (const doc of allCompaniesSnapshot.docs) {
    const data = doc.data() as Partial<Company>;
    if (data.document && data.document.replace(/\D/g, "") === cleanId) {
      const company = normalizeCompany({ ...data, id: doc.id } as Company);
      
      // Security check: non-admin users can only access their own companies
      if (role !== "admin" && userId && company.userId !== userId) {
        return null;
      }
      
      return company;
    }
  }

  return null;
}

export async function createCompany(newCompany: NewCompany, userId?: string): Promise<Company> {
  // Give it a sequential-like ID based on timestamp for simplicity
  const id = Date.now().toString();
  const company: Company = {
    id,
    code: newCompany.accountingCode,
    name: newCompany.name,
    document: newCompany.document,
    nickname: newCompany.nickname,
    lastProcess: "-",
    mode: "Customizada",
    taxation: newCompany.taxation,
    userId: userId || "",
  };
  await setDoc(doc(db, COLLECTION, id), company);
  return company;
}

export async function updateCompany(id: string, updatedCompany: NewCompany): Promise<Company> {
  const docRef = doc(db, COLLECTION, id);
  const dataToUpdate = {
    code: updatedCompany.accountingCode,
    name: updatedCompany.name,
    document: updatedCompany.document,
    nickname: updatedCompany.nickname,
    taxation: updatedCompany.taxation,
  };
  await updateDoc(docRef, dataToUpdate);
  return normalizeCompany({ id: id as any as number, ...dataToUpdate, lastProcess: "-", mode: "Customizada" } as Company);
}

export async function deleteCompany(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

function normalizeCompany(company: Company): Company {
  return {
    ...company,
    taxation: normalizeTaxation(company.taxation)
  };
}

function normalizeTaxation(value: TaxationType | undefined): TaxationType {
  if (value === "Lucro Real" || value === "Lucro Presumido" || value === "Simples Nacional" || value === "Imunes/Isentas") {
    return value;
  }

  return "Lucro Presumido";
}
