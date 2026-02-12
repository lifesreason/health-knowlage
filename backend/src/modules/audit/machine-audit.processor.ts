import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditQueueService } from './audit-queue.service';

@Injectable()
export class MachineAuditProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MachineAuditProcessor.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditQueueService: AuditQueueService,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  onModuleInit() {
    const enabled = this.configService.get<string>('AUDIT_MACHINE_REVIEW_ENABLED') === 'true';
    if (!enabled) {
      return;
    }

    const interval = Number(this.configService.get<string>('AUDIT_MACHINE_REVIEW_INTERVAL_MS') || 5000);
    this.timer = setInterval(() => {
      this.processOne().catch((error) => {
        this.logger.error(`Machine review tick failed: ${error.message}`);
      });
    }, interval);
    this.logger.log(`Machine review processor started, interval=${interval}ms`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async processOne() {
    if (this.running) return;
    this.running = true;

    try {
      const postId = await this.auditQueueService.dequeuePost();
      if (!postId) {
        return { processed: false, reason: 'empty_queue' as const };
      }

      const post = await this.postRepository.findOne({
        where: { id: postId, isDeleted: false, auditStatus: 0 },
      });
      if (!post) {
        return { processed: false, reason: 'post_not_found_or_not_pending' as const, postId };
      }

      const blockWords = (this.configService.get<string>('AUDIT_MACHINE_BLOCK_WORDS') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const text = `${post.title || ''} ${post.content || ''}`;
      const hitWord = blockWords.find((word) => text.includes(word));
      const autoReject = this.configService.get<string>('AUDIT_MACHINE_AUTO_REJECT') === 'true';

      let result = 3; // 复审
      let riskLabel: string | null = null;
      let details: any = {
        engine: 'rule-based-placeholder',
        reviewRequired: true,
        matchedWord: null,
      };

      if (hitWord) {
        riskLabel = hitWord;
        details = {
          ...details,
          matchedWord: hitWord,
        };
        if (autoReject) {
          await this.postRepository.update(postId, {
            auditStatus: 2,
            rejectReason: '内容疑似违规，已自动拦截',
          });
          result = 2;
          details.reviewRequired = false;
        }
      }

      await this.auditLogRepository.save({
        targetId: postId,
        auditType: 1,
        result,
        riskLabel,
        details: JSON.stringify(details),
        operator: 'MACHINE',
      });

      return {
        processed: true,
        postId,
        result,
        riskLabel,
        autoRejected: result === 2,
      };
    } finally {
      this.running = false;
    }
  }

  getStatus() {
    return {
      enabled: this.configService.get<string>('AUDIT_MACHINE_REVIEW_ENABLED') === 'true',
      running: this.running,
      intervalMs: Number(this.configService.get<string>('AUDIT_MACHINE_REVIEW_INTERVAL_MS') || 5000),
      autoReject: this.configService.get<string>('AUDIT_MACHINE_AUTO_REJECT') === 'true',
    };
  }
}
