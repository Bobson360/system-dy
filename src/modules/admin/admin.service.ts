import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, DemandStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalUsers,
      totalLawyers,
      totalClients,
      activeLawyers,
      delinquentLawyers,
      totalDemands,
      demandsByStatus,
      recentPayments,
      subscriptionRevenue,
      priorityRevenue,
      aiStats,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.lawyerProfile.count(),
      this.prisma.clientProfile.count(),
      this.prisma.lawyerProfile.count({ where: { user: { status: UserStatus.ACTIVE } } }),
      this.prisma.lawyerProfile.count({ where: { isAdimplente: false } }),
      this.prisma.demand.count(),
      this.prisma.demand.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          lawyer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', paidAt: { gte: monthStart } },
      }),
      this.prisma.priorityCharge.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', paidAt: { gte: monthStart } },
      }),
      this.prisma.aiAnalysis.aggregate({
        _count: { id: true },
        _sum: { estimatedCostUsd: true, promptTokens: true, outputTokens: true },
        _avg: { durationMs: true, confidence: true },
      }),
    ]);

    const monthlyRevenue = (subscriptionRevenue._sum.amount || 0) + (priorityRevenue._sum.amount || 0);

    return {
      users: {
        total: totalUsers,
        lawyers: totalLawyers,
        clients: totalClients,
        activeLawyers,
        delinquentLawyers,
      },
      demands: {
        total: totalDemands,
        byStatus: demandsByStatus.reduce(
          (acc, cur) => ({ ...acc, [cur.status]: cur._count.id }),
          {} as Record<DemandStatus, number>,
        ),
      },
      payments: {
        recentPayments,
        monthlyRevenue,
      },
      ai: {
        totalAnalyses: aiStats._count.id,
        totalCostUsd: aiStats._sum.estimatedCostUsd ?? 0,
        totalInputTokens: aiStats._sum.promptTokens ?? 0,
        totalOutputTokens: aiStats._sum.outputTokens ?? 0,
        avgDurationMs: Math.round(aiStats._avg.durationMs ?? 0),
        avgConfidence: aiStats._avg.confidence ?? 0,
      },
    };
  }

  async approveUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
      select: { id: true, email: true, status: true, role: true },
    });
  }

  async blockUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.BLOCKED },
      select: { id: true, email: true, status: true, role: true },
    });
  }

  async getPendingApprovals() {
    return this.prisma.user.findMany({
      where: { status: UserStatus.PENDING_APPROVAL },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        lawyerProfile: { select: { oabNumber: true, oabState: true, specialties: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPaymentReport(page: any = 1, limit: any = 20) {
    page  = +page  || 1;
    limit = +limit || 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip,
        take: limit,
        include: {
          lawyer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count(),
    ]);

    return { data, total, page, limit };
  }

  async getDemands(page: any = 1, limit: any = 20, status?: string) {
    page  = +page  || 1;
    limit = +limit || 20;
    const skip = (page - 1) * limit;
    const where: any = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.demand.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          lawyer: { include: { user: { select: { firstName: true, lastName: true } } } },
          aiAnalysis: { select: { id: true, isPreliminary: true, confidence: true, durationMs: true, estimatedCostUsd: true } },
          review: { select: { id: true, approved: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.demand.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async reviewDemand(
    adminUserId: string,
    demandId: string,
    dto: {
      approved: boolean;
      reviewNotes?: string;
      editedSummary?: string;
      editedRisks?: string[];
      editedActions?: string[];
    },
  ) {
    const demand = await this.prisma.demand.findUniqueOrThrow({ where: { id: demandId } });
    if (demand.status !== DemandStatus.PENDING_REVIEW) {
      throw new BadRequestException('Demanda não está aguardando revisão.');
    }

    const newStatus = dto.approved ? DemandStatus.REVIEWED : DemandStatus.REJECTED;

    await this.prisma.$transaction(async (tx) => {
      await tx.review.upsert({
        where: { demandId },
        create: {
          demandId,
          approved: dto.approved,
          reviewNotes: dto.reviewNotes,
          editedSummary: dto.editedSummary,
          editedRisks: dto.editedRisks ?? [],
          editedActions: dto.editedActions ?? [],
          completedAt: new Date(),
        },
        update: {
          approved: dto.approved,
          reviewNotes: dto.reviewNotes,
          editedSummary: dto.editedSummary,
          editedRisks: dto.editedRisks ?? [],
          editedActions: dto.editedActions ?? [],
          completedAt: new Date(),
        },
      });

      await tx.demand.update({ where: { id: demandId }, data: { status: newStatus } });

      await tx.demandStatusLog.create({
        data: {
          demandId,
          fromStatus: DemandStatus.PENDING_REVIEW,
          toStatus: newStatus,
          changedById: adminUserId,
          reason: dto.reviewNotes || (dto.approved ? 'Aprovado pelo admin' : 'Rejeitado pelo admin'),
        },
      });
    });

    return { success: true, status: newStatus };
  }

  async getDemandDetail(demandId: string) {
    return this.prisma.demand.findUniqueOrThrow({
      where: { id: demandId },
      include: {
        client: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        lawyer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        documents: true,
        aiAnalysis: true,
        review: {
          include: {
            reviewer: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        statusLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
  }
}
