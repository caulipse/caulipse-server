import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Study from './StudyEntity';
import UserProfile from './UserProfileEntity';

@Entity({ name: 'COMMENT' })
export default class Comment {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt!: Date;

  @Column({ name: 'IS_NESTED' })
  isNested!: boolean;

  @Column({ name: 'CONTENT' })
  content!: string;

  @Column('uuid', { nullable: true })
  USER_ID!: string | null;

  @ManyToOne(() => UserProfile, (user) => user.comments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'USER_ID' })
  user!: UserProfile | null;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  nestedComments!: Comment[];

  @ManyToOne(() => Comment, (comment) => comment.nestedComments, {
    nullable: true,
  })
  @JoinColumn({ name: 'NESTED_COMMENT_ID' })
  parentComment!: Comment | null;

  @Column('uuid', { nullable: true })
  NESTED_COMMENT_ID!: string | null;

  @Column('uuid')
  STUDY_ID!: string;

  @ManyToOne(() => Study, (study) => study.id)
  @JoinColumn({ name: 'STUDY_ID' })
  study!: Study;

  @Column('int', { name: 'METOO_COUNT' })
  metooCount!: number;

  @ManyToMany(() => UserProfile, { cascade: true, onDelete: 'CASCADE' })
  @JoinTable({
    name: 'USER_METOO_COMMENT',
    joinColumn: {
      name: 'COMMENT_ID',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'USER_ID',
      referencedColumnName: 'USER_ID',
    },
  })
  metooComment!: UserProfile[];
}

/**
 * @swagger
 * definitions:
 *  Comment:
 *    type: object
 *    properties:
 *      id:
 *        type: string
 *        format: uuid
 *        description: "해당 스터디 질문글의 고유한 id"
 *      createdAt:
 *        type: string
 *        format: date-time
 *        description: "해당 질문글이 작성된 시간"
 *      isNested:
 *        type: boolean
 *        description: "해당 질문글이 다른 질문글의 답변으로 작성된 질문글인지의 여부 (대댓글이 달려있는지의 여부)"
 *      content:
 *        type: string
 *        description: "질문글 본문 내용"
 *      userId:
 *        type: string
 *        format: uuid
 *        description: "해당 스터디 질문글을 등록한 사용자 id"
 *      studyId:
 *        type: string
 *        format: uuid
 *        description: "해당 스터디 id"
 *      nestedCommentId:
 *        type: string
 *        format: uuid
 *        description: "해당 질문글이 어떤 질문글의 답변으로 작성되었을 경우, 그 대상 질문글의 id"
 *      metooCount:
 *        type: number
 *        description: "나도 궁금해요 개수"
 *
 *  UserMetooComment:
 *    type: object
 *    properties:
 *      userId:
 *        type: string
 *        format: uuid
 *        description: "나도 궁금해요를 등록한 사용자 id"
 *      commentId:
 *        type: string
 *        format: uuid
 *        description: "나도 궁금해요가 등록된 댓글 id"
 */
