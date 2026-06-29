import {
  Controller, Get, Post, Put, Delete, Patch,
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
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @Roles(Role.LAWYER)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(userId, dto);
  }

  @Get()
  @Roles(Role.LAWYER)
  findAll(@CurrentUser('id') userId: string) {
    return this.workflowsService.findAll(userId);
  }

  @Get(':id')
  @Roles(Role.LAWYER)
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workflowsService.findOne(userId, id);
  }

  @Put(':id')
  @Roles(Role.LAWYER)
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(userId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.LAWYER)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workflowsService.remove(userId, id);
  }

  @Post(':id/execute')
  @Roles(Role.LAWYER)
  execute(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ExecuteWorkflowDto,
  ) {
    return this.workflowsService.execute(userId, id, dto.input ?? {});
  }

  @Get(':id/executions')
  @Roles(Role.LAWYER)
  getExecutions(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workflowsService.getExecutions(userId, id);
  }
}
