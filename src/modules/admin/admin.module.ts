import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AiAnalysisModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
