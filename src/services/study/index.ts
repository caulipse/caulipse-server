import { Brackets, getRepository } from 'typeorm';
import { randomUUID } from 'crypto';
import * as schedule from 'node-schedule';
import Study from '../../entity/StudyEntity';
import User from '../../entity/UserEntity';
import {
  orderByEnum,
  paginationDTO,
  searchStudyDTO,
  studyDTO,
} from '../../types/study.dto';
import {
  findAcceptedByStudyId,
  findNotAcceptedApplicantsByStudyId,
} from '../studyUser';
import { createStudyNoti } from '../notification';

const schedules: { [key: string]: schedule.Job } = {};

const countAllStudy = async (paginationDto: paginationDTO) => {
  const { categoryCode, frequencyFilter, weekdayFilter, locationFilter } =
    paginationDto;

  const query = await getRepository(Study).createQueryBuilder('study');

  if (categoryCode) {
    query.andWhere('study.categoryCode = :categoryCode', { categoryCode });
  }

  if (frequencyFilter) {
    query.andWhere('study.frequency = :frequencyFilter', { frequencyFilter });
  }
  if (weekdayFilter) {
    query.andWhere('study.weekday = :weekdayFilter', { weekdayFilter });
  }
  if (locationFilter) {
    query.andWhere('study.location = :locationFilter', { locationFilter });
  }
  return await query.getCount();
};

const getAllStudy = async (paginationDTO: paginationDTO) => {
  const {
    categoryCode,
    frequencyFilter,
    weekdayFilter,
    locationFilter,
    orderBy,
    pageNo,
    limit,
  } = paginationDTO;
  const offset = (pageNo - 1) * limit;

  const sq = getRepository(Study)
    .createQueryBuilder('study')
    .leftJoinAndSelect('study.hostId', 'user');

  if (categoryCode) {
    sq.andWhere('study.categoryCode = :categoryCode', { categoryCode });
  }

  if (frequencyFilter) {
    sq.andWhere('study.frequency = :frequencyFilter', { frequencyFilter });
  }
  if (weekdayFilter) {
    sq.andWhere('study.weekday = :weekdayFilter', { weekdayFilter });
  }
  if (locationFilter) {
    sq.andWhere('study.location = :locationFilter', { locationFilter });
  }

  if (orderBy === orderByEnum.LATEST) {
    sq.orderBy('study.createdAt', 'DESC');
  } else if (orderBy === orderByEnum.LAST) {
    sq.orderBy('study.createdAt', 'ASC');
  } else if (orderBy === orderByEnum.SMALL_VACANCY) {
    sq.orderBy('study.vacancy', 'ASC');
  } else if (orderBy === orderByEnum.LARGE_VACANCY) {
    sq.orderBy('study.vacancy', 'DESC');
  }
  return await sq.limit(limit).offset(offset).getMany();
};

const getMyStudy = async (userId: string) => {
  return await getRepository(Study)
    .createQueryBuilder('study')
    .leftJoinAndSelect('study.hostId', 'user')
    .where('study.HOST_ID = :userId', { userId })
    .orderBy('study.createdAt', 'ASC')
    .getMany();
};

const findStudyById = async (id: string) => {
  return await getRepository(Study)
    .createQueryBuilder('study')
    .leftJoinAndSelect('study.hostId', 'user')
    .where('study.id = :id', { id })
    .orderBy('study.createdAt', 'ASC')
    .getOne();
};

const updateStudyViews = async (study: Study) => {
  study.views += 1;
  return await getRepository(Study).save(study);
};

const createStudy = async (studyDTO: studyDTO, user: User) => {
  const {
    title,
    studyAbout,
    weekday,
    frequency,
    location,
    capacity,
    categoryCode,
    dueDate,
  } = studyDTO;
  const due = new Date(dueDate);
  const today = new Date();

  const studyId = randomUUID();
  const study = new Study();
  study.id = studyId;
  study.createdAt = today;
  study.title = title;
  study.studyAbout = studyAbout;
  study.weekday = weekday;
  study.frequency = frequency;
  study.location = location;
  study.capacity = capacity;
  study.membersCount = 0;
  study.vacancy = capacity;
  study.isOpen = true;
  study.hostId = user;
  study.views = 0;
  study.categoryCode = categoryCode;
  study.bookmarkCount = 0;
  study.dueDate = due;

  if (process.env.NODE_ENV !== 'test') {
    if (due.getFullYear() == today.getFullYear()) {
      schedules[`${studyId}`] = schedule.scheduleJob(
        `0 0 ${due.getDate()} ${due.getMonth()} *`,
        async function () {
          study.isOpen = false;
          const members = await findAcceptedByStudyId(studyId);
          if (members.length !== 0) {
            const notiTitle = '모집 종료';
            for (const member of members) {
              const notiAbout = `모집이 종료되었어요. 스터디를 응원합니다!`;
              await createStudyNoti(
                studyId,
                member?.USER_ID,
                notiTitle,
                notiAbout,
                107
              );
            }
          }
          const applicants = await findNotAcceptedApplicantsByStudyId(studyId);
          if (applicants.length !== 0) {
            const notiTitle = '모집 종료';
            for (const user of applicants) {
              const notiAbout = '스터디의 모집이 마감되었어요.';
              await createStudyNoti(
                studyId,
                user?.USER_ID,
                notiTitle,
                notiAbout,
                107
              );
            }
          }

          schedules[`${studyId}`].cancel();
          delete schedules[`${studyId}`];
        }
      );
    }
  }

  await getRepository(Study).save(study);
  return studyId;
};

