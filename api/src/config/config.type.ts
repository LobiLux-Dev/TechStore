import { Environment } from './env.validation';

export interface AppConfig {
  port: number;
  nodeEnv: Environment;
}

export interface DatabaseConfig {
  url: string;
}

export interface AllConfig {
  app: AppConfig;
  database: DatabaseConfig;
}
