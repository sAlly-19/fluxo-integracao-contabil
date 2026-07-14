/**
 * PIX EMV CO (BR Code) Static Generator
 * Calculates BR Code payload completely on the client side without external API keys.
 */

function crc16ccitt(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    crc ^= (charCode << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  const hex = crc.toString(16).toUpperCase();
  return hex.padStart(4, "0");
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export type PixParams = {
  key: string; // PIX Key (CNPJ, CPF, Email, Phone, or Random Key)
  merchantName: string; // e.g. "FLUXO INTEGRACAO CONTABIL" (Max 25 chars, standard EMV)
  merchantCity: string; // e.g. "SAO PAULO" (Max 15 chars, standard EMV)
  amount?: number; // Optional transaction amount
  description?: string; // Optional description (displayed on some bank apps)
  txId?: string; // Transaction identifier (Default is "***")
};

export function generatePixCopiaECola(params: PixParams): string {
  // Sanitize name and city for standard ASCII/upper-case to avoid accentuation encoding issues in EMV readers
  const cleanName = params.merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .substring(0, 25);

  const cleanCity = params.merchantCity
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .substring(0, 15);

  const cleanKey = params.key.trim();
  const cleanTxId = (params.txId || "***")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 25);

  const cleanDesc = params.description
    ? params.description
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .substring(0, 72)
    : "";

  // 00: Payload Format Indicator (Constant "0201")
  let payload = formatField("00", "01");

  // 26: Merchant Account Information
  // GUI: br.gov.bcb.pix
  const gui = formatField("00", "br.gov.bcb.pix");
  const keyField = formatField("01", cleanKey);
  const descField = cleanDesc ? formatField("02", cleanDesc) : "";
  payload += formatField("26", `${gui}${keyField}${descField}`);

  // 52: Merchant Category Code (Default "0000")
  payload += formatField("52", "0000");

  // 53: Transaction Currency (BRL is "986")
  payload += formatField("53", "986");

  // 54: Transaction Amount (Optional, formatted to 2 decimals)
  if (params.amount && params.amount > 0) {
    payload += formatField("54", params.amount.toFixed(2));
  }

  // 58: Country Code (Constant "BR")
  payload += formatField("58", "BR");

  // 59: Merchant Name
  payload += formatField("59", cleanName || "MERCHANT");

  // 60: Merchant City
  payload += formatField("60", cleanCity || "SAO PAULO");

  // 62: Additional Data Field Template
  const referenceLabel = formatField("05", cleanTxId);
  payload += formatField("62", referenceLabel);

  // 63: CRC16 template (ready for checksum addition)
  payload += "6304";

  // Calculate and append checksum
  const checksum = crc16ccitt(payload);
  return `${payload}${checksum}`;
}

export function getPixQrCodeUrl(copiaECola: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(copiaECola)}`;
}
