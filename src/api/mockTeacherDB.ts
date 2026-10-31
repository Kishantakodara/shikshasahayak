import type { Class, CreateClassDTO, UpdateClassDTO, AttendanceSession, StudentAttendanceSubmission } from '../types/teacher';

export const PRESET_CHALLENGE_WORDS = [
  'Capacitor', 'Resistor', 'Inductor', 'Transistor', 'Semiconductor',
  'Microprocessor', 'Algorithm', 'Eigenvector', 'Matrix', 'Polynomial',
  'Oscilloscope', 'Thermocouple', 'Magnetism', 'Friction', 'Viscosity',
  'Enthalpy', 'Entropy', 'Photodiode', 'LogicGate', 'Microcontroller',
  'Galvanometer', 'Superconductor', 'Turbine', 'Transformer', 'Differential',
  'Integrator', 'Amplifier', 'Wavelength', 'Frequency', 'Resonance',
  'Flux', 'Refraction', 'Diffraction', 'Quantum', 'Thermodynamics',
  'Hydraulics', 'Pneumatics', 'Kinematics', 'Torsion', 'Strain',
  'Electromagnet', 'Capacitance', 'Impedance', 'Reactance', 'Modulation',
  'Multiplexer', 'Demultiplexer', 'FlipFlop', 'Register', 'BaudRate'
];

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Helper to get/set from localStorage
const getStorage = <T>(key: string, defaultValue: T): T => {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(val);
  } catch {
    return defaultValue;
  }
};

const setStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ============================================================
// INITIAL SEED DATA
// ============================================================

const SEED_CLASSES = [
  {
    id: "class-1",
    teacher_id: "dev-mock-uid",
    subject_id: "sub-dbms",
    name: "CSE Sem 3 - Section A",
    description: "Database Management Systems & Information Systems",
    section: "A",
    semester: 3,
    academic_year: "2026-27",
    join_code: "DBM3A99",
    grading_system: "PERCENTAGE",
    max_students: 60,
    is_active: true,
    cover_image: null,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    student_count: 5,
    assignment_count: 2,
    material_count: 3
  },
  {
    id: "class-2",
    teacher_id: "dev-mock-uid",
    subject_id: "sub-se",
    name: "CSE Sem 5 - Section B",
    description: "Software Engineering & Agile Development",
    section: "B",
    semester: 5,
    academic_year: "2026-27",
    join_code: "SE5B888",
    grading_system: "GPA",
    max_students: 50,
    is_active: true,
    cover_image: null,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    student_count: 3,
    assignment_count: 1,
    material_count: 2
  },
  {
    id: "class-3",
    teacher_id: "dev-mock-uid",
    subject_id: "sub-cd",
    name: "CSE Sem 7 - Section A",
    description: "Compiler Design & Automata Theory",
    section: "A",
    semester: 7,
    academic_year: "2026-27",
    join_code: "COMP7AA",
    grading_system: "PERCENTAGE",
    max_students: 45,
    is_active: true,
    cover_image: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    student_count: 3,
    assignment_count: 1,
    material_count: 1
  }
];

