const http = require('http');

const routes = [
  '/student',
  '/courses',
  '/courses/course-react-fullstack',
  '/practice',
  '/practice/100-days-of-code',
  '/practice/100-days-code',
  '/compete/coding-conquest',
  '/student/resume',
  '/blogs',
  '/opportunities/scholarships',
  '/opportunities/workshops',
  '/compete/festivals',
  '/career/interview-prep',
  '/api/career/listings',
  '/api/courses',
  '/api/workshops',
  '/api/festivals',
  '/api/scholarships'
];

async function testRoute(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      resolve({ path, statusCode: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (err) => {
      resolve({ path, statusCode: 'ERR', error: err.message });
    });
  });
}

async function run() {
  console.log('Probing routes on http://localhost:3000...');
  const results = [];
  for (const r of routes) {
    const res = await testRoute(r);
    results.push(res);
  }
  console.table(results);
}

run();
