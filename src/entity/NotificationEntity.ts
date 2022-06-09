import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  PrimaryColumn,
} from 'typeorm';
import User from './UserEntity';
import Study from './StudyEntity';
import Notice from './NoticeEntity';

@Entity({ name: 'NOTIFICATION' })
export default class Notification {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;

  @PrimaryColumn('uuid')
  USER_ID!: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'USER_ID' })
  user!: User;

  @Column('uuid', { nullable: true })
  STUDY_ID!: string | null;

  @ManyToOne(() => Study, (study) => study.id, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'STUDY_ID' })
  study!: Study | null;

  @Column('uuid', { nullable: true })
  NOTICE_ID!: string | null;

  @ManyToOne(() => Notice, (notice) => notice.id, { nullable: true })
  @JoinColumn({ name: 'NOTICE_ID' })
  notice!: Notice | null;

  @Column({ name: 'TYPE' })
  type!: number;

  @Column({ name: 'TITLE' })
  title!: string;

  @Column({ name: 'NOTI_ABOUT' })
  notiAbout!: string;

  @Column({ name: 'READ' })
  read!: boolean;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt!: Date;
}

/**
 * @swagger
 * definitions:
 *   Notification:
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *         format: uuid
 *         description: "해당 알림을 받을 사용자 id"
 *       userId:
 *         type: string
 *         format: uuid
 *         description: "해당 알림이 발생할 사용자의 id"
 *       studyId:
 *         type: string
 *         format: uuid
 *         description: "해당 알림이 발생한 스터디의 id"
 *       noticeId:
 *         type: string
 *         format: uuid
 *         description: "해당 알림이 발생한 공지사항의 id"
 *       type:
 *         type: number
 *         description: "해당 알림이 어떠한 동작에 의해 발생했는지 표시"
 *       read:
 *         type: boolean
 *         description: "알림을 받은 사용자가 해당 알림을 읽었는지 여부"
 *       createdAt:
 *         type: string
 *         format: date-time
 *         description: "알림이 언제 생성되었는지"
 */
