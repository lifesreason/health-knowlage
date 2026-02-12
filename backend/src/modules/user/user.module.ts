import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from '../../entities/user.entity';
import { Collect } from '../../entities/collect.entity';
import { Post } from '../../entities/post.entity';
import { Follow } from '../../entities/follow.entity';
import { History } from '../../entities/history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Collect, Post, Follow, History])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
