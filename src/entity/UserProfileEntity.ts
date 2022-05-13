import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import Comment from './CommentEntity';
import Notice from './NoticeEntity';
import User from './UserEntity';

export enum GradeEnum {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}
@Entity({ name: 'USER_PROFILE' })
export default class UserProfile {
  @PrimaryColumn('uuid')
  USER_ID!: string;

  @OneToOne(() => User, (user) => user.id, { cascade: true })
  @JoinColumn({ name: 'USER_ID' })
  id!: User;

  @Column({ name: 'EMAIL' })
  email!: string;

  @Column({ name: 'USER_NAME' })
  userName!: string;

  // FIXME: enum type으로 수정
  @Column({ name: 'DEPT' })
  dept!: string;

  @Column('enum', { enum: GradeEnum, name: 'GRADE' })
  grade!: number;

  @Column({ name: 'BIO' })
  bio!: string;

  @Column({ name: 'USER_ABOUT' })
  userAbout!: string;

  @Column({ name: 'SHOW_DEPT' })
  showDept!: boolean;

  @Column({ name: 'SHOW_GRADE' })
  showGrade!: boolean;

  @Column({ name: 'ON_BREAK' })
  onBreak!: boolean;

  @Column('simple-array', { name: 'USER_INTEREST_CATEGORY' })
  categories!: string[];

  @Column({ name: 'LINK1', type: 'longtext' })
  link1!: string;

  @Column({ name: 'LINK2', type: 'longtext' })
  link2!: string;

  @Column({ name: 'LINK3', type: 'longtext' })
  link3!: string;

  @Column({ name: 'IMAGE' })
  image!: string;

  @OneToMany(() => Comment, (comment) => comment.user)
  comments!: Comment[];

  @OneToMany(() => Notice, (notice) => notice.hostId)
  notices!: Notice[];
}

/**
 * @swagger
 * definitions:
 *  Study:
 *    type: object
 *    properties:
 *      id:
 *        type: string
 *        format: uuid
 *        description: "사용자의 id"
 *      email:
 *        type: string
 *        description: "로그인 시 사용되는 email"
 *      userName:
 *        type: string
 *        description: "사용자의 닉네임"
 *      dept:
 *        type: string
 *        description: "사용자의 학과 정보"
 *      grade:
 *        type: string
 *        description: "사용자의 학년 정보"
 *      bio:
 *        type: string
 *        description: "사용자의 프로필 소개 문구"
 *      userAbout:
 *        type: string
 *        description: "사용자의 자기소개 글"
 *      showDept:
 *        type: boolean
 *        description: "스터디 신청 시 학과 정보 공개 여부"
 *      showGrade:
 *        type: boolean
 *        description: "스터디 신청 시 학년 정보 공개 여부"
 *      onBreak:
 *        type: boolean
 *        description: "사용자의 재학 상태 정보"
 *      categories:
 *        type: [string]
 *        description: "사용자 관심 카테고리"
 *      link1:
 *        type: string
 *        description: "프로필에 등록할 링크1"
 *      link2:
 *        type: string
 *        description: "프로필에 등록할 링크2"
 *      link3:
 *        type: string
 *        description: "프로필에 등록할 링크3"
 *      image:
 *        type: string
 *        description: "프로필 이미지"
 */
