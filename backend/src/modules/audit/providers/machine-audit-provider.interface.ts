export type MachineAuditDecision = 'pass' | 'review' | 'reject';

export interface MachineAuditPayload {
  postId: number;
  type: number;
  title?: string;
  content?: string;
  mediaUrls?: string[];
}

export interface MachineAuditResult {
  provider: 'mock' | 'aliyun' | 'tencent';
  decision: MachineAuditDecision;
  riskLabel?: string | null;
  reason?: string;
  confidence?: number;
  details?: Record<string, any>;
}

export interface MachineAuditProvider {
  review(payload: MachineAuditPayload): Promise<MachineAuditResult>;
}
