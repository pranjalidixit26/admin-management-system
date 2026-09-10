import{
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('categories')
export class Category{
    @PrimaryGeneratedColumn()
    id:number;

    @Column({unique:true})
    name:string;

    @Column({nullable:true})
    description:string;

    @Column({default:true})
    status:boolean;

    @CreateDateColumn()
    created_at:Date;

    @UpdateDateColumn()
    updated_at:Date;
}