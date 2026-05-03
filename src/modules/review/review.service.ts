import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { DemandStatus } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue(reviewerUserId: string, page: any = 1, limit: any = 20) {
    page  = +page  || 1;
    limit = +limit || 20;
    const reviewerProfile = await this.prisma.reviewerProfile.findUnique({
      where: { userId: reviewerUserId },
    });
    if (!reviewerProfile) throw new ForbiddenException('Perfil de revisor não encontrado.');

    const skip = (page - 1) * limit;

    const where: any = {
      status: DemandStatus.PENDING_REVIEW,
      review: { is: null },
    };

    if (reviewerProfile.specialties?.length > 0) {
      where.category = { in: reviewerProfile.specialties };
    }

    const [data, total] = await Promise.all([
      this.prisma.demand.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { include: { user: { select: { firstName: true, lastName: true } } } },
          lawyer: { include: { user: { select: { firstName: true, lastName: true } } } },
          aiAnalysis: {
            select: { id: true, parsedSummary: true, confidence: true, createdAt: true },
          },
        },
        orderBy: { updatedAt: 'asc' },
      }),
      this.prisma.demand.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async assign(reviewerUserId: string, demandId: string) {
    const reviewerProfile = await this.prisma.reviewerProfile.findUnique({
      where: { userId: reviewerUserId },
    });
    if (!reviewerProfile) throw new ForbiddenException();

    const demand = await this.prisma.demand.findUnique({ where: { id: demandId } });
    if (!demand) throw new NotFoundException('Demanda não encontrada.');
    if (demand.status !== DemandStatus.PENDING_REVIEW) {
      throw new BadRequestException('Demanda não está disponível para revisão.');
    }

    const existing = await this.prisma.review.findUnique({ where: { demandId } });
    if (existing) throw new BadRequestException('Demanda já possui revisão atribuída.');

    return this.prisma.review.create({
      data: {
        demandId,
        reviewerId: reviewerProfile.id,
      },
    });
  }

  async submit(reviewerUserId: string, demandId: string, dto: SubmitReviewDto) {
    const reviewerProfile = await this.prisma.reviewerProfile.findUnique({
      where: { userId: reviewerUserId },
    });
    if (!reviewerProfile) throw new ForbiddenException();

    const review = await this.prisma.review.findUnique({ where: { demandId } });
    if (!review) throw new NotFoundException('Revisão não encontrada.');
    if (review.reviewerId !== reviewerProfile.id) throw new ForbiddenException();
    if (review.completedAt) throw new BadRequestException('Revisão já foi concluída.');

    const newStatus = dto.approved ? DemandStatus.REVIEWED : DemandStatus.REJECTED;

    await this.prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { demandId },
        data: {
          approved: dto.approved,
          reviewNotes: dto.reviewNotes,
          editedSummary: dto.editedSummary,
          editedRisks: dto.editedRisks || [],
          editedActions: dto.editedActions || [],
          completedAt: new Date(),
        },
      });

      await tx.demand.update({
        where: { id: demandId },
        data: { status: newStatus },
      });

      await tx.demandStatusLog.create({
        data: {
          demandId,
          fromStatus: DemandStatus.PENDING_REVIEW,
          toStatus: newStatus,
          changedById: reviewerUserId,
          reason: dto.reviewNotes || (dto.approved ? 'Aprovado' : 'Rejeitado'),
        },
      });
    });

    return { success: true, status: newStatus };
  }

  async findReviewByDemand(demandId: string) {
    const review = await this.prisma.review.findUnique({
      where: { demandId },
      include: {
        reviewer: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!review) throw new NotFoundException('Revisão não encontrada.');
    return review;
  }
}
