import { getRepository } from 'typeorm';
import Study from '../../../entity/StudyEntity';
import UserProfile from '../../../entity/UserProfileEntity';

const findBookmarksByStudyId = async (id: string) => {
  return await getRepository(Study).find({
    relations: ['bookmarks'],
    where: { id },
  });
};

const registerBookmark = async (bookmarks: Study[], user: UserProfile) => {
  bookmarks.forEach((bookmark) => {
    bookmark.bookmarks.push(user);
    bookmark.bookmarkCount += 1;
  });

  await getRepository(Study).save(bookmarks);
};

// 북마크 여부
const checkBookmarked = async (userId: string, studyId: string) => {
  return await getRepository(Study)
    .createQueryBuilder('study')
    .leftJoin('study.bookmarks', 'UserProfile')
    .where('study.id = :studyId', { studyId })
    .andWhere('UserProfile.USER_ID = :userId', { userId })
    .getOne();
};

const getBookmarksByUser = async (userId: string) => {
  return await getRepository(Study)
    .createQueryBuilder('study')
    .addSelect('study.dueDate')
    .leftJoinAndSelect('study.bookmarks', 'UserProfile')
    .where('UserProfile.USER_ID = :userId', { userId })
    .orderBy('study.createdAt', 'DESC')
    .getMany();
};

const deleteBookmark = async (study: Study, user: UserProfile) => {
  const repo = getRepository(Study);
  study.bookmarkCount -= 1;
  await repo.save(study);

  return await repo
    .createQueryBuilder()
    .relation('bookmarks')
    .of(study)
    .remove(user);
};

export default {
  findBookmarksByStudyId,
  registerBookmark,
  checkBookmarked,
  getBookmarksByUser,
  deleteBookmark,
};
