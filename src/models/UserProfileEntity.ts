import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import User from './UserEntity';

@Entity({ name: 'UserProfile' })
export default class UserProfile {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;

  @Column({ name: 'USER_NAME' })
  userName!: string;

  // FIXME: enum type으로 수정
  @Column({ name: 'DEPT' })
  dept!: string;

  // FIXME: enum type으로 수정
  @Column({ name: 'GRADE' })
  grade!: string;

  @Column({ name: 'BIO' })
  bio!: string;

  @Column({ name: 'USER_ABOUT' })
  userAbout!: string;

  @Column({ name: 'SHOW_DEPT' })
  showDept!: boolean;

  @Column({ name: 'SHOW_ABOUT' })
  showAbout!: boolean;

  @Column({ name: 'ON_BREAK' })
  onBreak!: boolean;

  @Column({ name: 'EMAIL1' })
  email1!: string;

  @Column({ name: 'EMAIL2' })
  email2!: string;

  @Column({ name: 'EMAIL3' })
  email3!: string;

  @Column({ name: 'LINK1' })
  link1!: string;

  @Column({ name: 'LINK2' })
  link2!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'USER_ID' })
  user!: User;
}
