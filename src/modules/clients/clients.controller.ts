import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(Role.LAWYER)
  @ApiOperation({ summary: 'Advogado cadastra novo cliente' })
  create(@CurrentUser('id') lawyerUserId: string, @Body() dto: CreateClientDto) {
    return this.clientsService.create(lawyerUserId, dto);
  }

  @Get()
  @Roles(Role.LAWYER)
  @ApiOperation({ summary: 'Lista clientes do advogado autenticado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser('id') lawyerUserId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.clientsService.findAll(lawyerUserId, page, limit);
  }

  @Get(':clientId')
  @Roles(Role.LAWYER)
  @ApiOperation({ summary: 'Detalhes de um cliente do advogado' })
  findOne(@CurrentUser('id') lawyerUserId: string, @Param('clientId') clientId: string) {
    return this.clientsService.findOne(lawyerUserId, clientId);
  }
}
