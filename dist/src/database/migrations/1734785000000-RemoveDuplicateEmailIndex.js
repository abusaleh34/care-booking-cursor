"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveDuplicateEmailIndex1734785000000 = void 0;
class RemoveDuplicateEmailIndex1734785000000 {
    constructor() {
        this.name = 'RemoveDuplicateEmailIndex1734785000000';
    }
    async up(queryRunner) {
        try {
            await queryRunner.query(`DROP INDEX IF EXISTS "IDX_97672ac88f789774dd47f7c8be"`);
        }
        catch (error) {
            console.log('Index might not exist, continuing...');
        }
        try {
            await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be" UNIQUE ("email")`);
        }
        catch (error) {
            console.log('Unique constraint might already exist, continuing...');
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be"`);
    }
}
exports.RemoveDuplicateEmailIndex1734785000000 = RemoveDuplicateEmailIndex1734785000000;
//# sourceMappingURL=1734785000000-RemoveDuplicateEmailIndex.js.map