import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { AppModuleModule } from "./app-module.module";
import { ConfigService } from "./config/config.service";
import { PrismaFilter } from "./infrastructure/prisma/filters";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModuleModule);

	app.enableCors();

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		}),
	);
	app.useGlobalFilters(new PrismaFilter());

	const config = app.get(ConfigService);
	const port = config.get("app.port");

	await app.listen(port);
}

void bootstrap();
