import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import User from './UserEntity';

export enum WeekDayEnum {
  MON = 'mon',
  TUE = 'tue',
  WED = 'wed',
  THU = 'thu',
  FRI = 'fri',
  SAT = 'sat',
  SUN = 'sun',
}
export enum FrequencyEnum {
  ONCE = 'once',
  TWICE = 'twice',
  MORE = 'more',
}
export enum LocationEnum {
  NO_CONTACT = 'no_contact',
  ROOM = 'room',
  LIBRARY = 'library',
  S_CAFE = 'study_cafe',
  CAFE = 'cafe',
  LOC1 = 'loc1',
  LOC2 = 'loc2',
  ELSE = 'else',
}

@Entity({ name: 'STUDY' })
export default class Study {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt!: Date;

  @Column({ name: 'TITLE' })
  title!: string;

  @Column({ name: 'STUDY_ABOUT' })
  studyAbout!: string;

  @Column('enum', { enum: WeekDayEnum, name: 'WEEKDAY' })
  weekday!: WeekDayEnum;

  @Column('enum', { enum: FrequencyEnum, name: 'FREQUENCY' })
  frequency!: FrequencyEnum;

  @Column('enum', { enum: LocationEnum, name: 'LOCATION' })
  location!: LocationEnum;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'HOST_ID' })
  hostId!: User;

  @Column('uuid')
  HOST_ID!: string;

  @Column('int', { name: 'CAPACITY' })
  capacity!: number;

  @Column('int', { name: 'MEMBERS_COUNT' })
  membersCount!: number;

  @Column('int', { name: 'VACANCY' })
  vacancy!: number;

  @Column({ name: 'IS_OPEN' })
  isOpen!: boolean;

  @Column('int', { name: 'CATEGORY_CODE' })
  categoryCode!: number;

  @Column('datetime', { name: 'DUE_DATE' })
  dueDate!: Date;

  @Column('int', { name: 'VIEWS' })
  views!: number;

  @Column('int', { name: 'BOOKMARK_COUNT' })
  bookmarkCount!: number;

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: 'BOOKMARK',
    joinColumn: {
      name: 'STUDY_ID',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'USER_ID',
      referencedColumnName: 'id',
    },
  })
  bookmarks!: User[];
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
 *        description: "개별 스터디 구분하는 고유 id"
 *      createdAt:
 *        type: string
 *        format: date-time
 *        description: "스터디 등록 날짜와 시간"
 *      title:
 *        type: string
 *        description: "스터디 이름"
 *      studyAbout:
 *        type: string
 *        description: "스터디 내용"
 *      weekday:
 *        type: string
 *        enum:
 *        - "mon"
 *        - "tue"
 *        - "wed"
 *        - "thu"
 *        - "fri"
 *        - "sat"
 *        - "sun"
 *        description: "스터디 요일"
 *      frequency:
 *        type: string
 *        enum:
 *        - "once"
 *        - "twice"
 *        - "more"
 *        description: "스터디 빈도"
 *      location:
 *        type: string
 *        enum:
 *        - "no_contact"
 *        - "studyroom"
 *        - "library"
 *        - "study_cafe"
 *        - "cafe"
 *        - "loc1"
 *        - "loc2"
 *        - "else"
 *        description: "스터디 장소"
 *      hostId:
 *        $ref: "#/definitions/User"
 *        description: "스터디 host의 id"
 *      capacity:
 *        type: integer
 *        description: "스터디 정원"
 *      membersCount:
 *        type: integer
 *        description: "현재 스터디 참가인원수"
 *      vacancy:
 *        type: integer
 *        description: "현재 빈자리 수"
 *      isOpen:
 *        type: boolean
 *        description: "모집중 여부"
 *      categoryCode:
 *        type: integer
 *        description: "스터디의 카테고리 코드"
 *      dueDate:
 *        type: string
 *        format: date-time
 *        description: "스터디의 마감 날짜"
 *      views:
 *        type: integer
 *        description: "현재 스터디 조회수"
 *      bookmarkCount:
 *        type: integer
 *        description: "현재 스터디에 등록된 북마크 개수"
 *
 *  Bookmark:
 *    type: object
 *    properties:
 *      userId:
 *        type: string
 *        format: uuid
 *        description: "북마크를 등록한 사용자의 id"
 *      studyId:
 *        type: string
 *        format: uuid
 *        description: "북마크를 등록된 study의 id"
 */