const updateStudy = async (studyDTO: studyDTO, study: Study) => {
  const {
    title,
    studyAbout,
    weekday,
    frequency,
    location,
    capacity,
    categoryCode,
    dueDate,
  } = studyDTO;

  if (title) study.title = title;
  if (studyAbout) study.studyAbout = studyAbout;
  if (weekday) study.weekday = weekday;
  if (frequency) study.frequency = frequency;
  if (location) study.location = location;
  if (capacity) study.capacity = capacity;
  if (categoryCode) study.categoryCode = categoryCode;
  if (dueDate) {
    const due = new Date(dueDate);
    study.dueDate = due;
    if (process.env.NODE_ENV !== 'test') {
      schedules[`${study.id}`].cancel();
      schedules[`${study.id}`].reschedule(
        `0 0 ${due.getDate()} ${due.getMonth()} *`
      );
    }
  }
  return await getRepository(Study).save(study);
};

const deleteStudy = async (study: Study) => {
  return await getRepository(Study).remove(study);
};

const checkStudyById = async (id: string) => {
  // only for check
  return await getRepository(Study)
    .createQueryBuilder('study')
    .where('study.id = :id', { id })
    .getCount();
};

const searchStudy = async (searchStudyDTO: searchStudyDTO) => {
  const { keyword, frequencyFilter, weekdayFilter, locationFilter, orderBy } =
    searchStudyDTO;

  const query = getRepository(Study)
    .createQueryBuilder('study')
    .leftJoinAndSelect('study.hostId', 'user')
    .where(
      new Brackets((qb) => {
        qb.where('study.title LIKE :keyword', {
          keyword: `%${keyword}%`,
        }).orWhere('study.studyAbout LIKE :keyword', {
          keyword: `%${keyword}%`,
        });
      })
    );

  if (frequencyFilter) {
    query.andWhere('study.frequency = :frequencyFilter', { frequencyFilter });
  }
  if (weekdayFilter) {
    query.andWhere('study.weekday = :weekdayFilter', { weekdayFilter });
  }
  if (locationFilter) {
    query.andWhere('study.location = :locationFilter', { locationFilter });
  }

  if (orderBy === orderByEnum.LATEST) {
    query.orderBy('study.createdAt', 'DESC');
  } else if (orderBy === orderByEnum.LAST) {
    query.orderBy('study.createdAt', 'ASC');
  } else if (orderBy === orderByEnum.SMALL_VACANCY) {
    query.orderBy('study.vacancy', 'ASC');
  } else if (orderBy === orderByEnum.LARGE_VACANCY) {
    query.orderBy('study.vacancy', 'DESC');
  }
  return await query.getMany();
};

export const decreaseMemberCount = async (studyId: string) => {
  return getRepository(Study)
    .createQueryBuilder()
    .update()
    .set({
      membersCount: () => 'membersCount - 1',
      vacancy: () => 'vacancy + 1',
    })
    .where('ID = :id', { id: studyId })
    .execute();
};

export const increaseMemberCount = async (studyId: string) => {
  return getRepository(Study)
    .createQueryBuilder()
    .update()
    .set({
      membersCount: () => 'membersCount + 1',
      vacancy: () => 'vacancy - 1',
    })
    .where('ID = :id', { id: studyId })
    .execute();
};

export default {
  countAllStudy,
  getAllStudy,
  getMyStudy,
  findStudyById,
  updateStudyViews,
  createStudy,
  updateStudy,
  deleteStudy,
  checkStudyById,
  searchStudy,
  decreaseMemberCount,
  increaseMemberCount,
};
