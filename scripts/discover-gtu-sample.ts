import { getDocumentProxy } from 'unpdf';

async function sampleCheck() {
  const subjects = [
    { code: '3110014', name: 'Mathematics - 1' },
    { code: '3110015', name: 'Mathematics - 2' },
    { code: '3110005', name: 'Basic Electrical Engineering' },
    { code: '3110003', name: 'Programming for Problem Solving' },
    { code: '3110002', name: 'English' },
  ];

  const sessions = ['W2024', 'S2024', 'W2023', 'S2023', 'W2022'];
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  console.log('================================================================');
  console.log('🔍 DISCOVERING GTU 1ST-YEAR PYQ PAPERS (SAMPLE SCAN)');
  console.log('================================================================\n');

  for (const subj of subjects) {
    for (const sess of sessions) {
      const url = `https://www.gtu.ac.in/api/v1/question-papers/archive/file/${sess}/BE/${subj.code}.pdf`;
      try {
        const res = await fetch(url, { headers });
        if (res.status === 200) {
          const buf = await res.arrayBuffer();
          const doc = await getDocumentProxy(new Uint8Array(buf));
          console.log(`  ✅ [${sess}] ${subj.code} (${subj.name}) -> Pages: ${doc.totalPages}, Size: ${buf.byteLength} bytes`);
        } else {
          console.log(`  ❌ [${sess}] ${subj.code} (${subj.name}) -> Status: ${res.status}`);
        }
      } catch (e: any) {
        console.error(`  ⚠️ [${sess}] ${subj.code} (${subj.name}) -> Error: ${e.message}`);
      }
    }
  }
}

sampleCheck().catch(console.error);
