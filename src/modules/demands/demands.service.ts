import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDemandDto } from './dto/create-demand.dto';
import { UpdateDemandDto } from './dto/update-demand.dto';
import { DemandStatus, Role } from '@prisma/client';

@Injectable()
export class DemandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(lawyerUserId: string, dto: CreateDemandDto) {
    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({
      where: { userId: lawyerUserId },
    });
    if (!lawyerProfile) throw new ForbiddenException('Perfil de advogado não encontrado.');

    if (!lawyerProfile.isAdimplente) {
      throw new ForbiddenException('Conta com pagamento pendente. Regularize para criar demandas.');
    }

    const client = await this.prisma.clientProfile.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado.');
    if (client.lawyerId !== lawyerProfile.id) {
      throw new ForbiddenException('Cliente não pertence a este advogado.');
    }

    const demand = await this.prisma.demand.create({
      data: {
        title: dto.title,
        body: dto.body,
        category: dto.category,
        status: DemandStatus.DRAFT,
        lawyerId: lawyerProfile.id,
        clientId: dto.clientId,
      },
      include: {
        client: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    await this.prisma.demandStatusLog.create({
      data: {
        demandId: demand.id,
        toStatus: DemandStatus.DRAFT,
        changedById: lawyerUserId,
      },
    });

    return demand;
  }

  async findAll(user: any, page: any = 1, limit: any = 20, status?: string) {
    page  = +page  || 1;
    limit = +limit || 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(user);
    if (status) (where as any).status = status;

    const [data, total] = await Promise.all([
      this.prisma.demand.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
          aiAnalysis: { select: { id: true, isPreliminary: true, confidence: true } },
          review: { select: { id: true, approved: true, completedAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.demand.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(user: any, demandId: string) {
    const demand = await this.prisma.demand.findUnique({
      where: { id: demandId },
      include: {
        client: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        lawyer: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
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

    if (!demand) throw new NotFoundException('Demanda não encontrada.');
    this.assertAccess(user, demand);
    return demand;
  }

  async update(lawyerUserId: string, demandId: string, dto: UpdateDemandDto) {
    const demand = await this.prisma.demand.findUnique({ where: { id: demandId } });
    if (!demand) throw new NotFoundException('Demanda não encontrada.');

    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({
      where: { userId: lawyerUserId },
    });
    if (demand.lawyerId !== lawyerProfile?.id) throw new ForbiddenException();

    return this.prisma.demand.update({
      where: { id: demandId },
      data: dto,
    });
  }

  async cancel(lawyerUserId: string, demandId: string) {
    const demand = await this.prisma.demand.findUnique({ where: { id: demandId } });
    if (!demand) throw new NotFoundException('Demanda não encontrada.');

    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({ where: { userId: lawyerUserId } });
    if (demand.lawyerId !== lawyerProfile?.id) throw new ForbiddenException();

    const nonCancellable: DemandStatus[] = [DemandStatus.CANCELLED, DemandStatus.COMPLETED, DemandStatus.REVIEWED];
    if (nonCancellable.includes(demand.status)) {
      throw new BadRequestException('Esta demanda não pode ser cancelada.');
    }

    const updated = await this.prisma.demand.update({
      where: { id: demandId },
      data: { status: DemandStatus.CANCELLED },
    });

    await this.prisma.demandStatusLog.create({
      data: {
        demandId,
        fromStatus: demand.status,
        toStatus: DemandStatus.CANCELLED,
        changedById: lawyerUserId,
        reason: 'Cancelado pelo advogado',
      },
    });

    return updated;
  }

  async reopen(lawyerUserId: string, demandId: string) {
    const demand = await this.prisma.demand.findUnique({ where: { id: demandId } });
    if (!demand) throw new NotFoundException('Demanda não encontrada.');

    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({ where: { userId: lawyerUserId } });
    if (demand.lawyerId !== lawyerProfile?.id) throw new ForbiddenException();

    const reopenable: DemandStatus[] = [DemandStatus.REJECTED, DemandStatus.CANCELLED];
    if (!reopenable.includes(demand.status)) {
      throw new BadRequestException('Somente demandas rejeitadas ou canceladas podem ser reabertas.');
    }

    await this.prisma.review.deleteMany({ where: { demandId } });

    const updated = await this.prisma.demand.update({
      where: { id: demandId },
      data: { status: DemandStatus.DRAFT, isPriority: false },
    });

    await this.prisma.demandStatusLog.create({
      data: {
        demandId,
        fromStatus: demand.status,
        toStatus: DemandStatus.DRAFT,
        changedById: lawyerUserId,
        reason: 'Reaberta pelo advogado',
      },
    });

    return updated;
  }

  async prioritize(lawyerUserId: string, demandId: string) {
    const demand = await this.prisma.demand.findUnique({ where: { id: demandId } });
    if (!demand) throw new NotFoundException('Demanda não encontrada.');

    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({ where: { userId: lawyerUserId } });
    if (demand.lawyerId !== lawyerProfile?.id) throw new ForbiddenException();

    if (demand.isPriority) throw new BadRequestException('Demanda já está priorizada.');

    const nonPrioritizable: DemandStatus[] = [DemandStatus.CANCELLED, DemandStatus.COMPLETED, DemandStatus.REVIEWED, DemandStatus.REJECTED];
    if (nonPrioritizable.includes(demand.status)) {
      throw new BadRequestException('Esta demanda não pode ser priorizada.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.demand.update({
        where: { id: demandId },
        data: { isPriority: true },
      });

      const charge = await tx.priorityCharge.create({
        data: {
          demandId,
          lawyerId: lawyerProfile.id,
          amount: 15.0,
          pixCode: 'pix@deskyura.com.br',
        },
      });

      return { ...updated, charge };
    });
  }

  async submit(lawyerUserId: string, demandId: string) {
    const demand = await this.prisma.demand.findUnique({ where: { id: demandId } });
    if (!demand) throw new NotFoundException();

    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({
      where: { userId: lawyerUserId },
    });
    if (demand.lawyerId !== lawyerProfile?.id) throw new ForbiddenException();
    if (demand.status !== DemandStatus.DRAFT) {
      throw new BadRequestException('Somente demandas em rascunho podem ser submetidas.');
    }

    const updated = await this.prisma.demand.update({
      where: { id: demandId },
      data: { status: DemandStatus.ANALYZING },
    });

    await this.prisma.demandStatusLog.create({
      data: {
        demandId,
        fromStatus: DemandStatus.DRAFT,
        toStatus: DemandStatus.ANALYZING,
        changedById: lawyerUserId,
      },
    });

    return updated;
  }

  private buildWhereClause(user: any) {
    if (user.role === Role.SUPERADMIN || user.role === Role.REVIEWER) return {};

    if (user.role === Role.LAWYER) {
      return { lawyer: { userId: user.id } };
    }

    if (user.role === Role.CLIENT) {
      return { client: { userId: user.id } };
    }

    return { id: 'none' };
  }

  private assertAccess(user: any, demand: any) {
    if (user.role === Role.SUPERADMIN || user.role === Role.REVIEWER) return;

    if (user.role === Role.LAWYER && demand.lawyer?.userId !== user.id) {
      throw new ForbiddenException('Acesso negado.');
    }

    if (user.role === Role.CLIENT && demand.client?.user?.id !== user.id) {
      throw new ForbiddenException('Acesso negado.');
    }
  }
}
