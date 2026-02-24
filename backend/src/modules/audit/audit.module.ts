import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { Post } from '../../entities/post.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditQueueService } from './audit-queue.service';
import { MachineAuditProcessor } from './machine-audit.processor';
import { MachineAuditService } from './machine-audit.service';
import { MachineAuditConfigValidator } from './machine-audit-config.validator';
import { MockMachineAuditProvider } from './providers/mock-machine-audit.provider';
import { AliyunMachineAuditProvider } from './providers/aliyun-machine-audit.provider';
import { TencentMachineAuditProvider } from './providers/tencent-machine-audit.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Post, AuditLog]), HttpModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditQueueService,
    MachineAuditProcessor,
    MachineAuditService,
    MachineAuditConfigValidator,
    MockMachineAuditProvider,
    AliyunMachineAuditProvider,
    TencentMachineAuditProvider,
  ],
  exports: [AuditService, AuditQueueService],
})
export class AuditModule {}
