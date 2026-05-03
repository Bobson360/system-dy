import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, SubscriptionPlan } from '@prisma/client';

const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  STARTER: 99.9,
  PROFESSIONAL: 199.9,
  ENTERPRISE: 499.9,
};

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubscriptionPayment(lawyerId: string, plan: SubscriptionPlan) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    return this.prisma.payment.create({
      data: {
        lawyerId,
        plan,
        amount: PLAN_PRICES[plan],
        description: `Assinatura ${plan} — Desk-yura`,
        status: PaymentStatus.PENDING,
        dueDate,
      },
    });
  }

  async findByLawyer(lawyerUserId: string, page: any = 1, limit: any = 20) {
    page  = +page  || 1;
    limit = +limit || 20;
    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({
      where: { userId: lawyerUserId },
    });
    if (!lawyerProfile) throw new NotFoundException('Advogado não encontrado.');

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { lawyerId: lawyerProfile.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where: { lawyerId: lawyerProfile.id } }),
    ]);

    return { data, total, page, limit };
  }

  async markPaid(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado.');

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.PAID, paidAt: new Date() },
      });

      const planExpiresAt = new Date();
      planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);

      await tx.lawyerProfile.update({
        where: { id: payment.lawyerId },
        data: {
          isAdimplente: true,
          plan: payment.plan,
          planExpiresAt,
        },
      });

      return p;
    });

    return updated;
  }

  async checkOverdue() {
    const now = new Date();

    const overduePayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        dueDate: { lt: now },
      },
    });

    for (const payment of overduePayments) {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.OVERDUE },
        }),
        this.prisma.lawyerProfile.update({
          where: { id: payment.lawyerId },
          data: { isAdimplente: false },
        }),
      ]);
    }

    return { processed: overduePayments.length };
  }
}
