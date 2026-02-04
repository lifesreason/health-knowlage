import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('sys_doctor_profile')
export class DoctorProfile {
  @PrimaryColumn({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 32, name: 'real_name' })
  realName: string;

  @Column({ type: 'varchar', length: 64 })
  hospital: string;

  @Column({ type: 'varchar', length: 32 })
  department: string;

  @Column({ type: 'varchar', length: 32 })
  title: string;

  @Column({ type: 'varchar', length: 255, name: 'cert_img_url' })
  certImgUrl: string;

  @Column({ type: 'tinyint', default: 0, name: 'audit_status' })
  auditStatus: number; // 0: 待审, 1: 通过, 2: 驳回

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'reject_reason' })
  rejectReason: string;
}