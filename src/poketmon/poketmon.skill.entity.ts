import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('poketmon_skill')
export class PoketmonSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pokemon_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int' })
  attack: number;

  @Column({ type: 'int' })
  cost: number;
}