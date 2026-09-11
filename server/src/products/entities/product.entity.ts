import {
    Entity,
    PrimaryGeneratedColumn,
    Column, 
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
export class Product{
    @PrimaryGeneratedColumn()
    id:number;

    @Column()
    name:String;

    @Column({nullable:true})
    description:string;

    @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
        to: (value: number) => value,
        from: (value: string) => parseFloat(value),
    },
    })
    price: number;

    @Column({default:0})
    stock:number;

    @Column({ type: 'text', nullable: true })
    imageUrl: string;

    @ManyToOne(()=>Category)
    @JoinColumn({name:'category_id'})
    category:Category;

    @Column({default:true})
    status:boolean;

    @CreateDateColumn()
    created_at:Date;

    @UpdateDateColumn()
    updated_at:Date;
}