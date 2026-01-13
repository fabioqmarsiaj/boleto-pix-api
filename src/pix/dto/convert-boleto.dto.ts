import {
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  IsNumber,
  Min,
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

  @IsOptional()
  @IsString()
  message?: string;
}
