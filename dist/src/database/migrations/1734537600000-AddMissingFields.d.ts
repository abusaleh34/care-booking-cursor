import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMissingFields1734537600000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
