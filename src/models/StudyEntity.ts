import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Study' })
export default class Study {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;
}
