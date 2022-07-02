import { MigrationInterface, QueryRunner } from 'typeorm';

export class NoticeLength1656739991793 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE NOTICE
      MODIFY COLUMN ABOUT VARCHAR(2000) NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE NOTICE
      MODIFY COLUMN ABOUT VARCHAR(2000) NOT NULL;
    `);
  }
}
