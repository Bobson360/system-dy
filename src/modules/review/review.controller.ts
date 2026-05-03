import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Review')
@Controller('review')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('queue')
  @Roles(Role.REVIEWER)
  @ApiOperation({ summary: 'Fila de demandas pendentes de revisão' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getQueue(
    @CurrentUser('id') reviewerUserId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewService.getQueue(reviewerUserId, page, limit);
  }

  @Post(':demandId/assign')
  @Roles(Role.REVIEWER)
  @ApiOperation({ summary: 'Revisor assume uma demanda da fila' })
  assign(@CurrentUser('id') reviewerUserId: string, @Param('demandId') demandId: string) {
    return this.reviewService.assign(reviewerUserId, demandId);
  }

  @Post(':demandId/submit')
  @Roles(Role.REVIEWER)
  @ApiOperation({ summary: 'Revisor conclui a revisão (aprovar ou rejeitar)' })
  submit(
    @CurrentUser('id') reviewerUserId: string,
    @Param('demandId') demandId: string,
    @Body() dto: SubmitReviewDto,
  ) {
    return this.reviewService.submit(reviewerUserId, demandId, dto);
  }

  @Get(':demandId')
  @Roles(Role.REVIEWER, Role.SUPERADMIN, Role.LAWYER)
  @ApiOperation({ summary: 'Detalhes da revisão de uma demanda' })
  findOne(@Param('demandId') demandId: string) {
    return this.reviewService.findReviewByDemand(demandId);
  }
}
