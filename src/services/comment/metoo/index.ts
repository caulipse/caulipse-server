import { getRepository } from 'typeorm';
import Comment from '../../../entity/CommentEntity';
import UserProfile from '../../../entity/UserProfileEntity';

const findMetooByCommentId = async (id: string) => {
  return await getRepository(Comment).find({
    relations: ['metooComment'],
    where: { id },
  });
};

const registerMetoo = async (metoo: Comment[], user: UserProfile) => {
  metoo.forEach((metoo) => {
    metoo.metooComment.push(user);
    metoo.metooCount += 1;
  });

  await getRepository(Comment).save(metoo);
};

const deleteMetoo = async (comment: Comment, user: UserProfile) => {
  return await getRepository(Comment)
    .createQueryBuilder()
    .relation('metooComment')
    .of(comment)
    .remove(user);
};

// 나도 궁금해요 여부
const checkMetoo = async (userId: string, commentId: string) => {
  return await getRepository(Comment)
    .createQueryBuilder('comment')
    .select(['comment.id', 'comment.USER_ID'])
    .leftJoin('comment.metooComment', 'UserProfile')
    .where('comment.id = :commentId', { commentId })
    .andWhere('UserProfile.USER_ID = :userId', { userId })
    .getOne();
};

export default {
  findMetooByCommentId,
  registerMetoo,
  deleteMetoo,
  checkMetoo,
};
