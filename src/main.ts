import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: [
      configService.get("FRONTEND_URL") || "http://localhost:3000",
      configService.get("ADMIN_URL") || "http://localhost:3002",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // Global prefix
  app.setGlobalPrefix("api");

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("Vantadge Fitness API")
    .setDescription("REST API for Vantadge Fitness platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = configService.get("PORT") || 3001;
  await app.listen(port);
  console.log(`🚀 Vantadge API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
