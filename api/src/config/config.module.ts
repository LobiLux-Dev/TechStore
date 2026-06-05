import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import appConfig from './app.config';
import databaseConfig from './database.config';
import { ConfigService } from './config.service';
import { validate } from './env.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({ validate, load: [appConfig, databaseConfig] }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
