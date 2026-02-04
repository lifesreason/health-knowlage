import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../entities/comment.entity';
import { Post } from '../../entities/post.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  /**
   * 创建评论
   */
  async createComment(userId: number, data: {
    postId: number;
    content: string;
    rootId?: number;
    replyToUserId?: number;
  }): Promise<Comment> {
    // 验证帖子是否存在
    const post = await this.postRepository.findOne({
      where: { id: data.postId, isDeleted: false, auditStatus: 1 },
    });

    if (!post) {
      throw new Error('帖子不存在');
    }

    const comment = this.commentRepository.create({
      userId,
      ...data,
      rootId: data.rootId || 0,
      replyToUserId: data.replyToUserId || 0,
      likeCount: 0,
      auditStatus: 1, // 先发后审
    });

    const saved = await this.commentRepository.save(comment);

    // 更新帖子评论数
    await this.postRepository.increment({ id: data.postId }, 'commentCount', 1);

    return saved;
  }

  /**
   * 获取评论列表
   */
  async getCommentList(params: {
    postId: number;
    page: number;
    pageSize: number;
    rootId?: number;
  }) {
    const { postId, page, pageSize, rootId } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replyToUser', 'replyToUser')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.isDeleted = false')
      .andWhere('comment.auditStatus = 1')
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    // 如果指定了 rootId，获取该根评论下的二级评论
    if (rootId !== undefined && rootId > 0) {
      queryBuilder.andWhere('comment.rootId = :rootId', { rootId });
    } else {
      // 获取一级评论
      queryBuilder.andWhere('comment.rootId = 0');
    }

    const [list, total] = await queryBuilder.getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: number, userId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, userId, isDeleted: false },
    });

    if (!comment) {
      throw new Error('评论不存在或无权删除');
    }

    await this.commentRepository.update(commentId, { isDeleted: true });

    // 更新帖子评论数
    await this.postRepository.decrement({ id: comment.postId }, 'commentCount', 1);

    return { message: '删除成功' };
  }

  /**
   * 点赞评论
   */
  async likeComment(commentId: number, userId: number) {
    // TODO: 实现评论点赞
    return { message: '点赞成功' };
  }

  /**
   * 取消点赞评论
   */
  async unlikeComment(commentId: number, userId: number) {
    // TODO: 实现取消点赞评论
    return { message: '取消点赞成功' };
  }
}