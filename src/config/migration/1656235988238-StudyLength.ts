import { MigrationInterface, QueryRunner } from 'typeorm';

export class StudyLength1656235988238 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE STUDY
      MODIFY COLUMN STUDY_ABOUT VARCHAR(2000) NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE STUDY
      MODIFY COLUMN STUDY_ABOUT VARCHAR(255) NOT NULL;
    `);
  }
}
