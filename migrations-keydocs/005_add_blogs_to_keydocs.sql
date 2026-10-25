-- Move the old blog table into the main keydocs database.

CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    category TEXT DEFAULT 'Study Guides',
    tags TEXT,
    thumbnail TEXT,
    status TEXT DEFAULT 'draft',
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blogs_status_created_at
ON blogs(status, created_at DESC);

INSERT OR IGNORE INTO blogs (id, title, content, author, category, tags, thumbnail, status, views, created_at) VALUES
(
  'blog_math_ace',
  'How to ace your Engineering Mathematics exam',
  '# How to Ace Engineering Mathematics

Engineering Mathematics is one of the foundational subjects for any engineering branch. However, many students find it challenging due to the vast syllabus and the level of problem-solving required. Here is a comprehensive guide to help you score high.

## 1. Understand the Concepts
Don''t try to memorize formulas. Understand *why* a particular method is used and *how* it is derived.

## 2. Practice Daily
Math is not a reading subject. Grab a pen and paper and solve at least 5-10 problems every single day. Focus on:
* Linear Algebra (Matrices, Eigenvalues)
* Calculus (Multiple Integrals, Vector Calculus)
* Differential Equations

## 3. Solve Previous Year Question Papers (PYQs)
This is the single most important tip. PYQs give you a clear pattern of frequently asked questions. You can browse all mathematics PYQs directly on [ShikshaSahayak](/resources/pyq).

Good luck with your prep!',
  'Admin User',
  'Exam Tips',
  'math, exam, prep',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop',
  'published',
  1240,
  datetime('now', '-5 days')
),
(
  'blog_dsa_resources',
  'Top 10 resources for Data Structures & Algorithms',
  '# Top Resources for Data Structures & Algorithms (DSA)

Mastering DSA is crucial for cracking technical interviews and becoming a better software engineer. Here is a curated list of top resources to guide your journey.

## Online Platforms
1. **LeetCode**: Great for problem-solving and interview preparation.
2. **GeeksforGeeks**: Excellent for theoretical understanding and code snippets.
3. **ShikshaSahayak**: Check out the study material section for comprehensive lecture notes.

## Recommended Books
* *Introduction to Algorithms* by CLRS
* *Cracking the Coding Interview* by Gayle Laakmann McDowell

## Structured Roadmaps
Start with Arrays, String manipulation, and linked lists before moving to tree-based and graph algorithms. Consistency is key!',
  'Admin User',
  'Study Guides',
  'dsa, study, resources',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400&auto=format&fit=crop',
  'published',
  3450,
  datetime('now', '-2 days')
);
