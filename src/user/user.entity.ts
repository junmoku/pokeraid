import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  privateKey: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}