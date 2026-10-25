import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc, getDocs, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDemoShikshaSahayakMockKey12345",
  authDomain: "shikshasahayak-demo.firebaseapp.com",
  projectId: "padhakuportal",
  storageBucket: "shikshasahayak-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:mockshikshasahayak123"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupInvalidDocs() {
  console.log('🧹 Scanning Firestore beta_whitelist collection with Firebase SDK...');

  try {
    const snap = await getDocs(collection(db, 'beta_whitelist'));
    console.log(`Found ${snap.docs.length} documents in beta_whitelist.`);

    let deleted = 0;
    for (const docSnap of snap.docs) {
      const docId = docSnap.id;
      if (!docId.includes('@')) {
        console.log(`🗑️ Deleting invalid UID document: ${docId}`);
        try {
          await deleteDoc(doc(db, 'beta_whitelist', docId));
          console.log(`✅ Deleted: ${docId}`);
          deleted++;
        } catch (err: any) {
          console.error(`❌ Failed to delete ${docId}:`, err.message || err);
        }
      }
    }

    console.log(`🎉 Cleanup complete! Deleted ${deleted} invalid non-email document(s).`);
  } catch (err: any) {
    console.error('Error fetching collection:', err.message || err);
  }
}

cleanupInvalidDocs();
