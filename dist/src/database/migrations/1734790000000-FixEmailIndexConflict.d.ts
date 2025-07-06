import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class FixEmailIndexConflict1734790000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
