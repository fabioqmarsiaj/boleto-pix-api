/**
 * Utilitários para boletos bancários (MVP).
 * Suporta:
 *  - Linha digitável (47 dígitos)
 *  - Código de barras (44 dígitos)
 *
 * Observações:
 *  - Concessionárias (48 dígitos) não suportadas neste MVP.
 *  - Valor = últimos 10 dígitos do bloco de valor (centavos).
 *  - Fator de vencimento = dias desde 1997-10-07 (base BACEN).
 */

export type ParsedBoleto = {
  amount: number; // em reais
  expirationDate?: string; // ISO 8601 (se existir fator válido)
  kind: 'LINHA_DIGITAVEL_47' | 'CODIGO_BARRAS_44';
};

const BASE_DATE = new Date('1997-10-07T00:00:00Z');

export function onlyDigits(input: string): string {
  return (input || '').replace(/\D+/g, '');
}

export function isBankSlip47(digits: string): boolean {
  return /^\d{47}$/.test(digits);
}

export function isBarcode44(digits: string): boolean {
  return /^\d{44}$/.test(digits);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function parseBoleto(input: {
  linhaDigitavel?: string;
  codigoBarras?: string;
}): ParsedBoleto {
  const ld = input.linhaDigitavel
    ? onlyDigits(input.linhaDigitavel)
    : undefined;
  const cb = input.codigoBarras ? onlyDigits(input.codigoBarras) : undefined;

  if (ld && isBankSlip47(ld)) {
    // Linha digitável (47): [..][DV geral][FATOR(4)][VALOR(10)]
    // Índices 1-based: 34-37 = fator, 38-47 = valor
    const fatorStr = ld.substring(33, 37);
    const valorStr = ld.substring(37, 47);

    const valor = Number.parseInt(valorStr, 10) / 100;
    const fator = Number.parseInt(fatorStr, 10);

    const expiration =
      Number.isFinite(fator) && fator > 0
        ? addDays(BASE_DATE, fator).toISOString()
        : undefined;

    return {
      amount: valor,
      expirationDate: expiration,
      kind: 'LINHA_DIGITAVEL_47',
    };
  }

  if (cb && isBarcode44(cb)) {
    // Código de barras (44): [0-2 banco][3 moeda][4 DV][5-8 fator(4)][9-18 valor(10)][19-43 campo livre(25)]
    const fatorStr = cb.substring(5, 9);
    const valorStr = cb.substring(9, 19);

    const valor = Number.parseInt(valorStr, 10) / 100;
    const fator = Number.parseInt(fatorStr, 10);

    const expiration =
      Number.isFinite(fator) && fator > 0
        ? addDays(BASE_DATE, fator).toISOString()
        : undefined;

    return {
      amount: valor,
      expirationDate: expiration,
      kind: 'CODIGO_BARRAS_44',
    };
  }

  throw new Error(
    'Formato de boleto não suportado neste MVP. Use 47 (linha digitável) ou 44 (código de barras).',
  );
}
