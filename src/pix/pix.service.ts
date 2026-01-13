import { BadRequestException, Injectable } from '@nestjs/common';
import { QrCodePix } from 'qrcode-pix';
import { parseBoleto } from './utils/boleto';
import * as crypto from 'crypto';

@Injectable()
export class PixService {
  async convert(input: {
    linhaDigitavel?: string;
    codigoBarras?: string;
    amountOverride?: number;
    message?: string;
  }) {
    const pixKey = process.env.PIX_KEY;
    const merchant = process.env.PIX_MERCHANT_NAME || 'RECEBEDOR';
    const city = (process.env.PIX_MERCHANT_CITY || 'SAO PAULO')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const defaultMessage = process.env.PIX_DEFAULT_MESSAGE || 'Pagamento';

    if (!pixKey) {
      throw new BadRequestException('PIX_KEY não configurado. Defina no .env');
    }

    // 1) Extrai valor/vencimento a partir do boleto
    const parsed = parseBoleto({
      linhaDigitavel: input.linhaDigitavel,
      codigoBarras: input.codigoBarras,
    });

    // 2) Se o valor do boleto for 0, permite sobrescrever
    const amount =
      input.amountOverride && input.amountOverride > 0
        ? Number(input.amountOverride.toFixed(2))
        : Number(parsed.amount.toFixed(2));

    if (!amount || amount <= 0) {
      throw new BadRequestException(
        'Valor do boleto é 0. Informe amountOverride > 0 para gerar o Pix.',
      );
    }

    // 3) Gera TXID (até 35 chars). Usamos um hash curto e legível.
    const base = `${input.linhaDigitavel || input.codigoBarras}-${Date.now()}`;
    const txid = crypto
      .createHash('sha256')
      .update(base)
      .digest('hex')
      .slice(0, 25)
      .toUpperCase();

    // 4) Mensagem opcional
    const message = (input.message || defaultMessage).slice(0, 50);

    // 5) Gera Pix copia e cola + QR base64
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
    const imageBase64 = await qr.base64(); // data:image/png;base64,...

    return {
      kind: parsed.kind,
      amount,
      expirationDate: parsed.expirationDate ?? null,
      txid,
      message,
      payload, // Pix "copia e cola"
      imageBase64, // QR em base64 (data URL)
    };
  }
}
