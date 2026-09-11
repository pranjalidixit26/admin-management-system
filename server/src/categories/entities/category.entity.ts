import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: true })
    status: boolean;

    @Column({ nullable: true })
    parentId: number;

    @ManyToOne(() => Category, (category) => category.subcategories, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'parentId' })
    parent: Category;

    @OneToMany(() => Category, (category) => category.parent)
    subcategories: Category[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}