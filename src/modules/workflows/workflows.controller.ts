import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';

@ApiTags('workflows')
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  // ── Rotas públicas (sem autenticação) ──────────────────────────────────────

  @Get(':id/public')
  getPublicForm(@Param('id') id: string) {
    return this.workflowsService.getPublicForm(id);
  }

  @Post(':id/submit')
  submitForm(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.workflowsService.submitForm(id, body);
  }

  // ── Rotas protegidas (LAWYER) ───────────────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(userId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  findAll(@CurrentUser('id') userId: string) {
    return this.workflowsService.findAll(userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workflowsService.findOne(userId, id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workflowsService.remove(userId, id);
  }

  @Post(':id/execute')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  execute(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ExecuteWorkflowDto,
  ) {
    return this.workflowsService.execute(userId, id, dto.input ?? {});
  }

  @Get(':id/executions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  getExecutions(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workflowsService.getExecutions(userId, id);
  }
}
