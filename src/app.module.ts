import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PixModule } from './pix/pix.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PixModule],
})
export class AppModule {}
