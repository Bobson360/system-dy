import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, AiAnalysisModule, PaymentsModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
