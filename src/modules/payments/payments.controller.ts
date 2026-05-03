import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('my')
  @Roles(Role.LAWYER)
  @ApiOperation({ summary: 'Histórico de pagamentos do advogado autenticado' })
  findMine(
    @CurrentUser('id') lawyerUserId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.findByLawyer(lawyerUserId, page, limit);
  }

  @Post(':paymentId/mark-paid')
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Marcar pagamento como pago (superadmin / webhook)' })
  markPaid(@Param('paymentId') paymentId: string) {
    return this.paymentsService.markPaid(paymentId);
  }

  @Post('check-overdue')
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Processar pagamentos vencidos (job manual)' })
  checkOverdue() {
    return this.paymentsService.checkOverdue();
  }
}
