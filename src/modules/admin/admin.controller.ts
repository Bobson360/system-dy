import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly aiAnalysisService: AiAnalysisService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Métricas gerais da plataforma' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('pending-approvals')
  @ApiOperation({ summary: 'Lista usuários aguardando aprovação' })
  getPendingApprovals() {
    return this.adminService.getPendingApprovals();
  }

  @Post('users/:userId/approve')
  @ApiOperation({ summary: 'Aprovar cadastro de usuário' })
  approveUser(@Param('userId') userId: string) {
    return this.adminService.approveUser(userId);
  }

  @Post('users/:userId/block')
  @ApiOperation({ summary: 'Bloquear usuário' })
  blockUser(@Param('userId') userId: string) {
    return this.adminService.blockUser(userId);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Relatório de pagamentos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPaymentReport(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getPaymentReport(page, limit);
  }

  @Get('demands')
  @ApiOperation({ summary: 'Listar todas as demandas (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  getDemands(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getDemands(page, limit, status);
  }

  @Get('demands/:demandId')
  @ApiOperation({ summary: 'Detalhes de uma demanda (admin)' })
  getDemandDetail(@Param('demandId') demandId: string) {
    return this.adminService.getDemandDetail(demandId);
  }

  @Post('demands/:demandId/analyze')
  @ApiOperation({ summary: 'Disparar análise de IA (mock) para uma demanda' })
  analyzeDemand(@Param('demandId') demandId: string) {
    return this.aiAnalysisService.analyzeMock(demandId);
  }
}
