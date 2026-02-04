import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('sys_audit_log')
@Index(['targetId'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'target_id' })
  targetId: number;

  @Column({ type: 'tinyint', name: 'audit_type' })
  auditType: number; // 1: 机器, 2: 人工

  @Column({ type: 'tinyint' })
  result: number; // 1: 通过, 2: 驳回, 3: 复审

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'risk_label' })
  riskLabel: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ type: 'varchar', length: 32, default: 'SYSTEM' })
  operator: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}