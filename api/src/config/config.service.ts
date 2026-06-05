import { Injectable } from '@nestjs/common';
import {
  ConfigService as NestConfigService,
  type Path,
  type PathValue,
} from '@nestjs/config';

import type { AllConfig } from './config.type';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService<AllConfig>) {}

  get<P extends Path<AllConfig>>(key: P): PathValue<AllConfig, P> {
    // Always returns a value, since they are validated before starting the application.
    // Validation file: ./env.validation.ts
    // Validation applied in: ./config.module.ts
    return this.configService.get(key, { infer: true })!;
  }
}
