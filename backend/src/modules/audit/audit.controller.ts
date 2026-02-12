import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('审核管理')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(9)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * 获取待审核列表
   */
  @Get('pending')
  @ApiOperation({ summary: '获取待审核列表' })
  @ApiBearerAuth()
  async getPendingList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('status') status?: string,
  ) {
    return this.auditService.getPendingList({
      page: +page,
      pageSize: +pageSize,
      status: status ? +status : undefined,
    });
  }

  /**
   * 获取审核统计
   */
  @Get('stats')
  @ApiOperation({ summary: '获取审核统计' })
  @ApiBearerAuth()
  async getStats() {
    return this.auditService.getStats();
  }

  /**
   * 获取机审运行状态
   */
  @Get('machine/status')
  @ApiOperation({ summary: '获取机审运行状态' })
  async getMachineStatus() {
    return this.auditService.getMachineStatus();
  }

  /**
   * 手动触发一次机审消费
   */
  @Post('machine/run-once')
  @ApiOperation({ summary: '手动触发一次机审消费' })
  async runMachineReviewOnce() {
    return this.auditService.runMachineReviewOnce();
  }

  /**
   * 获取审核历史
   */
  @Get('history/:postId')
  @ApiOperation({ summary: '获取审核历史' })
  @ApiBearerAuth()
  async getAuditHistory(@Param('postId') postId: string) {
    return this.auditService.getAuditHistory(+postId);
  }

  /**
   * 审核通过
   */
  @Post(':postId/approve')
  @ApiOperation({ summary: '审核通过' })
  @ApiBearerAuth()
  async approve(@Param('postId') postId: string, @Request() req) {
    return this.auditService.approve(+postId, req.user?.username || 'ADMIN');
  }

  /**
   * 审核驳回
   */
  @Post(':postId/reject')
  @ApiOperation({ summary: '审核驳回' })
  @ApiBearerAuth()
  async reject(
    @Param('postId') postId: string,
    @Body('rejectReason') rejectReason: string,
    @Request() req,
  ) {
    return this.auditService.reject(+postId, rejectReason, req.user?.username || 'ADMIN');
  }

  /**
   * 批量审核
   */
  @Post('batch')
  @ApiOperation({ summary: '批量审核' })
  @ApiBearerAuth()
  async batchAudit(
    @Body('postIds') postIds: number[],
    @Body('action') action: 'approve' | 'reject',
    @Request() req,
    @Body('rejectReason') rejectReason?: string,
  ) {
    return this.auditService.batchAudit(postIds, action, req.user?.username || 'ADMIN', rejectReason);
  }
}
