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
