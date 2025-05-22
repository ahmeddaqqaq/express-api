import { writeFileSync } from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export default async function initSwagger(
  app: INestApplication,
  globalPrefix: string,
  writeToFile = true,
) {
  const swaggerBaseConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation for Teletek integration')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerBaseConfig);
  SwaggerModule.setup(globalPrefix, app, document);
  if (writeToFile) {
    writeFileSync(`./swagger-spec.json`, JSON.stringify(document));
  }
}
