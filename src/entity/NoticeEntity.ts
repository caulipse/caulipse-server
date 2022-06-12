import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import UserProfile from './UserProfileEntity';

@Entity({ name: 'NOTICE' })
export default class Notice {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;

  @Column('varchar', { name: 'TITLE', length: 40 })
  title!: string;

  @Column('varchar', { name: 'ABOUT', length: 500 })
  about!: string;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt!: Date;

  @Column({ name: 'VIEWS' })
  views!: number;

  @Column('uuid')
  HOST_ID!: string;

  @ManyToOne(() => UserProfile, (user) => user.notices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'HOST_ID' })
  hostId!: UserProfile;
}

/**
 * @swagger
 * definitions:
 *  Notice:
 *    type: object
 *    properties:
 *      id:
 *        type: string
 *        format: uuid
 *        description: "공지사항의 고유 id"
 *      title:
 *        type: string
 *        description: "공지사항의 제목"
 *      about:
 *        type: string
 *        description: "공지사항의 내용"
 *      createdAt:
 *        type: string
 *        format: date-time
 *        description: "공지사항 등록 날짜와 시간"
 *      views:
 *        type: integer
 *        description: "현재 공지사항의 조회수"
 *      hostId:
 *        type: string
 *        format: uuid
 *        description: "공지사항 작성자의 userid"
 */
