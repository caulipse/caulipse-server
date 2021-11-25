import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import User from './UserEntity';
import Study from './StudyEntity';

@Entity({ name: 'Notification' })
export default class Notification {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;

  @Column({ name: 'TYPE' })
  type!: number;

  @Column({ name: 'READ' })
  read!: number;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'USER_ID' })
  user!: User;

  @ManyToOne(() => Study, (study) => study.id)
  @JoinColumn({ name: 'STUDY_ID' })
  study!: Study;
}
