export function replacePlaceholders(
  template: string,
  data: {
    nome_cliente: string;
    valor_fatura: string;
    data_vencimento: string;
    codigo_pix: string;
  }
): string {
  if (!template) return "";
  return template
    .replace(/{NOME_CLIENTE}/g, data.nome_cliente)
    .replace(/{VALOR_FATURA}/g, data.valor_fatura)
    .replace(/{DATA_VENCIMENTO}/g, data.data_vencimento)
    .replace(/{CODIGO_PIX}/g, data.codigo_pix);
}
