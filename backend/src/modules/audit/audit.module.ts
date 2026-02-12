import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { Post } from '../../entities/post.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditQueueService } from './audit-queue.service';
import { MachineAuditProcessor } from './machine-audit.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Post, AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, AuditQueueService, MachineAuditProcessor],
  exports: [AuditService, AuditQueueService],
})
export class AuditModule {}
