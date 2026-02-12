import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditQueueService } from './audit-queue.service';
import { MachineAuditProcessor } from './machine-audit.processor';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private auditQueueService: AuditQueueService,
    private machineAuditProcessor: MachineAuditProcessor,
  ) {}

  /**
   * 获取待审核列表
   */
  async getPendingList(params: {
    page: number;
    pageSize: number;
    status?: number;
  }) {
    const { page, pageSize, status = 0 } = params;

    const [list, total] = await this.postRepository.findAndCount({
      where: {
        auditStatus: status,
        isDeleted: false,
      },
      relations: ['user', 'circle'],
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取审核历史
   */
  async getAuditHistory(postId: number) {
    const logs = await this.auditLogRepository.find({
      where: { targetId: postId },
      order: {
        createdAt: 'DESC',
      },
    });

    return logs;
  }

  /**
   * 审核通过
   */
  async approve(postId: number, operator: string) {
    await this.postRepository.update(postId, {
      auditStatus: 1, // 已发布
    });

    // 记录审核日志
    await this.auditLogRepository.save({
      targetId: postId,
      auditType: 2, // 人工审核
      result: 1, // 通过
      operator,
    });

    return { success: true };
  }

  /**
   * 审核驳回
   */
  async reject(postId: number, rejectReason: string, operator: string) {
    await this.postRepository.update(postId, {
      auditStatus: 2, // 驳回
      rejectReason,
    });

    // 记录审核日志
    await this.auditLogRepository.save({
      targetId: postId,
      auditType: 2, // 人工审核
      result: 2, // 驳回
      riskLabel: rejectReason,
      operator,
    });

    return { success: true };
  }

  /**
   * 批量审核
   */
  async batchAudit(postIds: number[], action: 'approve' | 'reject', operator: string, rejectReason?: string) {
    const status = action === 'approve' ? 1 : 2;

    await this.postRepository.update(
      {
        id: In(postIds),
        auditStatus: 0, // 只能审核待审核的
      },
      {
        auditStatus: status,
        rejectReason: rejectReason || null,
      },
    );

    // 批量记录审核日志
    const logs = postIds.map((postId) => ({
      targetId: postId,
      auditType: 2,
      result: status,
      riskLabel: rejectReason || null,
      operator,
    }));

    await this.auditLogRepository.save(logs);

    return { success: true, count: postIds.length };
  }

  /**
   * 获取审核统计
   */
  async getStats() {
    const [pending, approved, rejected] = await Promise.all([
      this.postRepository.count({ where: { auditStatus: 0, isDeleted: false } }),
      this.postRepository.count({ where: { auditStatus: 1, isDeleted: false } }),
      this.postRepository.count({ where: { auditStatus: 2, isDeleted: false } }),
    ]);

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
  }

  async getMachineStatus() {
    const queue = await this.auditQueueService.getQueueSize();
    return {
      ...this.machineAuditProcessor.getStatus(),
      queue,
    };
  }

  async runMachineReviewOnce() {
    const result = await this.machineAuditProcessor.processOne();
    const queue = await this.auditQueueService.getQueueSize();
    return {
      ...result,
      queue,
    };
  }
}
