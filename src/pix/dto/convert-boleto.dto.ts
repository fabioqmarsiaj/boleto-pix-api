import {
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  IsNumber,
  Min,
  Length,
} from 'class-validator';

export class ConvertBoletoDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{47}$/, {
    message: 'linhaDigitavel deve conter exatamente 47 dígitos',
  })
  linhaDigitavel?: string;

  @ValidateIf((o) => !o.linhaDigitavel)
  @IsString()
  @Matches(/^\d{44}$/, {
    message: 'codigoBarras deve conter exatamente 44 dígitos',
  })
  codigoBarras?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'amountOverride deve ser maior que 0' })
  amountOverride?: number;

  // >>> Dinâmicos por requisição <<<
  @IsString()
  @Length(3, 77, { message: 'pixKey deve ter entre 3 e 77 caracteres' })
  pixKey!: string;

  @IsString()
  @Length(1, 25, { message: 'merchantName deve ter entre 1 e 25 caracteres' })
  merchantName!: string;

  @IsString()
  @Length(1, 15, {
    message: 'merchantCity deve ter entre 1 e 15 caracteres (use sem acentos)',
  })
  merchantCity!: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  payerName?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
