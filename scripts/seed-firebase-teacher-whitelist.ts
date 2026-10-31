import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDemoShikshaSahayakMockKey12345",
  authDomain: "shikshasahayak-demo.firebaseapp.com",
  projectId: "SHIKSHASAHAYAK",
  storageBucket: "shikshasahayak-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:mockshikshasahayak123"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleTeachers = [
  {
    email: 'tech@shikshasahayak.org',
    name: 'Dr. R. K. Mehta',
    department: 'Computer Engineering',
    college: 'GTU Main Campus',
    status: 'approved',
    approved: true,
    added_by: 'Admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    email: 'contact@shikshasahayak.org',
    name: 'Prof. A. S. Patel',
    department: 'Computer Science & Engineering',
    college: 'GTU Main Campus',
    status: 'approved',
    approved: true,
    added_by: 'Admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    email: 'team@shikshasahayak.org',
    name: 'ShikshaSahayak Official Faculty',
    department: 'Academic Administration',
    college: 'ShikshaSahayak University Network',
    status: 'approved',
    approved: true,
    added_by: 'Admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    email: 'developer@shikshasahayak.org',
    name: 'Lead Technical Faculty',
    department: 'Information Technology',
    college: 'GTU Main Campus',
    status: 'approved',
    approved: true,
    added_by: 'Admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

async function seedTeachers() {
  console.log('🔥 Initializing Firebase SDK and seeding teacher_whitelist collection...');
  let count = 0;
  for (const t of sampleTeachers) {
    try {
      const docRef = doc(db, 'teacher_whitelist', t.email.toLowerCase());
      await setDoc(docRef, t, { merge: true });
      console.log(`[PASS] Created document teacher_whitelist/${t.email.toLowerCase()}`);
      count++;
    } catch (err: any) {
      console.error(`[FAIL] Failed to create document teacher_whitelist/${t.email}:`, err.message || err);
    }
  }

  console.log(`\n🎉 Seed finished. ${count}/${sampleTeachers.length} documents written to Firestore.`);

  try {
    const snap = await getDocs(collection(db, 'teacher_whitelist'));
    console.log(`Verified collection teacher_whitelist in Firestore contains ${snap.size} documents.`);
  } catch (err: any) {
    console.error(`Verification read error:`, err.message || err);
  }
}

seedTeachers();
