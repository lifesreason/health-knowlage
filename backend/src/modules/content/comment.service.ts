import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Comment } from '../../entities/comment.entity';
import { Post } from '../../entities/post.entity';
import { Like } from '../../entities/like.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
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
      throw new NotFoundException('帖子不存在');
    }

    const comment = this.commentRepository.create({
      userId,
      ...data,
      rootId: data.rootId || 0,
      replyToUserId: data.replyToUserId || null,
      likeCount: 0,
      auditStatus: 0, // 先审后发
    });

    return this.commentRepository.save(comment);
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
      throw new NotFoundException('评论不存在或无权删除');
    }

    await this.commentRepository.update(commentId, { isDeleted: true });

    // 仅已通过的评论会计入评论数
    if (comment.auditStatus === 1) {
      await this.postRepository.decrement({ id: comment.postId }, 'commentCount', 1);
    }

    return { message: '删除成功' };
  }

  /**
   * 点赞评论
   */
  async likeComment(commentId: number, userId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, isDeleted: false, auditStatus: 1 },
    });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const existing = await this.likeRepository.findOne({
      where: { userId, targetId: commentId, targetType: 2 },
    });
    if (existing) {
      throw new BadRequestException('已经点赞过了');
    }

    await this.likeRepository.save({
      userId,
      targetId: commentId,
      targetType: 2,
    });
    await this.commentRepository.increment({ id: commentId }, 'likeCount', 1);
    return { message: '点赞成功' };
  }

  /**
   * 取消点赞评论
   */
  async unlikeComment(commentId: number, userId: number) {
    const like = await this.likeRepository.findOne({
      where: { userId, targetId: commentId, targetType: 2 },
    });
    if (!like) {
      throw new BadRequestException('未点赞');
    }

    await this.likeRepository.remove(like);
    await this.commentRepository.decrement({ id: commentId }, 'likeCount', 1);
    return { message: '取消点赞成功' };
  }

  /**
   * 获取评论列表（管理后台）
   */
  async getAdminCommentList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    postId?: number;
    status?: number;
  }) {
    const { page, pageSize, keyword, postId, status } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.post', 'post')
      .where('comment.isDeleted = false');

    if (keyword) {
      queryBuilder.andWhere('comment.content LIKE :keyword', { keyword: `%${keyword}%` });
    }

    if (postId) {
      queryBuilder.andWhere('comment.postId = :postId', { postId });
    }
    if (status !== undefined) {
      queryBuilder.andWhere('comment.auditStatus = :status', { status });
    }

    queryBuilder
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

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
   * 删除评论（管理后台，不验证用户）
   */
  async adminDeleteComment(commentId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (comment) {
      await this.commentRepository.update(commentId, { isDeleted: true });
      if (comment.auditStatus === 1) {
        await this.postRepository.decrement({ id: comment.postId }, 'commentCount', 1);
      }
    }

    return { success: true };
  }

  /**
   * 评论审核通过（管理后台）
   */
  async approveComment(commentId: number, _operator: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, isDeleted: false },
    });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.auditStatus === 1) {
      return { success: true, status: 'already_approved' };
    }

    await this.commentRepository.update(commentId, { auditStatus: 1 });
    await this.postRepository.increment({ id: comment.postId }, 'commentCount', 1);
    return { success: true };
  }

  /**
   * 评论审核驳回（管理后台）
   */
  async rejectComment(commentId: number, _operator: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, isDeleted: false },
    });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.auditStatus === 2) {
      return { success: true, status: 'already_rejected' };
    }

    await this.commentRepository.update(commentId, { auditStatus: 2 });
    if (comment.auditStatus === 1) {
      await this.postRepository.decrement({ id: comment.postId }, 'commentCount', 1);
    }
    return { success: true };
  }

  /**
   * 批量审核评论（管理后台）
   */
  async batchAuditComments(commentIds: number[], action: 'approve' | 'reject', operator: string) {
    const ids = Array.from(
      new Set(
        (commentIds || [])
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item) && item > 0),
      ),
    );

    if (!ids.length) {
      return { success: true, count: 0 };
    }

    const comments = await this.commentRepository.find({
      where: {
        id: In(ids),
        isDeleted: false,
      },
      select: ['id'],
    });
    const validIds = comments.map((item) => item.id);

    for (const id of validIds) {
      if (action === 'approve') {
        await this.approveComment(id, operator);
      } else {
        await this.rejectComment(id, operator);
      }
    }

    return { success: true, count: validIds.length };
  }
}
