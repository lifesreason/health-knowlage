import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OssService } from './oss.service';
import { OssController } from './oss.controller';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { FeedController } from './feed.controller';
import { InteractionService } from './interaction.service';
import { InteractionController } from './interaction.controller';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { StatsController } from './stats.controller';
import { FeedCacheService } from './feed-cache.service';
import { ShareController } from './share.controller';
import { Post } from '../../entities/post.entity';
import { Circle } from '../../entities/circle.entity';
import { Like } from '../../entities/like.entity';
import { Collect } from '../../entities/collect.entity';
import { Follow } from '../../entities/follow.entity';
import { Comment } from '../../entities/comment.entity';
import { User } from '../../entities/user.entity';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Circle, Like, Collect, Follow, Comment, User]),
    AuditModule,
    AuthModule,
  ],
  controllers: [
    OssController,
    PostController,
    FeedController,
    InteractionController,
    CommentController,
    StatsController,
    ShareController,
  ],
  providers: [OssService, PostService, InteractionService, CommentService, FeedCacheService],
  exports: [OssService, PostService, InteractionService, CommentService, FeedCacheService],
})
export class ContentModule {}
