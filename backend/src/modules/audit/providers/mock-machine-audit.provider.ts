import { Injectable } from '@nestjs/common';
import {
  MachineAuditPayload,
  MachineAuditProvider,
  MachineAuditResult,
} from './machine-audit-provider.interface';

@Injectable()
export class MockMachineAuditProvider implements MachineAuditProvider {
  async review(payload: MachineAuditPayload): Promise<MachineAuditResult> {
    const text = `${payload.title || ''} ${payload.content || ''}`.trim();
    const blockWords = this.parseWords(process.env.AUDIT_MACHINE_BLOCK_WORDS || '');
    const reviewWords = this.parseWords(process.env.AUDIT_MACHINE_REVIEW_WORDS || '');

    const hitBlockWord = blockWords.find((word) => text.includes(word));
    if (hitBlockWord) {
      return {
        provider: 'mock',
        decision: 'reject',
        riskLabel: hitBlockWord,
        reason: '命中拦截词',
        confidence: 0.95,
        details: {
          hitWord: hitBlockWord,
          ruleType: 'block',
        },
      };
    }

    const hitReviewWord = reviewWords.find((word) => text.includes(word));
    if (hitReviewWord) {
      return {
        provider: 'mock',
        decision: 'review',
        riskLabel: hitReviewWord,
        reason: '命中人工复审词',
        confidence: 0.78,
        details: {
          hitWord: hitReviewWord,
          ruleType: 'review',
        },
      };
    }

    return {
      provider: 'mock',
      decision: 'pass',
      riskLabel: null,
      reason: '未命中规则词',
      confidence: 0.99,
      details: {
        ruleType: 'pass',
      },
    };
  }

  private parseWords(raw: string): string[] {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
