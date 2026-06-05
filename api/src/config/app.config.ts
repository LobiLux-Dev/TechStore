import { registerAs } from '@nestjs/config';

import { Environment } from './env.validation';
import type { AppConfig } from './config.type';

export default registerAs(
  'app',
  (): AppConfig => ({
    port: +process.env.PORT!,
    nodeEnv: process.env.NODE_ENV as Environment,
  }),
);
