import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    uploadedById: string,
    file: Express.Multer.File,
    demandId?: string,
    clientId?: string,
  ) {
    if (demandId) {
      const demand = await this.prisma.demand.findUnique({ where: { id: demandId } });
      if (!demand) throw new NotFoundException('Demanda não encontrada.');
    }

    if (clientId) {
      const client = await this.prisma.clientProfile.findUnique({ where: { id: clientId } });
      if (!client) throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.document.create({
      data: {
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedById,
        demandId: demandId || null,
        clientId: clientId || null,
      },
    });
  }

  async findByDemand(demandId: string) {
    return this.prisma.document.findMany({
      where: { demandId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.document.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, userRole: Role, documentId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Documento não encontrado.');

    if (userRole !== Role.SUPERADMIN && doc.uploadedById !== userId) {
      throw new ForbiddenException('Sem permissão para excluir este documento.');
    }

    await this.prisma.document.delete({ where: { id: documentId } });

    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'uploads', path.basename(doc.fileUrl));
    await fs.unlink(filePath).catch(() => {});
  }
}
