import { BadRequestException, Injectable } from '@nestjs/common';
import { QrCodePix } from 'qrcode-pix';
import { parseBoleto } from './utils/boleto';
import * as crypto from 'crypto';

function normalizeCity(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 15); // limite recomendado
}

function trimMerchantName(input: string): string {
  return input.trim().slice(0, 25);
}

@Injectable()
export class PixService {
  async convert(input: {
    linhaDigitavel?: string;
    codigoBarras?: string;
    amountOverride?: number;
    message?: string;

    // Dinâmicos
    pixKey: string;
    merchantName: string;
    merchantCity: string;
    payerName?: string;
  }) {
    const pixKey = input.pixKey;
    const merchant = trimMerchantName(input.merchantName);
    const city = normalizeCity(input.merchantCity);

    if (!pixKey || !merchant || !city) {
      throw new BadRequestException(
        'pixKey, merchantName e merchantCity são obrigatórios',
      );
    }

    // 1) Extrai valor/vencimento do boleto
    const parsed = parseBoleto({
      linhaDigitavel: input.linhaDigitavel,
      codigoBarras: input.codigoBarras,
    });

    // 2) Se valor do boleto for 0, permite sobrescrever
    const amount =
      input.amountOverride && input.amountOverride > 0
        ? Number(input.amountOverride.toFixed(2))
        : Number(parsed.amount.toFixed(2));

    if (!amount || amount <= 0) {
      throw new BadRequestException(
        'Valor do boleto é 0. Informe amountOverride > 0 para gerar o Pix.',
      );
    }

    // 3) Gera TXID (até 35 chars)
    const base = `${input.linhaDigitavel || input.codigoBarras}-${Date.now()}`;
    const txid = crypto
      .createHash('sha256')
      .update(base)
      .digest('hex')
      .slice(0, 25)
      .toUpperCase();

    // 4) Mensagem: combine mensagem + pagador (se fornecido)

    // Depois (corrigido):
    const parts: string[] = [];
    if (input.message) parts.push(input.message);
    if (input.payerName) parts.push(`Pagador: ${input.payerName}`);
    const message = parts.join(' · ').slice(0, 50);

    // 5) Gera Pix estático
    const qr = QrCodePix({
      version: '01',
      key: pixKey,
      name: merchant,
      city,
      transactionId: txid,
      message,
      value: amount,
    });

    const payload = qr.payload();
    const imageBase64 = await qr.base64();

    return {
      kind: parsed.kind,
      amount,
      expirationDate: parsed.expirationDate ?? null, // vem do boleto
      txid,
      message,
      merchant: { name: merchant, city, pixKey },
      payload, // Pix "copia e cola"
      imageBase64, // QR base64
    };
  }
}
