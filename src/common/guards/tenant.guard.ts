import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

/**
 * Garante isolamento de tenant: um advogado só acessa recursos dos seus próprios clientes.
 * Um cliente só acessa seus próprios recursos.
 * Revisores e Superadmins têm acesso irrestrito.
 *
 * Espera que a rota tenha :demandId ou :clientId no path params.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) return false;

    if (user.role === 'SUPERADMIN' || user.role === 'REVIEWER') {
      return true;
    }

    const { demandId, clientId } = req.params;

    if (demandId) {
      return this.checkDemandAccess(user, demandId);
    }

    if (clientId) {
      return this.checkClientAccess(user, clientId);
    }

    return true;
  }

  private async checkDemandAccess(user: any, demandId: string): Promise<boolean> {
    const demand = await this.prisma.demand.findUnique({
      where: { id: demandId },
      select: { lawyerId: true, clientId: true, client: { select: { userId: true } } },
    });

    if (!demand) return false;

    if (user.role === 'LAWYER') {
      if (demand.lawyerId !== user.lawyerProfile?.id) {
        throw new ForbiddenException('Acesso negado a este recurso.');
      }
      return true;
    }

    if (user.role === 'CLIENT') {
      if (demand.client.userId !== user.id) {
        throw new ForbiddenException('Acesso negado a este recurso.');
      }
      return true;
    }

    return false;
  }

  private async checkClientAccess(user: any, clientId: string): Promise<boolean> {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { lawyerId: true, userId: true },
    });

    if (!client) return false;

    if (user.role === 'LAWYER') {
      if (client.lawyerId !== user.lawyerProfile?.id) {
        throw new ForbiddenException('Acesso negado a este cliente.');
      }
      return true;
    }

    if (user.role === 'CLIENT') {
      if (client.userId !== user.id) {
        throw new ForbiddenException('Acesso negado.');
      }
      return true;
    }

    return false;
  }
}
