import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // 安全头部
  app.use(helmet());

  // 全局前缀
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // CORS 配置
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || '*';
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // 全局验证管道
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

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('银龄健康社区 API')
    .setDescription('银龄健康社区小程序后端接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', '认证模块')
    .addTag('user', '用户模块')
    .addTag('content', '内容模块')
    .addTag('community', '社区模块')
    .addTag('audit', '审核模块')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 应用启动成功`);
  logger.log(`📝 API 文档地址: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`🌐 服务地址: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();