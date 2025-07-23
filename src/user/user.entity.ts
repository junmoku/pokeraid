import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  seq: number;

  @Column({ unique: true })
  id: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  private_key: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}