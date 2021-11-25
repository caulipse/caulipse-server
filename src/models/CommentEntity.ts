import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import User from './UserEntity';
import Study from './StudyEntity';

@Entity({ name: 'Comment' })
export default class Comment {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt!: Date;

  @Column({ name: 'IS_NESTED' })
  isNested!: boolean;

  @Column({ name: 'CONTENT' })
  content!: string;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'USER_ID' })
  user!: User;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  nestedComments!: Comment[];

  @ManyToOne(() => Comment, (comment) => comment.nestedComments)
  parentComment!: Comment;

  @ManyToOne(() => Study, (study) => study.id)
  @JoinColumn({ name: 'STUDY_ID' })
  study!: Study;
}
