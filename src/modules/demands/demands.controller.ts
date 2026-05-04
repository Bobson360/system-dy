import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DemandsService } from './demands.service';
import { CreateDemandDto } from './dto/create-demand.dto';
import { UpdateDemandDto } from './dto/update-demand.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Demands')
@Controller('demands')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DemandsController {
  constructor(private readonly demandsService: DemandsService) {}

  @Post()
  @Roles(Role.LAWYER)
  @ApiOperation({ summary: 'Criar nova demanda (advogado)' })
  create(@CurrentUser('id') lawyerUserId: string, @Body() dto: CreateDemandDto) {
    return this.demandsService.create(lawyerUserId, dto);
  }

  @Get()
  @Roles(Role.LAWYER, Role.CLIENT, Role.REVIEWER, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Listar demandas (filtrado por perfil)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.demandsService.findAll(user, page, limit, status);
  }

  @Get(':demandId')
  @Roles(Role.LAWYER, Role.CLIENT, Role.REVIEWER, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Detalhes de uma demanda' })
  findOne(@CurrentUser() user: any, @Param('demandId') demandId: string) {
    return this.demandsService.findOne(user, demandId);
  }

  @Patch(':demandId')
  @Roles(Role.LAWYER)
  @ApiOperation({ summary: 'Atualizar demanda em rascunho' })
  update(
    @CurrentUser('id') lawyerUserId: string,
    @Param('demandId') demandId: string,
    @Body() dto: UpdateDemandDto,
  ) {
    return this.demandsService.update(lawyerUserId, demandId, dto);
  }

  @Post(':demandId/submit')
  @Roles(Role.LAWYER)
  @ApiOperation({ summary: 'Submeter demanda para análise da IA' })
  submit(@CurrentUser('id') lawyerUserId: string, @Param('demandId') demandId: string) {
    return this.demandsService.submit(lawyerUserId, demandId);
  }

  @Post(':demandId/cancel')
  @Roles(Role.LAWYER)
  @ApiOperation({ summary: 'Cancelar demanda' })
  cancel(@CurrentUser('id') lawyerUserId: string, @Param('demandId') demandId: string) {
    return this.demandsService.cancel(lawyerUserId, demandId);
  }

  @Post(':demandId/reopen')
  @Roles(Role.LAWYER)
  @ApiOperation({ summary: 'Reabrir demanda rejeitada ou cancelada' })
  reopen(@CurrentUser('id') lawyerUserId: string, @Param('demandId') demandId: string) {
    return this.demandsService.reopen(lawyerUserId, demandId);
  }

  @Post(':demandId/prioritize')
  @Roles(Role.LAWYER)
  @ApiOperation({ summary: 'Priorizar demanda (análise em até 30 min por R$ 15,00)' })
  prioritize(@CurrentUser('id') lawyerUserId: string, @Param('demandId') demandId: string) {
    return this.demandsService.prioritize(lawyerUserId, demandId);
  }
}
