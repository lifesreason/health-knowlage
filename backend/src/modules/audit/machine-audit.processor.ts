import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditQueueService } from './audit-queue.service';
import { MachineAuditService } from './machine-audit.service';

@Injectable()
export class MachineAuditProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MachineAuditProcessor.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private readonly retryCounter = new Map<number, number>();

  constructor(
    private readonly configService: ConfigService,
    private readonly auditQueueService: AuditQueueService,
    private readonly machineAuditService: MachineAuditService,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  onModuleInit() {
    if (!this.isEnabled()) {
      return;
    }

    const interval = this.getIntervalMs();
    this.timer = setInterval(() => {
      this.processBatch().catch((error) => {
        this.logger.error(`Machine review tick failed: ${error.message}`);
      });
    }, interval);

    this.logger.log(
      `Machine review processor started, interval=${interval}ms, batchSize=${this.getBatchSize()}, provider=${this.machineAuditService.getProviderName()}`,
    );
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async processOne() {
    if (this.running) {
      return { processed: false, reason: 'busy' as const };
    }

    this.running = true;
    try {
      return await this.consumeOne();
    } finally {
      this.running = false;
    }
  }

  async processBatch() {
    if (this.running) {
      return { processed: 0, reason: 'busy' as const };
    }

    this.running = true;
    let processed = 0;
    const batchSize = this.getBatchSize();

    try {
      for (let i = 0; i < batchSize; i++) {
        const result = await this.consumeOne();
        if (!result?.processed && result?.reason === 'empty_queue') {
          break;
        }
        if (result?.processed) {
          processed += 1;
        }
      }

      return { processed };
    } finally {
      this.running = false;
    }
  }

  getStatus() {
    return {
      enabled: this.isEnabled(),
      running: this.running,
      intervalMs: this.getIntervalMs(),
      batchSize: this.getBatchSize(),
      provider: this.machineAuditService.getProviderName(),
      autoPass: this.getAutoPass(),
      autoReject: this.getAutoReject(),
      maxRetry: this.getMaxRetry(),
    };
  }

  private async consumeOne() {
    const postId = await this.auditQueueService.dequeuePost();
    if (!postId) {
      return { processed: false, reason: 'empty_queue' as const };
    }

    const post = await this.postRepository.findOne({
      where: { id: postId, isDeleted: false, auditStatus: 0 },
    });
    if (!post) {
      this.retryCounter.delete(postId);
      return { processed: false, reason: 'post_not_found_or_not_pending' as const, postId };
    }

    try {
      const review = await this.machineAuditService.reviewPost(post);
      this.retryCounter.delete(postId);

      const autoPass = this.getAutoPass();
      const autoReject = this.getAutoReject();
      let auditResult = 3; // 复审
      let action: 'auto_approve' | 'auto_reject' | 'manual_review' = 'manual_review';
      let nextAuditStatus = 0;
      let rejectReason: string | null = null;

      if (review.decision === 'pass' && autoPass) {
        auditResult = 1;
        action = 'auto_approve';
        nextAuditStatus = 1;
      } else if (review.decision === 'reject' && autoReject) {
        auditResult = 2;
        action = 'auto_reject';
        nextAuditStatus = 2;
        rejectReason = review.reason || '内容疑似违规，已自动拦截';
      }

      if (nextAuditStatus !== 0) {
        await this.postRepository.update(postId, {
          auditStatus: nextAuditStatus,
          rejectReason,
        });
      }

      await this.auditLogRepository.save({
        targetId: postId,
        auditType: 1,
        result: auditResult,
        riskLabel: review.riskLabel || null,
        details: JSON.stringify({
          provider: review.provider,
          decision: review.decision,
          action,
          confidence: review.confidence,
          reason: review.reason,
          details: review.details || null,
        }),
        operator: 'MACHINE',
      });

      return {
        processed: true,
        postId,
        provider: review.provider,
        decision: review.decision,
        action,
        auditResult,
        nextAuditStatus,
      };
    } catch (error) {
      const maxRetry = this.getMaxRetry();
      const currentRetry = (this.retryCounter.get(postId) || 0) + 1;

      if (currentRetry <= maxRetry) {
        this.retryCounter.set(postId, currentRetry);
        await this.auditQueueService.enqueuePost(postId).catch(() => undefined);
        this.logger.warn(`Machine review failed postId=${postId}, retry=${currentRetry}, error=${error.message}`);
        return {
          processed: false,
          reason: 'provider_error_retry' as const,
          postId,
          retry: currentRetry,
        };
      }

      this.retryCounter.delete(postId);
      await this.auditLogRepository.save({
        targetId: postId,
        auditType: 1,
        result: 3,
        riskLabel: 'provider_error',
        details: JSON.stringify({
          provider: this.machineAuditService.getProviderName(),
          action: 'manual_review',
          error: error.message,
          retryExhausted: true,
          maxRetry,
        }),
        operator: 'MACHINE',
      });

      this.logger.error(`Machine review failed postId=${postId}, retry exhausted (${maxRetry}): ${error.message}`);
      return {
        processed: true,
        postId,
        decision: 'review' as const,
        action: 'manual_review' as const,
        reason: 'provider_error',
      };
    }
  }

  private isEnabled(): boolean {
    return this.readBoolean(['AUDIT_MACHINE_REVIEW_ENABLED', 'AUDIT_MACHINE_ENABLED'], false);
  }

  private getIntervalMs(): number {
    return this.readNumber(['AUDIT_MACHINE_REVIEW_INTERVAL_MS', 'AUDIT_MACHINE_INTERVAL_MS'], 5000);
  }

  private getBatchSize(): number {
    return this.readNumber(['AUDIT_MACHINE_BATCH_SIZE'], 1);
  }

  private getAutoPass(): boolean {
    return this.readBoolean(['AUDIT_MACHINE_AUTO_PASS'], true);
  }

  private getAutoReject(): boolean {
    return this.readBoolean(['AUDIT_MACHINE_AUTO_REJECT'], false);
  }

  private getMaxRetry(): number {
    return this.readNumber(['AUDIT_MACHINE_MAX_RETRY'], 2);
  }

  private readBoolean(keys: string[], defaultValue: boolean): boolean {
    for (const key of keys) {
      const raw = this.configService.get<string>(key);
      if (raw === undefined || raw === null || raw === '') continue;
      return String(raw).toLowerCase() === 'true';
    }
    return defaultValue;
  }

  private readNumber(keys: string[], defaultValue: number): number {
    for (const key of keys) {
      const raw = this.configService.get<string>(key);
      if (raw === undefined || raw === null || raw === '') continue;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) continue;
      return parsed;
    }
    return defaultValue;
  }
}
