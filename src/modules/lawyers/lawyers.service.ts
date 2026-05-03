import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLawyerDto } from './dto/create-lawyer.dto';
import { Role, UserStatus, SubscriptionPlan } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class LawyersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: CreateLawyerDto) {
    const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (emailExists) throw new ConflictException('E-mail já cadastrado.');

    const oabExists = await this.prisma.lawyerProfile.findUnique({
      where: { oabNumber: dto.oabNumber },
    });
    if (oabExists) throw new ConflictException('Número OAB já cadastrado.');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: Role.LAWYER,
        status: UserStatus.PENDING_APPROVAL,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        lawyerProfile: {
          create: {
            oabNumber: dto.oabNumber,
            oabState: dto.oabState,
            specialties: dto.specialties || [],
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        lawyerProfile: {
          select: { id: true, oabNumber: true, oabState: true },
        },
      },
    });
  }

  async findById(id: string) {
    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            firstName: true,
            lastName: true,
            phone: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        clients: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true, status: true } },
            _count: { select: { demands: true } },
          },
        },
        demands: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, status: true, category: true, createdAt: true },
        },
        payments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true, status: true, plan: true, dueDate: true, paidAt: true },
        },
        _count: { select: { clients: true, demands: true, payments: true } },
      },
    });

    if (!lawyer) throw new NotFoundException('Advogado não encontrado.');
    return lawyer;
  }

  async findAll(
    page: any = 1,
    limit: any = 20,
    search?: string,
    status?: UserStatus,
    plan?: SubscriptionPlan,
    adimplente?: boolean,
  ) {
    page  = +page  || 1;
    limit = +limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName:  { contains: search, mode: 'insensitive' } } },
        { user: { email:     { contains: search, mode: 'insensitive' } } },
        { oabNumber:         { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.user = { ...where.user, status };
    if (plan)   where.plan = plan;
    if (adimplente !== undefined) where.isAdimplente = adimplente;

    const [data, total] = await Promise.all([
      this.prisma.lawyerProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              firstName: true,
              lastName: true,
              phone: true,
              createdAt: true,
            },
          },
          _count: { select: { clients: true, demands: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lawyerProfile.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findDelinquent() {
    return this.prisma.lawyerProfile.findMany({
      where: { isAdimplente: false },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, status: true },
        },
        payments: {
          where: { status: 'OVERDUE' },
          orderBy: { dueDate: 'asc' },
        },
      },
    });
  }
}
