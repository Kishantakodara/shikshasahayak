import {
  syncTeacherToFirestoreREST,
  syncBetaUserToFirestoreREST,
} from '../functions/lib/firestoreRestService';

const defaultTeachers = [
  {
    email: 'tech@shikshasahayak.org',
    name: 'Academic Administrator',
    department: 'Computer Engineering',
    college: 'GTU Main Campus',
    status: 'approved',
    addedBy: 'System Seed',
  },
  {
    email: 'contact@shikshasahayak.org',
    name: 'Platform Administrator',
    department: 'Computer Science & Engineering',
    college: 'GTU Main Campus',
    status: 'approved',
    addedBy: 'System Seed',
  },
  {
    email: 'team@shikshasahayak.org',
    name: 'ShikshaSahayak Official Faculty',
    department: 'Academic Administration',
    college: 'ShikshaSahayak University Network',
    status: 'approved',
    addedBy: 'System Seed',
  },
  {
    email: 'developer@shikshasahayak.org',
    name: 'Lead Technical Faculty',
    department: 'Information Technology',
    college: 'GTU Main Campus',
    status: 'approved',
    addedBy: 'System Seed',
  },
];

const defaultBetaUsers = [
  {
    email: 'tech@shikshasahayak.org',
    notes: 'Platform Super Admin & AI Beta Lead',
    status: 'approved',
    addedBy: 'System Seed',
  },
  {
    email: 'contact@shikshasahayak.org',
    notes: 'Platform Admin & Beta Reviewer',
    status: 'approved',
    addedBy: 'System Seed',
  },
  {
    email: 'team@shikshasahayak.org',
    notes: 'Official Portal Account',
    status: 'approved',
    addedBy: 'System Seed',
  },
  {
    email: 'developer@shikshasahayak.org',
    notes: 'Lead Developer Account',
    status: 'approved',
    addedBy: 'System Seed',
  },
];

export async function runFirestoreSync() {
  console.log('🚀 Pushing default teachers and beta users to Firebase Firestore via REST API...');

  let teacherSuccess = 0;
  for (const t of defaultTeachers) {
    const ok = await syncTeacherToFirestoreREST(t);
    if (ok) teacherSuccess++;
  }

  let betaSuccess = 0;
  for (const b of defaultBetaUsers) {
    const ok = await syncBetaUserToFirestoreREST(b);
    if (ok) betaSuccess++;
  }

  console.log(`✅ Firestore Sync Complete!`);
  console.log(`- teacher_whitelist collection: ${teacherSuccess}/${defaultTeachers.length} synced`);
  console.log(`- beta_whitelist collection: ${betaSuccess}/${defaultBetaUsers.length} synced`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('sync-firestore-whitelists.ts')) {
  runFirestoreSync();
}
