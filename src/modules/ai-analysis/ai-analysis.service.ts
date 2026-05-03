import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DemandStatus } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

interface AiResult {
  summary: string;
  risks: string[];
  actions: string[];
  confidence: number;
}

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('app.anthropicApiKey'),
    });
  }

  async analyze(demandId: string): Promise<void> {
    const demand = await this.prisma.demand.findUnique({
      where: { id: demandId },
      include: { documents: true },
    });

    if (!demand) throw new NotFoundException('Demanda não encontrada.');

    this.logger.log(`Iniciando análise IA para demanda ${demandId}`);

    const prompt = this.buildPrompt(demand);

    try {
      const startedAt = Date.now();
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: `Você é um assistente jurídico especializado. Analise a demanda jurídica fornecida e retorne um JSON válido com a estrutura:
{
  "summary": "resumo objetivo da demanda em 2-3 parágrafos",
  "risks": ["risco 1", "risco 2", ...],
  "actions": ["ação recomendada 1", "ação recomendada 2", ...],
  "confidence": 0.85
}
Seja objetivo, técnico e imparcial. O resultado é PRELIMINAR e será revisado por um humano.`,
        messages: [{ role: 'user', content: prompt }],
      });
      const durationMs = Date.now() - startedAt;

      const rawOutput = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = this.parseAiOutput(rawOutput);

      // Claude Sonnet 4.6 pricing: $3/M input tokens, $15/M output tokens
      const estimatedCostUsd =
        (response.usage.input_tokens / 1_000_000) * 3 +
        (response.usage.output_tokens / 1_000_000) * 15;

      await this.prisma.$transaction(async (tx) => {
        await tx.aiAnalysis.create({
          data: {
            demandId,
            model: response.model,
            promptTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            rawOutput,
            parsedSummary: parsed.summary,
            parsedRisks: parsed.risks,
            parsedActions: parsed.actions,
            confidence: parsed.confidence,
            isPreliminary: true,
            durationMs,
            estimatedCostUsd,
          },
        });

        await tx.demand.update({
          where: { id: demandId },
          data: { status: DemandStatus.PENDING_REVIEW },
        });

        await tx.demandStatusLog.create({
          data: {
            demandId,
            fromStatus: DemandStatus.ANALYZING,
            toStatus: DemandStatus.PENDING_REVIEW,
            changedById: 'system',
            reason: 'Análise de IA concluída',
          },
        });
      });

      this.logger.log(`Análise IA concluída para demanda ${demandId} em ${durationMs}ms (~$${estimatedCostUsd.toFixed(4)})`);
    } catch (error) {
      this.logger.error(`Falha na análise IA da demanda ${demandId}`, error);
      throw error;
    }
  }

  async analyzeMock(demandId: string): Promise<void> {
    const demand = await this.prisma.demand.findUnique({
      where: { id: demandId },
      include: { documents: true },
    });

    if (!demand) throw new NotFoundException('Demanda não encontrada.');

    this.logger.log(`Análise mock para demanda ${demandId}`);

    const startedAt = Date.now();

    const mockSummary = `Esta é uma análise preliminar automatizada da demanda "${demand.title}" na categoria ${demand.category}. Com base no conteúdo fornecido, foram identificados os principais aspectos legais relevantes que necessitam de atenção. A situação requer avaliação cuidadosa dos aspectos procedimentais e materiais aplicáveis. Esta análise é preliminar e deve ser revisada por um profissional habilitado antes de qualquer ação.`;

    const mockRisks = [
      'Possível decurso de prazo prescricional — verificar urgência',
      'Documentação incompleta pode enfraquecer a posição processual',
      'Complexidade da matéria pode demandar perícia especializada',
    ];

    const mockActions = [
      'Reunir toda documentação pertinente ao caso',
      'Verificar prazos processuais aplicáveis',
      'Consultar jurisprudência recente sobre o tema',
      'Notificar a parte contrária formalmente, se aplicável',
    ];

    const durationMs = Date.now() - startedAt + 800;
    const promptTokens = Math.floor(Math.random() * 500) + 300;
    const outputTokens = Math.floor(Math.random() * 400) + 200;
    const estimatedCostUsd = (promptTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;

    await this.prisma.$transaction(async (tx) => {
      // Remove previous analysis if re-analyzing
      await tx.aiAnalysis.deleteMany({ where: { demandId } });

      await tx.aiAnalysis.create({
        data: {
          demandId,
          model: 'claude-sonnet-4-6-mock',
          promptTokens,
          outputTokens,
          rawOutput: JSON.stringify({ summary: mockSummary, risks: mockRisks, actions: mockActions, confidence: 0.82 }),
          parsedSummary: mockSummary,
          parsedRisks: mockRisks,
          parsedActions: mockActions,
          confidence: 0.82,
          isPreliminary: true,
          durationMs,
          estimatedCostUsd,
        },
      });

      await tx.demand.update({
        where: { id: demandId },
        data: { status: DemandStatus.PENDING_REVIEW },
      });

      await tx.demandStatusLog.create({
        data: {
          demandId,
          fromStatus: demand.status,
          toStatus: DemandStatus.PENDING_REVIEW,
          changedById: 'system',
          reason: 'Análise de IA (mock) concluída',
        },
      });
    });
  }

  async findByDemand(demandId: string) {
    return this.prisma.aiAnalysis.findUnique({ where: { demandId } });
  }

  async getStats() {
    const [total, aggregate] = await Promise.all([
      this.prisma.aiAnalysis.count(),
      this.prisma.aiAnalysis.aggregate({
        _sum: { estimatedCostUsd: true, promptTokens: true, outputTokens: true },
        _avg: { durationMs: true, confidence: true },
      }),
    ]);

    return {
      totalAnalyses: total,
      totalCostUsd: aggregate._sum.estimatedCostUsd ?? 0,
      totalInputTokens: aggregate._sum.promptTokens ?? 0,
      totalOutputTokens: aggregate._sum.outputTokens ?? 0,
      avgDurationMs: Math.round(aggregate._avg.durationMs ?? 0),
      avgConfidence: aggregate._avg.confidence ?? 0,
    };
  }

  private buildPrompt(demand: any): string {
    return `
DEMANDA JURÍDICA
================
Título: ${demand.title}
Categoria: ${demand.category}
Data: ${demand.createdAt.toISOString()}

Descrição:
${demand.body}

${demand.documents?.length > 0 ? `Documentos anexados: ${demand.documents.map((d: any) => d.fileName).join(', ')}` : ''}

Por favor, analise esta demanda e forneça um parecer jurídico preliminar estruturado conforme solicitado.
`.trim();
  }

  private parseAiOutput(raw: string): AiResult {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      this.logger.warn('Falha ao parsear JSON da IA, usando fallback');
    }

    return {
      summary: raw,
      risks: [],
      actions: [],
      confidence: 0,
    };
  }
}
