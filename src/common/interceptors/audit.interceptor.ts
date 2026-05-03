import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const method = req.method;

    const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!user || !writeMethods.includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user.id,
              action: method,
              entity: req.path,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });
        } catch {
          // Não bloqueia a resposta se o audit falhar
        }
      }),
    );
  }
}
