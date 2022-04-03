import { getConnection, getRepository } from 'typeorm';
import Study from '../../entity/StudyEntity';
import StudyUser from '../../entity/StudyUserEntity';

interface SaveStudyUserRecordDTO {
  userId: string;
  studyId: string;
  tempBio: string;
}

export const saveStudyUserRecord = async ({
  userId,
  studyId,
  tempBio,
}: SaveStudyUserRecordDTO) => {
  await getRepository(StudyUser)
    .createQueryBuilder()
    .insert()
    .values({
      USER_ID: userId,
      STUDY_ID: studyId,
      isAccepted: false,
      tempBio,
    })
    .execute();
};

export const findStudyById = async (studyId: string) => {
  return await getRepository(Study)
    .createQueryBuilder('study')
    .where('study.id = :studyId', { studyId })
    .getOne();
};

export const findAllByStudyId = async (studyId: string) => {
  return await getRepository(StudyUser)
    .createQueryBuilder()
    .select()
    .where('STUDY_ID = :id', { id: studyId })
    .execute();
};

export const findAllIfParticipatedByUserId = async (userId: string) => {
  return await getConnection()
    .createQueryRunner()
    .query(
      'SELECT \
        STUDY.ID, STUDY.TITLE, STUDY.CREATED_AT, STUDY.VIEWS, \
        STUDY.BOOKMARK_COUNT, STUDY.CAPACITY, STUDY.MEMBERS_COUNT, STUDY_USER.IS_ACCEPTED \
      FROM STUDY \
      JOIN \
        STUDY_USER ON \
        STUDY_USER.STUDY_ID = STUDY.ID \
      WHERE \
        STUDY_USER.USER_ID = ?\
        ORDER BY STUDY.CREATED_AT',
      [userId]
    );
};

export const findAcceptedByStudyId = async (studyId: string) => {
  return await getRepository(StudyUser)
    .createQueryBuilder()
    .select()
    .where('STUDY_ID = :id', { id: studyId })
    .andWhere('IS_ACCEPTED = 1')
    .execute();
};

export const updateAcceptStatus = async (
  studyId: string,
  userId: string,
  accept = true
) => {
  return await getRepository(StudyUser)
    .createQueryBuilder()
    .update()
    .set({ isAccepted: accept })
    .where('STUDY_ID = :id', { id: studyId })
    .andWhere('USER_ID = :userid', { userid: userId })
    .execute();
};

export const updateUserTempBio = async (
  studyId: string,
  userId: string,
  tempBio: string
) => {
  return await getRepository(StudyUser)
    .createQueryBuilder()
    .update()
    .set({ tempBio })
    .where('STUDY_ID = :id', { id: studyId })
    .andWhere('USER_ID = :userid', { userid: userId })
    .execute();
};

export const deleteByStudyAndUserId = async (
  studyId: string,
  userId: string
) => {
  return await getRepository(StudyUser)
    .createQueryBuilder()
    .delete()
    .where('STUDY_ID = :id', { id: studyId })
    .andWhere('USER_ID = :userid', { userid: userId })
    .execute();
};
