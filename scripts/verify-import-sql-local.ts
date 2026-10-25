import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';

const db = new DatabaseSync(':memory:');
let schemaSql = fs.readFileSync('schema.sql', 'utf8').replace(/Code INT,/g, '');
db.exec(schemaSql);
db.exec(`INSERT OR IGNORE INTO canonical_subjects (id, university_id, degree, branch_id, semester, canonical_name, normalized_name)
VALUES ('cs_electrical_s3_electrical_machines_i', 'gtu', 'BE', 'branch_09', 3, 'Electrical Machines I', 'electrical machines i');`);

const importSql = fs.readFileSync('data/pilot_remote_import.sql', 'utf8');
db.exec(importSql);

const count = (db.prepare('SELECT COUNT(*) as c FROM master_question_bank').get() as any).c;
const bmCount = (db.prepare("SELECT COUNT(*) as c FROM question_branch_mappings WHERE branch_id='branch_09'").get() as any).c;
console.log(`LOCAL_VERIFY_SUCCESS: MQB=${count}, BM=${bmCount}`);
