import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Post } from '../../entities/post.entity';
import {
  MachineAuditPayload,
  MachineAuditProvider,
  MachineAuditResult,
} from './providers/machine-audit-provider.interface';
import { MockMachineAuditProvider } from './providers/mock-machine-audit.provider';
import { AliyunMachineAuditProvider } from './providers/aliyun-machine-audit.provider';
import { TencentMachineAuditProvider } from './providers/tencent-machine-audit.provider';

@Injectable()
export class MachineAuditService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mockProvider: MockMachineAuditProvider,
    private readonly aliyunProvider: AliyunMachineAuditProvider,
    private readonly tencentProvider: TencentMachineAuditProvider,
  ) {}

  async reviewPost(post: Post): Promise<MachineAuditResult> {
    const provider = this.getProvider();
    const payload: MachineAuditPayload = {
      postId: post.id,
      type: post.type,
      title: post.title,
      content: post.content,
      mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
    };

    return provider.review(payload);
  }

  getProviderName(): 'mock' | 'aliyun' | 'tencent' {
    const provider = (this.configService.get<string>('AUDIT_MACHINE_PROVIDER') || 'mock').toLowerCase();
    if (provider === 'aliyun' || provider === 'tencent') {
      return provider;
    }
    return 'mock';
  }

  private getProvider(): MachineAuditProvider {
    const provider = this.getProviderName();
    if (provider === 'aliyun') return this.aliyunProvider;
    if (provider === 'tencent') return this.tencentProvider;
    return this.mockProvider;
  }
}
