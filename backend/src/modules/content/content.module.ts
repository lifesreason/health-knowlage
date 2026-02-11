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
import { Post } from '../../entities/post.entity';
import { Circle } from '../../entities/circle.entity';
import { Like } from '../../entities/like.entity';
import { Comment } from '../../entities/comment.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Circle, Like, Comment, User])],
  controllers: [
    OssController,
    PostController,
    FeedController,
    InteractionController,
    CommentController,
    StatsController,
  ],
  providers: [OssService, PostService, InteractionService, CommentService],
  exports: [OssService, PostService, InteractionService, CommentService],
})
export class ContentModule {}