import { getRepository } from 'typeorm';
import UserProfile from '../../../entity/UserProfileEntity';
import { Request, Response } from 'express';

export const createProfile = async (req: Request, res: Response) => {
  try {
    interface UserProfileInterface {
      userId: string;
      userName: string;
      dept: string;
      grade: string;
      bio: string;
      userAbout?: string;
      showDept?: boolean;
      showGrade?: boolean;
      onBreak?: boolean;
      email1?: string;
      email2?: string;
      email3?: string;
      link1?: string;
      link2?: string;
    }
    const {
      userId,
      userName,
      dept,
      grade,
      bio,
      userAbout = '',
      showGrade = true,
      showDept = true,
      onBreak = false,
      email1 = '',
      email2 = '',
      email3 = '',
      link1 = '',
      link2 = '',
    }: UserProfileInterface = req.body;

    const userProfileRepo = getRepository(UserProfile);
    const userProfile = new UserProfile();
    userProfile.USER_ID = userId;
    userProfile.userName = userName;
    userProfile.dept = dept;
    userProfile.grade = grade;
    userProfile.bio = bio;
    userProfile.userAbout = userAbout;
    userProfile.showGrade = showGrade;
    userProfile.showDept = showDept;
    userProfile.onBreak = onBreak;
    userProfile.email1 = email1;
    userProfile.email2 = email2;
    userProfile.email3 = email3;
    userProfile.link1 = link1;
    userProfile.link2 = link2;

    await userProfileRepo.save(userProfile);

    res.status(201).json({ message: 'Created. 유저가 생성되었습니다.' });
  } catch (err) {
    console.error(err);
    res.json({ error: (err as Error).message || (err as Error).toString() });
  }
};
