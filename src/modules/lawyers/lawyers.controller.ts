import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LawyersService } from './lawyers.service';
import { CreateLawyerDto } from './dto/create-lawyer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, UserStatus, SubscriptionPlan } from '@prisma/client';

@ApiTags('Lawyers')
@Controller('lawyers')
export class LawyersController {
  constructor(private readonly lawyersService: LawyersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastro de novo advogado (aguarda aprovação do admin)' })
  register(@Body() dto: CreateLawyerDto) {
    return this.lawyersService.register(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos os advogados (superadmin)' })
  @ApiQuery({ name: 'page',        required: false, type: Number })
  @ApiQuery({ name: 'limit',       required: false, type: Number })
  @ApiQuery({ name: 'search',      required: false, type: String })
  @ApiQuery({ name: 'status',      required: false, enum: UserStatus })
  @ApiQuery({ name: 'plan',        required: false, enum: SubscriptionPlan })
  @ApiQuery({ name: 'adimplente',  required: false, type: Boolean })
  findAll(
    @Query('page')       page?: number,
    @Query('limit')      limit?: number,
    @Query('search')     search?: string,
    @Query('status')     status?: UserStatus,
    @Query('plan')       plan?: SubscriptionPlan,
    @Query('adimplente') adimplente?: string,
  ) {
    const adimplenteVal = adimplente === 'true' ? true : adimplente === 'false' ? false : undefined;
    return this.lawyersService.findAll(page, limit, search, status, plan, adimplenteVal);
  }

  @Get('delinquent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista advogados inadimplentes (superadmin)' })
  findDelinquent() {
    return this.lawyersService.findDelinquent();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhes de um advogado (superadmin)' })
  findOne(@Param('id') id: string) {
    return this.lawyersService.findById(id);
  }
}
