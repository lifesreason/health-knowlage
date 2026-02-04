import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CircleService } from './circle.service';
import { CircleController } from './circle.controller';
import { Circle } from '../../entities/circle.entity';
import { Post } from '../../entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Circle, Post])],
  controllers: [CircleController],
  providers: [CircleService],
  exports: [CircleService],
})
export class CommunityModule {}