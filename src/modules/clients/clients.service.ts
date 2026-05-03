import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(lawyerUserId: string, dto: CreateClientDto) {
    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({
      where: { userId: lawyerUserId },
    });
    if (!lawyerProfile) throw new ForbiddenException('Perfil de advogado não encontrado.');

    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado.');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: Role.CLIENT,
        status: UserStatus.ACTIVE,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        clientProfile: {
          create: {
            lawyerId: lawyerProfile.id,
            cpfCnpj: dto.cpfCnpj,
            address: dto.address,
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
        clientProfile: {
          select: { id: true, lawyerId: true },
        },
      },
    });
  }

  async findAll(lawyerUserId: string, page: any = 1, limit: any = 20) {
    page  = +page  || 1;
    limit = +limit || 20;
    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({
      where: { userId: lawyerUserId },
    });
    if (!lawyerProfile) throw new ForbiddenException('Perfil de advogado não encontrado.');

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.clientProfile.findMany({
        where: { lawyerId: lawyerProfile.id },
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
          _count: { select: { demands: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clientProfile.count({ where: { lawyerId: lawyerProfile.id } }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(lawyerUserId: string, clientId: string) {
    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({
      where: { userId: lawyerUserId },
    });
    if (!lawyerProfile) throw new ForbiddenException();

    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
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
        demands: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) throw new NotFoundException('Cliente não encontrado.');
    if (client.lawyerId !== lawyerProfile.id) throw new ForbiddenException('Acesso negado.');

    return client;
  }
}
