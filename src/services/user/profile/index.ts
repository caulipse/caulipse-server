import { getRepository } from 'typeorm';
import UserProfile from '../../../entity/UserProfileEntity';

interface UserProfileInterface {
  userId: string;
  email: string;
  userName: string;
  dept: string;
  grade: number;
  bio?: string;
  userAbout?: string;
  showDept?: boolean;
  showGrade?: boolean;
  onBreak: boolean;
  link1?: string;
  link2?: string;
  link3?: string;
  categories?: string[];
  image?: string;
}

export const postUserProfile = async ({
  userId,
  email,
  userName,
  dept,
  grade = 1,
  bio = '',
  userAbout = '',
  showGrade = true,
  showDept = true,
  onBreak = false,
  link1 = '',
  link2 = '',
  link3 = '',
  categories = [],
  image = '',
}: UserProfileInterface) => {
  const userProfileRepo = getRepository(UserProfile);
  const userProfile = new UserProfile();
  userProfile.USER_ID = userId;
  userProfile.email = email;
  userProfile.userName = userName;
  userProfile.dept = dept;
  userProfile.grade = grade;
  userProfile.bio = bio;
  userProfile.userAbout = userAbout;
  userProfile.showGrade = showGrade;
  userProfile.showDept = showDept;
  userProfile.onBreak = onBreak;
  userProfile.link1 = link1;
  userProfile.link2 = link2;
  userProfile.link3 = link3;
  userProfile.categories = categories;
  userProfile.image = image;

  await userProfileRepo.save(userProfile);
};

export const findUserProfileById = async (paramId: string) => {
  const userProfile = await getRepository(UserProfile)
    .createQueryBuilder('userProfile')
    .select()
    .where('userProfile.USER_ID = :id', { id: paramId })
    .execute();

  if (!userProfile?.length)
    throw new Error('데이터베이스에 일치하는 요청값이 없습니다');

  return userProfile;
};

// TEMP
export const temp_findUserProfileById = async (userId: string) => {
  return await getRepository(UserProfile)
    .createQueryBuilder('userProfile')
    .where('userProfile.USER_ID = :userId', { userId })
    .getOne();
};

export const findUserProfileByUserName = async (paramUserName: string) => {
  const userProfile = await getRepository(UserProfile)
    .createQueryBuilder('userProfile')
    .select()
    .where('userProfile.USER_NAME = :username', { username: paramUserName })
    .execute();
  return userProfile;
};

export const updateUserProfile = async ({
  userId,
  email,
  userName,
  dept,
  grade,
  bio,
  showDept,
  showGrade,
  onBreak,
  link1,
  link2,
  link3,
  categories,
  userAbout,
  image,
}: UserProfileInterface) => {
  const result = await getRepository(UserProfile)
    .createQueryBuilder()
    .update()
    .set({
      userName,
      dept,
      grade,
      bio,
      showDept,
      showGrade,
      onBreak,
      link1,
      link2,
      link3,
      categories,
      userAbout,
      image,
    })
    .where('user_id = :id', { id: userId })
    .execute();
  return result;
};

export const deleteUserProfileByUserId = async (id: string) => {
  return await getRepository(UserProfile)
    .createQueryBuilder()
    .delete()
    .where('USER_ID = :id', { id })
    .execute();
};
