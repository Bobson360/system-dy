import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LawyersModule } from './modules/lawyers/lawyers.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DemandsModule } from './modules/demands/demands.module';
import { AiAnalysisModule } from './modules/ai-analysis/ai-analysis.module';
import { ReviewModule } from './modules/review/review.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { DocumentsModule } from './modules/documents/documents.module';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    LawyersModule,
    ClientsModule,
    DemandsModule,
    AiAnalysisModule,
    ReviewModule,
    NotificationsModule,
    PaymentsModule,
    AdminModule,
    DocumentsModule,
  ],
})
export class AppModule {}
