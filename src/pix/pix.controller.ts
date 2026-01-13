import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PixService } from './pix.service';
import { ConvertBoletoDto } from './dto/convert-boleto.dto';

@Controller('pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Post('convert')
  @HttpCode(200)
  async convert(@Body() body: ConvertBoletoDto) {
    return this.pixService.convert(body);
  }
}