const SEED_STUDENTS = [
  // Class 1
  {
    enrollment_id: "enroll-1",
    class_id: "class-1",
    student_id: "student-1",
    student_name: "Aarav Anand",
    student_email: "lead@shikshasahayak.org",
    enrollment_number: "24CSE001",
    enrollment_status: "ACTIVE",
    attendance_percentage: 92,
    average_marks: 88.5,
    is_placeholder: false,
    enrolled_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    enrollment_id: "enroll-2",
    class_id: "class-1",
    student_id: "student-2",
    student_name: "Rahul Verma",
    student_email: "rahul@shikshasahayak.org",
    enrollment_number: "24CSE002",
    enrollment_status: "ACTIVE",
    attendance_percentage: 85,
    average_marks: 72.4,
    is_placeholder: false,
    enrolled_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    enrollment_id: "enroll-3",
    class_id: "class-1",
    student_id: "student-3",
    student_name: "Sneha Gupta",
    student_email: "sneha@shikshasahayak.org",
    enrollment_number: "24CSE003",
    enrollment_status: "ACTIVE",
    attendance_percentage: 96,
    average_marks: 94.0,
    is_placeholder: false,
    enrolled_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    enrollment_id: "enroll-4",
    class_id: "class-1",
    student_id: "student-4",
    student_name: "Priyanshi Shah",
    student_email: "priyanshi@shikshasahayak.org",
    enrollment_number: "24CSE004",
    enrollment_status: "PENDING",
    attendance_percentage: null,
    average_marks: null,
    is_placeholder: true,
    enrolled_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    enrollment_id: "enroll-5",
    class_id: "class-1",
    student_id: "student-5",
    student_name: "Amit Patel",
    student_email: "amit@shikshasahayak.org",
    enrollment_number: "24CSE005",
    enrollment_status: "ACTIVE",
    attendance_percentage: 78,
    average_marks: 61.2,
    is_placeholder: false,
    enrolled_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Class 2
  {
    enrollment_id: "enroll-6",
    class_id: "class-2",
    student_id: "student-6",
    student_name: "Jayesh Patel",
    student_email: "jayesh@shikshasahayak.org",
    enrollment_number: "22CSE021",
    enrollment_status: "ACTIVE",
    attendance_percentage: 88,
    average_marks: 85.0,
    is_placeholder: false,
    enrolled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    enrollment_id: "enroll-7",
    class_id: "class-2",
    student_id: "student-7",
    student_name: "Riya Sharma",
    student_email: "riya@shikshasahayak.org",
    enrollment_number: "22CSE022",
    enrollment_status: "ACTIVE",
    attendance_percentage: 91,
    average_marks: 79.5,
    is_placeholder: false,
    enrolled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    enrollment_id: "enroll-8",
    class_id: "class-2",
    student_id: "student-8",
    student_name: "Vicky Shah",
    student_email: "vicky@shikshasahayak.org",
    enrollment_number: "22CSE023",
    enrollment_status: "PENDING",
    attendance_percentage: null,
    average_marks: null,
    is_placeholder: true,
    enrolled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_QUIZZES = [
  {
    id: "quiz-1",
    title: "DBMS Normalization MCQ Quiz",
    subject: "Database Management Systems",
    category: "Practice",
    difficulty: "MEDIUM",
    duration: 20,
    total_questions: 15,
    xp_reward: 150
  },
  {
    id: "quiz-2",
    title: "Software Engineering Agile Methods Quiz",
    subject: "Software Engineering",
    category: "Midterm",
    difficulty: "EASY",
    duration: 15,
    total_questions: 10,
    xp_reward: 100
  },
  {
    id: "quiz-3",
    title: "Compiler Design Lexical Analysis Quiz",
    subject: "Compiler Design",
    category: "Exam",
    difficulty: "HARD",
    duration: 30,
    total_questions: 20,
    xp_reward: 250
  },
  {
    id: "quiz-4",
    title: "SQL Query Basics Practice Quiz",
    subject: "Database Management Systems",
    category: "Practice",
    difficulty: "EASY",
    duration: 15,
    total_questions: 12,
    xp_reward: 120
  }
];

const SEED_QUIZ_ASSIGNMENTS = [
  {
    assignment_id: "qa-1",
    quiz_id: "quiz-1",
    quiz_title: "DBMS Normalization MCQ Quiz",
    class_id: "class-1",
    subject: "Database Management Systems",
    category: "Practice",
    difficulty: "MEDIUM",
    duration: 20,
    xp_reward: 150,
    is_visible: true,
    assigned_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    total_attempts: 5,
    completed_attempts: 4
  }
];

const SEED_ASSIGNMENTS = [
  {
    id: "assign-1",
    class_id: "class-1",
    class_name: "CSE Sem 3 - Section A",
    class_section: "A",
    title: "DBMS Lab Assignment 3",
    description: "SQL Queries, joins, grouping, and nesting",
    instructions: "Submit a single PDF containing your SQL queries and screenshot outputs.",
    status: "PUBLISHED",
    total_marks: 20,
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    allow_late_submission: true,
    late_penalty_percent: 10,
    max_file_size_mb: 10,
    allowed_file_types: ["pdf"],
    rubric: null,
    attachments: null,
    created_by: "dev-mock-uid",
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    submitted_count: 3,
    total_submissions: 5,
    graded_count: 1,
    pending_count: 2,
    questions: [
      { id: "q-1", question_text: "Write a SQL query to find the second highest salary of an employee.", question_type: "CODE", max_marks: 5, required: true },
      { id: "q-2", question_text: "Explain the difference between INNER JOIN and LEFT OUTER JOIN with examples.", question_type: "LONG_ANSWER", max_marks: 5, required: true },
      { id: "q-3", question_text: "Write a query to group employees by department and filter groups having average salary > 50000.", question_type: "CODE", max_marks: 10, required: true }
    ],
    stats: {
      total_submissions: 5,
      submitted_count: 3,
      graded_count: 1,
      average_marks: 19.0,
      max_marks: 19,
      min_marks: 19,
      late_submissions: 0
    }
  },
  {
    id: "assign-2",
    class_id: "class-1",
    class_name: "CSE Sem 3 - Section A",
    class_section: "A",
    title: "ER Diagram Project Report",
    description: "Design an ER Diagram for College Management System",
    instructions: "State assumptions, draw neat entities, relationships, attributes, and cardinalities.",
    status: "DRAFT",
    total_marks: 50,
    due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    allow_late_submission: false,
    late_penalty_percent: 0,
    max_file_size_mb: 20,
    allowed_file_types: ["pdf", "png", "jpg"],
    rubric: null,
    attachments: null,
    created_by: "dev-mock-uid",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    submitted_count: 0,
    total_submissions: 5,
    graded_count: 0,
    pending_count: 0,
    questions: [],
    stats: {
      total_submissions: 5,
      submitted_count: 0,
      graded_count: 0,
      average_marks: null,
      max_marks: null,
      min_marks: null,
      late_submissions: 0
    }
  }
];

const SEED_SUBMISSIONS = [
  {
    id: "sub-1",
    assignment_id: "assign-1",
    student_id: "student-1",
    student_name: "Aarav Anand",
    enrollment_number: "24CSE001",
    status: "SUBMITTED",
    submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    marks: null,
    feedback: null,
    is_late: false,
    attachments: ["http://example.com/student_dbms_sub.pdf"],
    grade_percentage: 0
  },
  {
    id: "sub-2",
    assignment_id: "assign-1",
    student_id: "student-2",
    student_name: "Rahul Verma",
    enrollment_number: "24CSE002",
    status: "SUBMITTED",
    submitted_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    marks: null,
    feedback: null,
    is_late: false,
    attachments: ["http://example.com/rahul_dbms_sub.pdf"],
    grade_percentage: 0
  },
  {
    id: "sub-3",
    assignment_id: "assign-1",
    student_id: "student-3",
    student_name: "Sneha Gupta",
    enrollment_number: "24CSE003",
    status: "GRADED",
    submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    marks: 19,
    feedback: "Excellent SQL work and well structured outputs.",
    is_late: false,
    attachments: ["http://example.com/sneha_dbms_sub.pdf"],
    grade_percentage: 95
  }
];

const SEED_MATERIALS = [
  {
    id: "mat-1",
    class_id: "class-1",
    title: "DBMS Lecture Notes Unit 1",
    description: "Introduction to Databases and Relational Model",
    file_url: "https://example.com/dbms_unit1.pdf",
    file_name: "dbms_unit1.pdf",
    file_type: "pdf",
    file_size_bytes: 2048500,
    is_visible: true,
    uploaded_by: "dev-mock-uid",
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "mat-2",
    class_id: "class-1",
    title: "SQL Practice Queries Sheet",
    description: "A comprehensive practice sheet for joins and aggregation",
    file_url: "https://example.com/sql_practice.pdf",
    file_name: "sql_practice.pdf",
    file_type: "pdf",
    file_size_bytes: 1024000,
    is_visible: true,
    uploaded_by: "dev-mock-uid",
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_NOTIFICATIONS = [
  {
    id: "notif-1",
    user_id: "dev-mock-uid",
    type: "ASSIGNMENT_SUBMITTED",
    channel: "IN_APP",
    title: "New Submission",
    message: "DBMS Lab Assignment 3 submitted by Aarav Anand",
    link: "/teacher/assignments/assign-1/submissions",
    metadata: null,
    is_read: false,
    read_at: null,
    created_at: new Date().toISOString()
  }
];

const SEED_MESSAGES = [
  {
    thread_id: "thread-1",
    thread_title: "Aarav Anand (Direct)",
    last_message: "Sir, I had a doubt in Query 3",
    unread_count: 1,
    updated_at: new Date().toISOString(),
    messages: [
      { id: "m-1", sender_name: "Aarav Anand", content: "Sir, I had a doubt in Query 3", timestamp: new Date().toISOString() }
    ]
  }
];

// ============================================================
// MOCK DATABASE OPERATIONS
// ============================================================

export const mockTeacherDB = {
  // Classes
  getClasses: async (params?: { page?: number; limit?: number; status?: 'active' | 'inactive' | 'all' }) => {
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    const filtered = classes.filter(cls => {
      if (params?.status === 'active') return cls.is_active;
      if (params?.status === 'inactive') return !cls.is_active;
      return true;
    });

    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      classes: filtered.slice(start, end),
      pagination: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit)
      }
    };
  },

  getClass: async (classId: string) => {
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    const cls = classes.find(c => c.id === classId);
    if (!cls) throw new Error('Class not found');
    
    // Dynamically calculate counts
    const students = getStorage<any[]>('mock_students', SEED_STUDENTS);
    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    const materials = getStorage<any[]>('mock_materials', SEED_MATERIALS);

    return {
      ...cls,
      student_count: students.filter(s => s.class_id === classId).length,
      assignment_count: assignments.filter(a => a.class_id === classId).length,
      material_count: materials.filter(m => m.class_id === classId).length
    };
  },

  createClass: async (data: CreateClassDTO) => {
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    
    // Generate code: e.g., SE5B888
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newClass = {
      id: `class-${Date.now()}`,
      teacher_id: "dev-mock-uid",
      subject_id: data.subject_id || null,
      name: data.name,
      description: data.description || null,
      section: data.section || null,
      semester: data.semester || null,
      academic_year: data.academic_year || "2026-27",
      join_code: code,
      grading_system: data.grading_system || "PERCENTAGE",
      max_students: data.max_students || 50,
      is_active: true,
      cover_image: data.cover_image || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      student_count: 0,
      assignment_count: 0,
      material_count: 0
    };

    classes.unshift(newClass);
    setStorage('mock_classes', classes);
    return newClass;
  },

  updateClass: async (classId: string, data: UpdateClassDTO) => {
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    const idx = classes.findIndex(c => c.id === classId);
    if (idx === -1) throw new Error('Class not found');

    const updated = {
      ...classes[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    classes[idx] = updated;
    setStorage('mock_classes', classes);
    return updated;
  },

  deleteClass: async (classId: string) => {
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    const idx = classes.findIndex(c => c.id === classId);
    if (idx === -1) throw new Error('Class not found');
    
    classes[idx].is_active = false;
    setStorage('mock_classes', classes);
    return { success: true, message: 'Class soft-deleted successfully' };
  },

  regenerateJoinCode: async (classId: string) => {
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    const idx = classes.findIndex(c => c.id === classId);
    if (idx === -1) throw new Error('Class not found');

    const oldJoinCode = classes[idx].join_code;
    const newJoinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    classes[idx].join_code = newJoinCode;
    classes[idx].updated_at = new Date().toISOString();
    
    setStorage('mock_classes', classes);
    return {
      success: true,
      message: 'Join code regenerated',
      classId,
      oldJoinCode,
      newJoinCode
    };
  },

  // Students
  getClassStudents: async (classId: string, params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const students = getStorage<any[]>('mock_students', SEED_STUDENTS);
    let filtered = students.filter(s => s.class_id === classId);
    
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter(s => s.enrollment_status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.student_name?.toLowerCase().includes(q) || 
        s.enrollment_number?.toLowerCase().includes(q)
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 25;
    const start = (page - 1) * limit;
    
    return {
      students: filtered.slice(start, start + limit),
      pagination: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit)
      }
    };
  },

  bulkEnrollStudents: async (classId: string, enrollmentNumbers: string[]) => {
    const students = getStorage<any[]>('mock_students', SEED_STUDENTS);
    const successful: any[] = [];
    const failed: any[] = [];

    const existingInClass = new Set(students.filter(s => s.class_id === classId).map(s => s.enrollment_number));

    enrollmentNumbers.forEach((enrollNo, i) => {
      const trimmed = enrollNo.trim();
      if (!trimmed) return;

      if (existingInClass.has(trimmed)) {
        failed.push({ enrollment_number: trimmed, reason: "Already enrolled in this class" });
        return;
      }

      // Generate a mock student name
      const names = ["Aarav Shah", "Ishaan Patel", "Diya Sharma", "Aditya Joshi", "Ananya Verma", "Rohan Gupta", "Kavya Nair"];
      const mockName = names[Math.floor(Math.random() * names.length)];

      const newStudent = {
        enrollment_id: `enroll-${Date.now()}-${i}`,
        class_id: classId,
        student_id: `student-${Date.now()}-${i}`,
        student_name: mockName,
        student_email: `${mockName.toLowerCase().replace(' ', '')}@shikshasahayak.org`,
        enrollment_number: trimmed,
        enrollment_status: "ACTIVE",
        attendance_percentage: Math.floor(Math.random() * 20) + 80, // 80 - 100%
        average_marks: Math.floor(Math.random() * 40) + 60, // 60 - 100
        is_placeholder: false,
        enrolled_at: new Date().toISOString()
      };

      students.push(newStudent);
      successful.push({
        enrollment_number: trimmed,
        student_id: newStudent.student_id,
        is_placeholder: false
      });
    });

    setStorage('mock_students', students);
    return {
      success: true,
      message: "Bulk enrollment processed",
      data: {
        successful,
        failed,
        summary: {
          total: enrollmentNumbers.length,
          successful: successful.length,
          failed: failed.length
        }
      }
    };
  },

  updateEnrollment: async (classId: string, studentId: string, data: any) => {
    const students = getStorage<any[]>('mock_students', SEED_STUDENTS);
    const idx = students.findIndex(s => s.class_id === classId && s.student_id === studentId);
    if (idx === -1) throw new Error('Enrollment not found');

    students[idx] = {
      ...students[idx],
      enrollment_status: data.enrollment_status || students[idx].enrollment_status,
      final_grade: data.final_grade !== undefined ? data.final_grade : students[idx].final_grade
    };
    setStorage('mock_students', students);
    return { success: true, message: 'Enrollment updated', enrollment: students[idx] };
  },

  removeStudent: async (classId: string, studentId: string) => {
    const students = getStorage<any[]>('mock_students', SEED_STUDENTS);
    const filtered = students.filter(s => !(s.class_id === classId && s.student_id === studentId));
    setStorage('mock_students', filtered);
    return { success: true, message: 'Student removed successfully' };
  },

  // Quizzes
  getAvailableQuizzes: async (params?: any) => {
    const quizzes = getStorage<any[]>('mock_quizzes', SEED_QUIZZES);
    const qAssignments = getStorage<any[]>('mock_quiz_assignments', SEED_QUIZ_ASSIGNMENTS);
    
    // Filter out already assigned quizzes for this class
    const assignedIds = new Set(qAssignments.filter(qa => qa.class_id === params?.class_id).map(qa => qa.quiz_id));
    
    let filtered = quizzes.filter(q => !assignedIds.has(q.id));
    
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(quiz => quiz.title.toLowerCase().includes(q));
    }
    if (params?.subject) {
      filtered = filtered.filter(quiz => quiz.subject === params.subject);
    }
    if (params?.category) {
      filtered = filtered.filter(quiz => quiz.category === params.category);
    }
    if (params?.difficulty) {
      filtered = filtered.filter(quiz => quiz.difficulty === params.difficulty);
    }

    return {
      quizzes: filtered,
      pagination: { total: filtered.length, page: 1, limit: 20 },
      filters: {
        subjects: Array.from(new Set(quizzes.map(q => q.subject))),
        categories: Array.from(new Set(quizzes.map(q => q.category))),
        difficulties: Array.from(new Set(quizzes.map(q => q.difficulty)))
      }
    };
  },

  getClassQuizAssignments: async (classId: string) => {
    const qAssignments = getStorage<any[]>('mock_quiz_assignments', SEED_QUIZ_ASSIGNMENTS);
    const filtered = qAssignments.filter(qa => qa.class_id === classId);
    return {
      assignments: filtered,
      pagination: { total: filtered.length, page: 1, limit: 20 }
    };
  },

  assignQuizToClass: async (classId: string, data: { quiz_id: string; is_visible?: boolean }) => {
    const qAssignments = getStorage<any[]>('mock_quiz_assignments', SEED_QUIZ_ASSIGNMENTS);
    const quizzes = getStorage<any[]>('mock_quizzes', SEED_QUIZZES);
    
    const quiz = quizzes.find(q => q.id === data.quiz_id);
    if (!quiz) throw new Error("Quiz not found");

    const newAssignment = {
      assignment_id: `qa-${Date.now()}`,
      quiz_id: data.quiz_id,
      quiz_title: quiz.title,
      class_id: classId,
      subject: quiz.subject,
      category: quiz.category,
      difficulty: quiz.difficulty,
      duration: quiz.duration,
      xp_reward: quiz.xp_reward,
      is_visible: data.is_visible !== false,
      assigned_at: new Date().toISOString(),
      total_attempts: 0,
      completed_attempts: 0
    };

    qAssignments.unshift(newAssignment);
    setStorage('mock_quiz_assignments', qAssignments);
    return { success: true, message: 'Quiz assigned successfully', assignment: newAssignment };
  },

  updateQuizAssignment: async (classId: string, assignmentId: string, data: { is_visible?: boolean }) => {
    const qAssignments = getStorage<any[]>('mock_quiz_assignments', SEED_QUIZ_ASSIGNMENTS);
    const idx = qAssignments.findIndex(qa => qa.class_id === classId && qa.assignment_id === assignmentId);
    if (idx === -1) throw new Error("Assignment not found");

    qAssignments[idx].is_visible = data.is_visible !== undefined ? data.is_visible : qAssignments[idx].is_visible;
    setStorage('mock_quiz_assignments', qAssignments);
    return { success: true, message: 'Quiz assignment updated', assignment: qAssignments[idx] };
  },

  removeQuizAssignment: async (classId: string, assignmentId: string) => {
    const qAssignments = getStorage<any[]>('mock_quiz_assignments', SEED_QUIZ_ASSIGNMENTS);
    const filtered = qAssignments.filter(qa => !(qa.class_id === classId && qa.assignment_id === assignmentId));
    setStorage('mock_quiz_assignments', filtered);
    return { success: true, message: 'Quiz assignment removed' };
  },

  // Assignments
  getAssignments: async (params?: { page?: number; limit?: number; status?: string; class_id?: string; search?: string }) => {
    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    let filtered = assignments;
    
    if (params?.class_id) {
      filtered = filtered.filter(a => a.class_id === params.class_id);
    }
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter(a => a.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(q));
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;

    return {
      assignments: filtered.slice(start, start + limit),
      pagination: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
        hasMore: start + limit < filtered.length
      }
    };
  },

  getAssignment: async (assignmentId: string) => {
    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error('Assignment not found');
    return assignment;
  },

  createAssignment: async (data: any) => {
    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    const targetClass = classes.find(c => c.id === data.class_id);
    
    const newAssignment = {
      id: `assign-${Date.now()}`,
      class_id: data.class_id,
      class_name: targetClass ? targetClass.name : "Unknown Class",
      class_section: targetClass ? targetClass.section : "",
      title: data.title,
      description: data.description || null,
      instructions: data.instructions || null,
      status: "DRAFT",
      total_marks: data.total_marks,
      due_date: data.due_date,
      allow_late_submission: data.allow_late_submission !== false,
      late_penalty_percent: data.late_penalty_percent || 0,
      max_file_size_mb: data.max_file_size_mb || 10,
      allowed_file_types: data.allowed_file_types || ["pdf"],
      rubric: data.rubric || null,
      attachments: data.attachments || null,
      created_by: "dev-mock-uid",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_count: 0,
      total_submissions: targetClass ? targetClass.student_count : 5,
      graded_count: 0,
      pending_count: 0,
      questions: data.questions || [],
      stats: {
        total_submissions: targetClass ? targetClass.student_count : 5,
        submitted_count: 0,
        graded_count: 0,
        average_marks: null,
        max_marks: null,
        min_marks: null,
        late_submissions: 0
      }
    };

    assignments.unshift(newAssignment);
    setStorage('mock_assignments', assignments);
    return { success: true, message: 'Assignment created successfully', assignment: newAssignment };
  },

  updateAssignment: async (assignmentId: string, data: any) => {
    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    const idx = assignments.findIndex(a => a.id === assignmentId);
    if (idx === -1) throw new Error('Assignment not found');

    assignments[idx] = {
      ...assignments[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    setStorage('mock_assignments', assignments);
    return { success: true, message: 'Assignment updated successfully', assignment: assignments[idx] };
  },

  deleteAssignment: async (assignmentId: string) => {
    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    const filtered = assignments.filter(a => a.id !== assignmentId);
    setStorage('mock_assignments', filtered);
    return { success: true, message: 'Assignment deleted successfully', type: 'hard_delete' };
  },

  publishAssignment: async (assignmentId: string, data?: any) => {
    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    const idx = assignments.findIndex(a => a.id === assignmentId);
    if (idx === -1) throw new Error('Assignment not found');

    assignments[idx].status = "PUBLISHED";
    assignments[idx].published_at = new Date().toISOString();
    
    setStorage('mock_assignments', assignments);
    return {
      success: true,
      message: 'Assignment published successfully',
      assignment: assignments[idx],
      notifications_sent: assignments[idx].total_submissions || 5
    };
  },

  // Submissions
  getAssignmentSubmissions: async (assignmentId: string, params?: { status?: string; search?: string }) => {
    const submissions = getStorage<any[]>('mock_submissions', SEED_SUBMISSIONS);
    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    
    const assignment = assignments.find(a => a.id === assignmentId);
    
    let filtered = submissions.filter(s => s.assignment_id === assignmentId);
    
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter(s => s.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(s => s.student_name.toLowerCase().includes(q) || s.enrollment_number.toLowerCase().includes(q));
    }

    return {
      submissions: filtered,
      assignment_summary: {
        assignment_id: assignmentId,
        total_marks: assignment ? assignment.total_marks : 20,
        submitted_count: filtered.length,
        graded_count: filtered.filter(s => s.status === 'GRADED').length
      },
      pagination: { total: filtered.length, page: 1, limit: 50 }
    };
  },

  gradeSubmission: async (assignmentId: string, submissionId: string, data: any) => {
    const submissions = getStorage<any[]>('mock_submissions', SEED_SUBMISSIONS);
    const idx = submissions.findIndex(s => s.id === submissionId);
    if (idx === -1) throw new Error('Submission not found');

    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    const aIdx = assignments.findIndex(a => a.id === assignmentId);
    const totalMarks = aIdx !== -1 ? assignments[aIdx].total_marks : 20;

    submissions[idx].status = "GRADED";
    submissions[idx].marks = data.marks;
    submissions[idx].feedback = data.feedback || null;
    submissions[idx].graded_at = new Date().toISOString();
    submissions[idx].graded_by = "dev-mock-uid";
    submissions[idx].grade_percentage = Math.round((data.marks / totalMarks) * 100);

    setStorage('mock_submissions', submissions);

    // Update assignment stats
    if (aIdx !== -1) {
      const aSubs = submissions.filter(s => s.assignment_id === assignmentId);
      const graded = aSubs.filter(s => s.status === 'GRADED');
      const marksSum = graded.reduce((sum, s) => sum + (s.marks || 0), 0);
      
      assignments[aIdx].graded_count = graded.length;
      assignments[aIdx].stats = {
        ...assignments[aIdx].stats,
        graded_count: graded.length,
        average_marks: graded.length > 0 ? marksSum / graded.length : null,
        max_marks: graded.length > 0 ? Math.max(...graded.map(g => g.marks || 0)) : null,
        min_marks: graded.length > 0 ? Math.min(...graded.map(g => g.marks || 0)) : null,
      };
      setStorage('mock_assignments', assignments);
    }

    return { success: true, message: 'Submission graded', submission: submissions[idx] };
  },

  getSubmissionForGrading: async (submissionId: string) => {
    const submissions = getStorage<any[]>('mock_submissions', SEED_SUBMISSIONS);
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');
    return sub;
  },

  bulkGradeSubmissions: async (data: any) => {
    const submissions = getStorage<any[]>('mock_submissions', SEED_SUBMISSIONS);
    const successful: any[] = [];
    const failed: any[] = [];

    data.grades.forEach((g: any) => {
      const idx = submissions.findIndex(s => s.id === g.submission_id);
      if (idx !== -1) {
        submissions[idx].status = "GRADED";
        submissions[idx].marks = g.marks;
        submissions[idx].feedback = g.feedback || null;
        submissions[idx].graded_at = new Date().toISOString();
        successful.push(submissions[idx]);
      } else {
        failed.push({ submission_id: g.submission_id, reason: 'Submission not found' });
      }
    });

    setStorage('mock_submissions', submissions);
    return {
      success: true,
      message: 'Bulk grading processed',
      data: {
        successful,
        failed,
        summary: {
          total: data.grades.length,
          successful: successful.length,
          failed: failed.length
        }
      }
    };
  },

  // Materials
  getMaterials: async (params?: any) => {
    const materials = getStorage<any[]>('mock_materials', SEED_MATERIALS);
    let filtered = materials;
    if (params?.class_id) {
      filtered = filtered.filter(m => m.class_id === params.class_id);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(m => m.title.toLowerCase().includes(q));
    }
    return {
      materials: filtered,
      pagination: { total: filtered.length, page: 1, limit: 20 }
    };
  },

  uploadMaterial: async (data: any) => {
    const materials = getStorage<any[]>('mock_materials', SEED_MATERIALS);
    const newMaterial = {
      id: `mat-${Date.now()}`,
      class_id: data.class_id,
      title: data.title,
      description: data.description || null,
      file_url: data.file_url,
      file_name: data.file_name,
      file_type: data.file_type,
      file_size_bytes: data.file_size_bytes || 1024,
      is_visible: data.is_visible !== false,
      uploaded_by: "dev-mock-uid",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    materials.unshift(newMaterial);
    setStorage('mock_materials', materials);
    return { success: true, message: 'Material uploaded successfully', material: newMaterial };
  },

  getMaterial: async (materialId: string) => {
    const materials = getStorage<any[]>('mock_materials', SEED_MATERIALS);
    const material = materials.find(m => m.id === materialId);
    if (!material) throw new Error('Material not found');
    return material;
  },

  updateMaterial: async (materialId: string, data: any) => {
    const materials = getStorage<any[]>('mock_materials', SEED_MATERIALS);
    const idx = materials.findIndex(m => m.id === materialId);
    if (idx === -1) throw new Error('Material not found');
    materials[idx] = { ...materials[idx], ...data, updated_at: new Date().toISOString() };
    setStorage('mock_materials', materials);
    return { success: true, message: 'Material updated', material: materials[idx] };
  },

  deleteMaterial: async (materialId: string) => {
    const materials = getStorage<any[]>('mock_materials', SEED_MATERIALS);
    const filtered = materials.filter(m => m.id !== materialId);
    setStorage('mock_materials', filtered);
    return { success: true, message: 'Material deleted successfully' };
  },

  // Notifications
  getNotifications: async (params?: any) => {
    const notifications = getStorage<any[]>('mock_notifications', SEED_NOTIFICATIONS);
    return {
      notifications,
      pagination: { total: notifications.length, page: 1, limit: 20 }
    };
  },

  createNotification: async (data: any) => {
    const notifications = getStorage<any[]>('mock_notifications', SEED_NOTIFICATIONS);
    const newNotif = {
      id: `notif-${Date.now()}`,
      user_id: "dev-mock-uid",
      type: data.type || "GENERAL",
      channel: data.channel || "IN_APP",
      title: data.title,
      message: data.message,
      link: data.link || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString()
    };
    notifications.unshift(newNotif);
    setStorage('mock_notifications', notifications);
    return { success: true, message: 'Notification created', notifications_created: 1 };
  },

  markNotificationRead: async (notificationId: string) => {
    const notifications = getStorage<any[]>('mock_notifications', SEED_NOTIFICATIONS);
    const idx = notifications.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      notifications[idx].is_read = true;
      notifications[idx].read_at = new Date().toISOString();
      setStorage('mock_notifications', notifications);
    }
    return { success: true, message: 'Notification marked read' };
  },

  deleteNotification: async (notificationId: string) => {
    const notifications = getStorage<any[]>('mock_notifications', SEED_NOTIFICATIONS);
    const filtered = notifications.filter(n => n.id !== notificationId);
    setStorage('mock_notifications', filtered);
    return { success: true, message: 'Notification deleted' };
  },

  // Analytics
  getAnalytics: async (params?: any) => {
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    const students = getStorage<any[]>('mock_students', SEED_STUDENTS);
    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    const submissions = getStorage<any[]>('mock_submissions', SEED_SUBMISSIONS);

    const pendingGradingCount = submissions.filter(s => s.status === 'SUBMITTED').length;

    return {
      total_classes: classes.length,
      active_classes: classes.filter(c => c.is_active).length,
      total_students: students.length,
      pending_grading: pendingGradingCount,
      unread_notifications: 1,
      recent_activity: [
        {
          id: "act-1",
          type: "submission",
          title: "Assignment Submission",
          description: "Aarav Anand submitted DBMS Lab Assignment 3",
          timestamp: new Date().toISOString(),
          link: "/teacher/assignments/assign-1/submissions"
        }
      ]
    };
  },

  getGradeAnalytics: async (params?: any) => {
    return {
      average: 78.5,
      highest: 98,
      lowest: 42,
      distribution: [
        { range: '0-40%', count: 2 },
        { range: '40-60%', count: 5 },
        { range: '60-70%', count: 12 },
        { range: '70-80%', count: 25 },
        { range: '80-90%', count: 18 },
        { range: '90-100%', count: 8 }
      ]
    };
  },

  getAtRiskStudents: async (params?: any) => {
    const students = getStorage<any[]>('mock_students', SEED_STUDENTS);
    const atRisk = students.filter(s => (s.attendance_percentage || 100) < 75 || (s.average_marks || 100) < 50);
    return {
      students: atRisk.length > 0 ? atRisk : [
        {
          student_id: "student-4",
          student_name: "Vikram Patel",
          enrollment_number: "24CSE042",
          attendance_percentage: 68,
          average_marks: 45.0,
          reason: "Low attendance (<75%) and performance (<50%)"
        }
      ]
    };
  },

  getAIInsights: async (params?: any) => {
    return {
      insights: [
        {
          type: "WARNING",
          title: "Attendance Drop in CSE Sem 3",
          description: "Friday attendance has dropped by 14% over the last 3 weeks. Consider posting lab session reminders.",
          recommendation: "Send practice reminder notification to enrolled students."
        },
        {
          type: "SUCCESS",
          title: "High DBMS Quiz Completion Rate",
          description: "88% of enrolled students completed DBMS Quiz 1 on time with an average score of 82%.",
          recommendation: "Release next study module."
        }
      ]
    };
  },

  // Settings
  getSettings: async () => {
    return {
      notifications: { email: true, inApp: true, sms: false },
      grading: { defaultLatePenalty: 10, returnGradesAutomatically: true },
      class_management: { allowJoinCodeRegistration: true }
    };
  },

  updateSettings: async (data: any) => {
    return { success: true, message: 'Settings updated' };
  },

  // Peer review
  setupPeerReview: async (assignmentId: string, data: any) => {
    return { success: true, message: 'Peer review setup successfully', assignment_id: assignmentId };
  },

  getPeerReviewStatus: async (assignmentId: string) => {
    return { reviews: [], reviews_assigned: 0, reviews_completed: 0 };
  },

  managePeerReviewAssignments: async (assignmentId: string, data: any) => {
    return { success: true, message: 'Peer review assignments updated' };
  },

  // Templates
  getAssignmentTemplates: async (params?: any) => {
    return {
      templates: [
        { id: "tmpl-1", title: "Standard Lab Report Template", description: "Default structure for engineering lab reports", total_marks: 20 },
        { id: "tmpl-2", title: "Comprehensive Case Study", description: "Case study layout with grading rubric", total_marks: 50 }
      ],
      pagination: { total: 2, page: 1, limit: 10 },
      filters: {}
    };
  },

  getAssignmentTemplate: async (templateId: string) => {
    return {
      template: { id: templateId, title: "Lab Report Template", description: "Standard template", total_marks: 20 }
    };
  },

  createAssignmentTemplate: async (data: any) => {
    return { success: true, message: 'Template created', template: data };
  },

  updateAssignmentTemplate: async (templateId: string, data: any) => {
    return { success: true, message: 'Template updated', template: data };
  },

  deleteAssignmentTemplate: async (templateId: string) => {
    return { success: true, message: 'Template deleted' };
  },

  useAssignmentTemplate: async (templateId: string, data: any) => {
    return { success: true, message: 'Template applied', assignment: {} };
  },

  // Messages
  getMessageThreads: async (params?: any) => {
    const threads = getStorage<any[]>('mock_messages', SEED_MESSAGES);
    return {
      threads,
      pagination: { total: threads.length, page: 1, limit: 20 },
      filters: {}
    };
  },

  sendMessage: async (data: any) => {
    const threads = getStorage<any[]>('mock_messages', SEED_MESSAGES);
    
    let threadId = data.thread_id;
    if (!threadId) {
      threadId = `thread-${Date.now()}`;
      threads.unshift({
        thread_id: threadId,
        thread_title: data.title || "New Thread",
        last_message: data.content,
        unread_count: 0,
        updated_at: new Date().toISOString(),
        messages: []
      });
    }

    const tIdx = threads.findIndex(t => t.thread_id === threadId);
    if (tIdx !== -1) {
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender_name: "Test Teacher",
        content: data.content,
        timestamp: new Date().toISOString()
      };
      threads[tIdx].messages.push(newMsg);
      threads[tIdx].last_message = data.content;
      threads[tIdx].updated_at = new Date().toISOString();
      setStorage('mock_messages', threads);
      return { success: true, message: 'Message sent', data: newMsg };
    }

    throw new Error('Thread not found');
  },

  getThreadMessages: async (threadId: string, params?: any) => {
    const threads = getStorage<any[]>('mock_messages', SEED_MESSAGES);
    const thread = threads.find(t => t.thread_id === threadId);
    if (!thread) throw new Error('Thread not found');
    return {
      messages: thread.messages || [],
      pagination: { total: (thread.messages || []).length, page: 1, limit: 50 }
    };
  },

  updateThread: async (threadId: string, data: any) => {
    return { success: true, message: 'Thread updated' };
  },

  updateTypingIndicator: async (threadId: string, isTyping: boolean) => {
    return { success: true, message: 'Typing updated' };
  },

  // Announcements
  getAnnouncements: async (params?: any) => {
    const defaultAnns = [
      { 
        id: "ann-1", 
        class_id: params?.class_id || "class-1",
        title: "End Semester Lab Exam Schedule", 
        content: "The final DBMS Lab exam is scheduled for Nov 24. Be ready with your project reports and files.", 
        priority: "HIGH", 
        pin_to_top: true,
        author_name: "Prof. Anand",
        comments: [
          { id: "c-1", author_name: "Aarav Anand", content: "Sir, should we submit the soft copy of the SQL queries too?", created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
          { id: "c-2", author_name: "Prof. Anand", content: "Yes Aarav, include the source SQL file in your project zip.", created_at: new Date().toISOString() }
        ],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
      },
      { 
        id: "ann-2", 
        class_id: params?.class_id || "class-1",
        title: "DBMS Project Groups Setup", 
        content: "Please finalize your project groups (max 3 members) and submit the topic proposals by Friday.", 
        priority: "NORMAL", 
        pin_to_top: false,
        author_name: "Prof. Anand",
        comments: [],
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() 
      }
    ];

    const anns = getStorage<any[]>('mock_announcements', defaultAnns);
    const filtered = params?.class_id ? anns.filter(a => a.class_id === params.class_id) : anns;

    return {
      announcements: filtered,
      pagination: { total: filtered.length, page: 1, limit: 50 },
      filters: {}
    };
  },

  createAnnouncement: async (data: any) => {
    const anns = getStorage<any[]>('mock_announcements', []);
    const newAnn = {
      id: `ann-${Date.now()}`,
      class_id: data.class_id || "class-1",
      title: data.title,
      content: data.content,
      priority: data.priority || "NORMAL",
      pin_to_top: data.pin_to_top || false,
      author_name: "Prof. Anand",
      comments: [],
      created_at: new Date().toISOString()
    };
    anns.unshift(newAnn);
    setStorage('mock_announcements', anns);
    return { success: true, message: 'Announcement created', announcement: newAnn, notifications_sent: 5 };
  },

  getAnnouncement: async (announcementId: string) => {
    const anns = getStorage<any[]>('mock_announcements', []);
    const ann = anns.find(a => a.id === announcementId);
    if (!ann) throw new Error('Announcement not found');
    return { announcement: ann };
  },

  updateAnnouncement: async (announcementId: string, data: any) => {
    const anns = getStorage<any[]>('mock_announcements', []);
    const idx = anns.findIndex(a => a.id === announcementId);
    if (idx === -1) throw new Error('Announcement not found');
    anns[idx] = { ...anns[idx], ...data, updated_at: new Date().toISOString() };
    setStorage('mock_announcements', anns);
    return { success: true, message: 'Announcement updated', announcement: anns[idx], notifications_sent: 5 };
  },

  deleteAnnouncement: async (announcementId: string) => {
    const anns = getStorage<any[]>('mock_announcements', []);
    const filtered = anns.filter(a => a.id !== announcementId);
    setStorage('mock_announcements', filtered);
    return { success: true, message: 'Announcement deleted' };
  },

  // Parent Communications
  getParentCommunications: async (params?: any) => {
    return {
      communications: [],
      pagination: { total: 0, page: 1, limit: 10 },
      filters: {}
    };
  },

  sendParentCommunication: async (data: any) => {
    return {
      success: true,
      message: 'Parent communication sent',
      data: {
        successful: data.student_ids,
        failed: [],
        summary: { total: data.student_ids.length, successful: data.student_ids.length, failed: 0 }
      }
    };
  },

  getClassGradebook: async (classId: string) => {
    const students = getStorage<any[]>('mock_students', SEED_STUDENTS).filter(s => s.class_id === classId);
    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS).filter(a => a.class_id === classId);
    const submissions = getStorage<any[]>('mock_submissions', SEED_SUBMISSIONS);

    const grades: Record<string, Record<string, number | null>> = {};

    students.forEach(student => {
      grades[student.student_id] = {};
      assignments.forEach(assign => {
        const sub = submissions.find(s => s.assignment_id === assign.id && s.student_id === student.student_id);
        grades[student.student_id][assign.id] = sub && sub.status === 'GRADED' ? sub.marks : null;
      });
    });

    return {
      students: students.map(s => ({ id: s.student_id, name: s.student_name, enrollment_number: s.enrollment_number })),
      assignments: assignments.map(a => ({ id: a.id, title: a.title, total_marks: a.total_marks })),
      grades
    };
  },

  getAIEvaluationDraft: async (submissionId: string) => {
    const submissions = getStorage<any[]>('mock_submissions', SEED_SUBMISSIONS);
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');

    const assignments = getStorage<any[]>('mock_assignments', SEED_ASSIGNMENTS);
    const assign = assignments.find(a => a.id === sub.assignment_id);
    const totalMarks = assign ? assign.total_marks : 20;

    let suggestedMarks = Math.round(totalMarks * 0.85);
    let feedback = "Good overall attempt. Standard query syntax is followed, join predicates are correct. Try organizing the outputs in a tabular layout for better clarity.";

    if (sub.student_name === "Aarav Anand") {
      suggestedMarks = Math.round(totalMarks * 0.925);
      feedback = "Excellent solution! All queries compile correctly and output shapes match expectations. The normalization logic is highly detailed with correct functional dependencies.";
    } else if (sub.student_name === "Rahul Verma") {
      suggestedMarks = Math.round(totalMarks * 0.76);
      feedback = "Solid query logic, but left outer join implementation is missing matching NULL cases in the where predicate. Good schema modeling.";
    }

    return {
      marks: suggestedMarks,
      feedback
    };
  },

  // ============================================================
  // LIVE CHALLENGE WORD ATTENDANCE SESSION METHODS
  // ============================================================

  createAttendanceSession: async (data: {
    class_id: string;
    session_code?: string;
    challenge_word?: string;
    duration_minutes?: number;
    geofence_enabled?: boolean;
    geofence_latitude?: number;
    geofence_longitude?: number;
    geofence_radius_meters?: number;
  }): Promise<{ success: boolean; session: AttendanceSession }> => {
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    const cls = classes.find(c => c.id === data.class_id);
    const className = cls ? cls.name : 'Engineering Class';

    // Auto-generate random 6-digit session code (e.g., 483921)
    const session_code = data.session_code?.trim() || Math.floor(100000 + Math.random() * 900000).toString();

    // Challenge word defaults to numeric code
    const challenge_word = data.challenge_word?.trim() || session_code;
    const duration_minutes = data.duration_minutes || 10;

    const starts_at = new Date().toISOString();
    const expires_at = new Date(Date.now() + duration_minutes * 60 * 1000).toISOString();

    const newSession: AttendanceSession = {
      id: `session-${Date.now()}`,
      class_id: data.class_id,
      class_name: className,
      session_code,
      challenge_word,
      duration_minutes,
      starts_at,
      expires_at,
      geofence_enabled: data.geofence_enabled ?? false,
      geofence_latitude: data.geofence_latitude ?? 23.0225,
      geofence_longitude: data.geofence_longitude ?? 72.5714,
      geofence_radius_meters: data.geofence_radius_meters ?? 150,
      is_active: true,
      created_at: starts_at,
      submissions_count: 0,
    };

    // Deactivate existing sessions for this class
    const sessions = getStorage<AttendanceSession[]>('mock_attendance_sessions', []);
    const updatedSessions = sessions.map(s => s.class_id === data.class_id ? { ...s, is_active: false } : s);
    updatedSessions.unshift(newSession);
    setStorage('mock_attendance_sessions', updatedSessions);

    return { success: true, session: newSession };
  },

  getActiveAttendanceSession: async (classId: string): Promise<{ session: AttendanceSession | null }> => {
    const sessions = getStorage<AttendanceSession[]>('mock_attendance_sessions', []);
    const now = new Date();
    const active = sessions.find(s => s.class_id === classId && s.is_active && new Date(s.expires_at) > now);
    return { session: active || null };
  },

  endAttendanceSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const sessions = getStorage<AttendanceSession[]>('mock_attendance_sessions', []);
    const updated = sessions.map(s => s.id === sessionId ? { ...s, is_active: false } : s);
    setStorage('mock_attendance_sessions', updated);
    return { success: true, message: 'Live attendance session ended' };
  },

  getAttendanceSessionSubmissions: async (sessionId: string): Promise<{ submissions: StudentAttendanceSubmission[] }> => {
    const allSubmissions = getStorage<StudentAttendanceSubmission[]>('mock_session_submissions', []);
    const filtered = allSubmissions.filter(sub => sub.session_id === sessionId);
    return { submissions: filtered };
  },

  submitStudentAttendance: async (data: {
    session_code: string;
    challenge_word?: string;
    student_id: string;
    student_name: string;
    enrollment_number: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ success: boolean; message: string; submission?: StudentAttendanceSubmission }> => {
    const sessions = getStorage<AttendanceSession[]>('mock_attendance_sessions', []);
    const now = new Date();
    const session = sessions.find(s => s.session_code === data.session_code.trim() && s.is_active);

    if (!session) {
      throw new Error('Invalid or expired attendance session code.');
    }

    if (new Date(session.expires_at) <= now) {
      session.is_active = false;
      setStorage('mock_attendance_sessions', sessions);
      throw new Error('This attendance session has expired.');
    }

    // Check if student already submitted
    const submissions = getStorage<StudentAttendanceSubmission[]>('mock_session_submissions', []);
    const existing = submissions.find(sub => sub.session_id === session.id && sub.student_id === data.student_id);
    if (existing) {
      throw new Error('You have already submitted attendance for this session!');
    }

    // Geofence Distance Calculation
    let isWithinGeofence = true;
    let distanceMeters = 0;

    if (session.geofence_enabled && session.geofence_latitude && session.geofence_longitude) {
      if (data.latitude && data.longitude) {
        distanceMeters = calculateDistanceMeters(
          data.latitude,
          data.longitude,
          session.geofence_latitude,
          session.geofence_longitude
        );
        const radius = session.geofence_radius_meters || 150;
        if (distanceMeters > radius) {
          isWithinGeofence = false;
          throw new Error(`Location Check Failed! You are ${distanceMeters}m away from class (max ${radius}m allowed).`);
        }
      } else {
        throw new Error('GPS Location required for this session. Please enable GPS location.');
      }
    }

    const newSubmission: StudentAttendanceSubmission = {
      id: `sub-${Date.now()}`,
      session_id: session.id,
      class_id: session.class_id,
      student_id: data.student_id,
      student_name: data.student_name,
      enrollment_number: data.enrollment_number,
      challenge_word_submitted: data.challenge_word?.trim() || '',
      is_word_correct: true,

      latitude: data.latitude,
      longitude: data.longitude,
      distance_meters: distanceMeters,
      is_within_geofence: isWithinGeofence,
      submitted_at: new Date().toISOString(),
      status: 'VERIFIED_PRESENT',
    };

    submissions.unshift(newSubmission);
    setStorage('mock_session_submissions', submissions);

    // Increment submissions count in session
    session.submissions_count = (session.submissions_count || 0) + 1;
    setStorage('mock_attendance_sessions', sessions);

    // Dispatch real-time sync event
    try {
      window.dispatchEvent(new CustomEvent('shiksha_attendance_submit', { detail: newSubmission }));
      window.dispatchEvent(new CustomEvent('shiksha_attendance_submit', { detail: newSubmission }));
      localStorage.setItem(`shiksha_sync_submit_${Date.now()}`, JSON.stringify(newSubmission));
    } catch (e) {
      console.warn('Sync dispatch skipped:', e);
    }

    return {
      success: true,
      message: '🎉 Attendance Verified & Marked Present!',
      submission: newSubmission,
    };
  },

  enrollStudentByJoinCode: async (data: {
    join_code: string;
    student_id: string;
    student_name: string;
    student_email: string;
    enrollment_number: string;
  }): Promise<{ success: boolean; message: string; classData: any }> => {
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    const code = data.join_code.trim().toUpperCase();
    const cls = classes.find(c => c.join_code.toUpperCase() === code && c.is_active);

    if (!cls) {
      throw new Error(`Invalid or inactive Join Code "${data.join_code}". Please check with your teacher.`);
    }

    const students = getStorage<any[]>('mock_students', SEED_STUDENTS);
    const existing = students.find(s => s.class_id === cls.id && s.student_id === data.student_id);

    if (existing) {
      return {
        success: true,
        message: `You are already enrolled in ${cls.name}!`,
        classData: cls
      };
    }

    // Add student to class
    const newStudent = {
      enrollment_id: `enr-${Date.now()}`,
      class_id: cls.id,
      student_id: data.student_id,
      enrollment_number: data.enrollment_number,
      student_name: data.student_name,
      student_email: data.student_email,
      status: 'ACTIVE',
      joined_at: new Date().toISOString()
    };

    students.push(newStudent);
    setStorage('mock_students', students);

    // Update class student count
    cls.student_count = (cls.student_count || 0) + 1;
    setStorage('mock_classes', classes);

    // Broadcast sync event
    try {
      window.dispatchEvent(new CustomEvent('shiksha_student_joined_class', { detail: { class: cls, student: newStudent } }));
      window.dispatchEvent(new CustomEvent('shiksha_student_joined_class', { detail: { class: cls, student: newStudent } }));
    } catch (e) {
      console.warn('Sync dispatch skipped:', e);
    }

    return {
      success: true,
      message: `🎉 Successfully joined ${cls.name}!`,
      classData: cls
    };
  },

  getStudentEnrolledClasses: async (studentId: string): Promise<{ classes: any[] }> => {
    const classes = getStorage<any[]>('mock_classes', SEED_CLASSES);
    const students = getStorage<any[]>('mock_students', SEED_STUDENTS);
    const studentEnrolledClassIds = students.filter(s => s.student_id === studentId).map(s => s.class_id);
    
    // Return enrolled classes, or default to all active classes if none explicitly joined yet
    const enrolled = classes.filter(c => studentEnrolledClassIds.includes(c.id));
    return { classes: enrolled.length > 0 ? enrolled : classes };
  },

  verifyTeacherWhitelist: async (email: string): Promise<{ email: string; isWhitelisted: boolean }> => {
    const whitelisted = [
      'contact@shikshasahayak.org',
      'tech@shikshasahayak.org',
      'team@shikshasahayak.org',
      'developer@shikshasahayak.org',
      'teacher@shikshasahayak.org'
    ];
    const isWhitelisted = whitelisted.includes(email.toLowerCase().trim());
    return { email, isWhitelisted };
  }
};
