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
import UserProfile from './UserProfileEntity';

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

  @Column('varchar', { name: 'TITLE', length: 40 })
  title!: string;

  @Column('varchar', { name: 'STUDY_ABOUT', length: 2000 })
  studyAbout!: string;

  @Column('set', { enum: WeekDayEnum, name: 'WEEKDAY' })
  weekday!: WeekDayEnum[];

  @Column('enum', { enum: FrequencyEnum, name: 'FREQUENCY' })
  frequency!: FrequencyEnum;

  @Column('set', { enum: LocationEnum, name: 'LOCATION' })
  location!: LocationEnum[];

  @Column('uuid')
  HOST_ID!: string;

  @ManyToOne(() => UserProfile, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'HOST_ID' })
  hostId!: UserProfile;

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

  @Column('datetime', { select: false, name: 'DUE_DATE' })
  dueDate!: Date;

  @Column('int', { name: 'VIEWS' })
  views!: number;

  @Column('int', { name: 'BOOKMARK_COUNT' })
  bookmarkCount!: number;

  @ManyToMany(() => UserProfile, {
    cascade: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'BOOKMARK',
    joinColumn: {
      name: 'STUDY_ID',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'USER_ID',
      referencedColumnName: 'USER_ID',
    },
  })
  bookmarks!: UserProfile[];
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
 *        description: "?????? ????????? ???????????? ?????? id"
 *      createdAt:
 *        type: string
 *        format: date-time
 *        description: "????????? ?????? ????????? ??????"
 *      title:
 *        type: string
 *        description: "????????? ??????"
 *      studyAbout:
 *        type: string
 *        description: "????????? ??????"
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
 *        description: "????????? ??????"
 *      frequency:
 *        type: string
 *        enum:
 *        - "once"
 *        - "twice"
 *        - "more"
 *        description: "????????? ??????"
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
 *        description: "????????? ??????"
 *      hostId:
 *        $ref: "#/definitions/User"
 *        description: "????????? host??? id"
 *      capacity:
 *        type: integer
 *        description: "????????? ??????"
 *      membersCount:
 *        type: integer
 *        description: "?????? ????????? ???????????????"
 *      vacancy:
 *        type: integer
 *        description: "?????? ????????? ???"
 *      isOpen:
 *        type: boolean
 *        description: "????????? ??????"
 *      categoryCode:
 *        type: integer
 *        description: "???????????? ???????????? ??????"
 *      dueDate:
 *        type: string
 *        format: date-time
 *        description: "???????????? ?????? ??????"
 *      views:
 *        type: integer
 *        description: "?????? ????????? ?????????"
 *      bookmarkCount:
 *        type: integer
 *        description: "?????? ???????????? ????????? ????????? ??????"
 *
 *  Bookmark:
 *    type: object
 *    properties:
 *      userId:
 *        type: string
 *        format: uuid
 *        description: "???????????? ????????? ???????????? id"
 *      studyId:
 *        type: string
 *        format: uuid
 *        description: "???????????? ????????? study??? id"
 */
