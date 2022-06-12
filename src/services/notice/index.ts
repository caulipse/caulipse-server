import { randomUUID } from 'crypto';
import { getRepository } from 'typeorm';
import Notice from '../../entity/NoticeEntity';
import UserProfile from '../../entity/UserProfileEntity';

export const findNoticeCount = async () => {
  return await getRepository(Notice).createQueryBuilder().select().getCount();
};

export const findAllNotice = async ({
  amount,
  offset,
}: {
  amount: number;
  offset: number;
}) => {
  return await getRepository(Notice)
    .createQueryBuilder()
    .select()
    .orderBy('CREATED_AT', 'DESC')
    .limit(amount)
    .offset(offset * amount)
    .execute();
};

export const updateNoticeById = async ({
  noticeId,
  title,
  noticeAbout,
}: {
  noticeId: string;
  title: string;
  noticeAbout: string;
}) => {
  return await getRepository(Notice)
    .createQueryBuilder()
    .update()
    .set({
      title,
      about: noticeAbout,
    })
    .where('id = :id', { id: noticeId })
    .execute();
};

export const findNoticeById = async (noticeid: string) => {
  return await getRepository(Notice)
    .createQueryBuilder('notice')
    .leftJoinAndSelect('notice.hostId', 'UserProfile')
    .where('notice.id = :noticeid', { noticeid })
    .getOne();
};

export const updateNoticeViews = async (notice: Notice) => {
  notice.views += 1;
  return await getRepository(Notice).save(notice);
};

export const createNotice = async (
  title: string,
  about: string,
  user: UserProfile
) => {
  const noticeId = randomUUID();
  const notice = new Notice();
  notice.id = noticeId;
  notice.title = title;
  notice.about = about;
  notice.createdAt = new Date();
  notice.views = 0;
  notice.hostId = user;

  await getRepository(Notice).save(notice);
  return noticeId;
};

export const deleteNotice = async (notice: Notice) => {
  return await getRepository(Notice).remove(notice);
};
