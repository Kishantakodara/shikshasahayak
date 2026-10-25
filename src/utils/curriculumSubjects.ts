// ============================================================
// SHIKSHA SAHAYAK OS - CANONICAL GTU CURRICULUM SUBJECT PROVIDER
// Authoritative mapping of GTU BE subjects across semesters 1 to 8
// for all Core, Emerging, and Cross-Branch specializations.
// ============================================================

export interface CurriculumSubjectItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  credits?: number;
  progress?: number;
  units?: string;
  isElective?: boolean;
}

export function getCurriculumSubjectsForBranchAndSemester(
  branchIdentifier: string,
  semester: number
): CurriculumSubjectItem[] {
  const b = (branchIdentifier || '').toLowerCase();
  const isEE = b.includes('electric') || b.includes('ee') || b.includes('power');
  const isME = b.includes('mechanic') || b.includes('me') || b.includes('auto');
  const isCivil = b.includes('civil') || b.includes('ce') || b.includes('infra') || b.includes('construct');
  const isEC = b.includes('electronic') || b.includes('ec') || b.includes('comm') || b.includes('instrument');
  const isChem = b.includes('chem') || b.includes('plastic') || b.includes('process');

  // Semester 1 (Common to all engineering branches)
  if (semester === 1) {
    return [
      { id: 'be-m1', code: '3110014', name: 'Mathematics - 1', slug: 'mathematics-1', progress: 75, units: '5/7 Units' },
      { id: 'be-pps', code: '3110003', name: 'Programming for Problem Solving', slug: 'programming-for-problem-solving', progress: 85, units: '6/7 Units' },
      { id: 'be-bee', code: '3110005', name: 'Basic Electrical Engineering', slug: 'basic-electrical-engineering', progress: 60, units: '4/7 Units' },
      { id: 'be-eg', code: '3110013', name: 'Engineering Graphics & Design', slug: 'engineering-graphics-and-design', progress: 50, units: '3/7 Units' },
      { id: 'be-eng', code: '3110002', name: 'English', slug: 'english', progress: 90, units: '6/7 Units' },
    ];
  }

  // Semester 2 (Common to all engineering branches)
  if (semester === 2) {
    return [
      { id: 'be-m2', code: '3110015', name: 'Mathematics - 2', slug: 'mathematics-2', progress: 70, units: '5/7 Units' },
      { id: 'be-phy', code: '3110011', name: 'Physics (Electromagnetism / Optics)', slug: 'physics', progress: 65, units: '4/7 Units' },
      { id: 'be-bme', code: '3110006', name: 'Basic Mechanical Engineering', slug: 'basic-mechanical-engineering', progress: 60, units: '4/7 Units' },
      { id: 'be-bce', code: '3110004', name: 'Basic Civil Engineering', slug: 'basic-civil-engineering', progress: 55, units: '3/7 Units' },
      { id: 'be-env', code: '3110007', name: 'Environmental Science', slug: 'environmental-science', progress: 80, units: '5/7 Units' },
    ];
  }

  // Electrical Engineering
  if (isEE) {
    if (semester === 3) {
      return [
        { id: 'ee-cn', code: '3130908', name: 'Circuits and Networks', slug: 'circuits-and-networks', progress: 70, units: '5/7 Units' },
        { id: 'ee-emi', code: '3130906', name: 'Electrical Measurements & Instrumentation', slug: 'electrical-measurements', progress: 60, units: '4/7 Units' },
        { id: 'ee-aed', code: '3130907', name: 'Analog Electronic Devices', slug: 'analog-electronic-devices', progress: 65, units: '4/7 Units' },
        { id: 'ee-em1', code: '3130905', name: 'Electrical Machines - I', slug: 'electrical-machines-1', progress: 55, units: '3/7 Units' },
      ];
    }
    if (semester === 4) {
      return [
        { id: 'ee-ps1', code: '3140914', name: 'Power System - I', slug: 'power-system-1', progress: 65, units: '4/7 Units' },
        { id: 'ee-em2', code: '3140913', name: 'Electrical Machines - II', slug: 'electrical-machines-2', progress: 70, units: '5/7 Units' },
        { id: 'ee-pe', code: '3140915', name: 'Power Electronics', slug: 'power-electronics', progress: 55, units: '3/7 Units' },
        { id: 'ee-cs', code: '3140912', name: 'Control System Engineering', slug: 'control-system-engineering', progress: 60, units: '4/7 Units' },
      ];
    }
    if (semester === 5) {
      return [
        { id: 'ee-ps2', code: '3150911', name: 'Power System - II', slug: 'power-system-2', progress: 70, units: '5/7 Units' },
        { id: 'ee-mp', code: '3150912', name: 'Microprocessor and Microcontroller', slug: 'microprocessor-and-microcontroller', progress: 60, units: '4/7 Units' },
        { id: 'ee-epp', code: '3150910', name: 'Electrical Power Generation & Economics', slug: 'electrical-power-generation', progress: 75, units: '5/7 Units' },
        { id: 'ee-edm', code: '3150914', name: 'Electric Drives & Control', slug: 'electric-drives', progress: 50, units: '3/7 Units' },
      ];
    }
    if (semester === 6) {
      return [
        { id: 'ee-hvdc', code: '3160912', name: 'HVDC Transmission Systems', slug: 'hvdc-transmission', progress: 65, units: '4/7 Units' },
        { id: 'ee-sgp', code: '3160914', name: 'Switchgear & Protection', slug: 'switchgear-and-protection', progress: 70, units: '5/7 Units' },
        { id: 'ee-dps', code: '3160916', name: 'Digital Signal Processing', slug: 'dsp', progress: 60, units: '4/7 Units' },
        { id: 'ee-ev', code: '3160920', name: 'Electric Vehicles Technology', slug: 'electric-vehicles', progress: 80, units: '5/7 Units', isElective: true },
      ];
    }
    if (semester === 7) {
      return [
        { id: 'ee-emc', code: '3170915', name: 'Energy Management & Audit', slug: 'energy-management', progress: 70, units: '5/7 Units' },
        { id: 'ee-res', code: '3170918', name: 'Renewable Energy Sources', slug: 'renewable-energy', progress: 75, units: '5/7 Units' },
        { id: 'ee-proj1', code: '3170001', name: 'Project - Phase I', slug: 'project-1', progress: 85, units: 'Ongoing' },
      ];
    }
    return [
      { id: 'ee-sg', code: '3180911', name: 'Smart Grid Technologies', slug: 'smart-grid', progress: 70, units: '5/7 Units' },
      { id: 'ee-proj2', code: '3180001', name: 'Project - Phase II / Internship', slug: 'project-2', progress: 90, units: 'Ongoing' },
    ];
  }

  // Mechanical Engineering
  if (isME) {
    if (semester === 3) {
      return [
        { id: 'me-thermo', code: '3131905', name: 'Engineering Thermodynamics', slug: 'engineering-thermodynamics', progress: 65, units: '4/7 Units' },
        { id: 'me-fm', code: '3131906', name: 'Fluid Mechanics & Hydraulic Machines', slug: 'fluid-mechanics', progress: 70, units: '5/7 Units' },
        { id: 'me-mp', code: '3131907', name: 'Manufacturing Processes', slug: 'manufacturing-processes', progress: 80, units: '6/7 Units' },
        { id: 'me-mos', code: '3131908', name: 'Mechanics of Solids', slug: 'mechanics-of-solids', progress: 55, units: '3/7 Units' },
      ];
    }
    if (semester === 4) {
      return [
        { id: 'me-tom', code: '3141906', name: 'Theory of Machines', slug: 'theory-of-machines', progress: 65, units: '4/7 Units' },
        { id: 'me-at', code: '3141907', name: 'Applied Thermodynamics', slug: 'applied-thermodynamics', progress: 70, units: '5/7 Units' },
        { id: 'me-ms', code: '3141908', name: 'Material Science & Metallurgy', slug: 'material-science', progress: 60, units: '4/7 Units' },
        { id: 'me-fem', code: '3141909', name: 'Finite Element Method', slug: 'fem', progress: 50, units: '3/7 Units' },
      ];
    }
    if (semester === 5) {
      return [
        { id: 'me-ht', code: '3151909', name: 'Heat Transfer', slug: 'heat-transfer', progress: 60, units: '4/7 Units' },
        { id: 'me-ic', code: '3151910', name: 'Internal Combustion Engines', slug: 'internal-combustion-engines', progress: 75, units: '5/7 Units' },
        { id: 'me-dom', code: '3151911', name: 'Dynamics of Machinery', slug: 'dynamics-of-machinery', progress: 65, units: '4/7 Units' },
        { id: 'me-dme', code: '3151912', name: 'Design of Machine Elements', slug: 'design-machine-elements', progress: 55, units: '3/7 Units' },
      ];
    }
    if (semester === 6) {
      return [
        { id: 'me-md', code: '3161907', name: 'Computer Aided Design (CAD)', slug: 'cad', progress: 75, units: '5/7 Units' },
        { id: 'me-refrig', code: '3161908', name: 'Refrigeration and Air Conditioning', slug: 'rac', progress: 70, units: '5/7 Units' },
        { id: 'me-or', code: '3161909', name: 'Operations Research', slug: 'operations-research', progress: 60, units: '4/7 Units' },
      ];
    }
    if (semester === 7) {
      return [
        { id: 'me-auto', code: '3171911', name: 'Automobile Engineering', slug: 'automobile-engineering', progress: 70, units: '5/7 Units' },
        { id: 'me-robot', code: '3171916', name: 'Industrial Robotics', slug: 'industrial-robotics', progress: 80, units: '6/7 Units' },
        { id: 'me-proj1', code: '3170001', name: 'Project - Phase I', slug: 'project-1', progress: 85, units: 'Ongoing' },
      ];
    }
    return [
      { id: 'me-cpm', code: '3181910', name: 'Production & Operations Management', slug: 'production-management', progress: 75, units: '5/7 Units' },
      { id: 'me-proj2', code: '3180001', name: 'Project - Phase II / Industry Internship', slug: 'project-2', progress: 90, units: 'Ongoing' },
    ];
  }

  // Civil Engineering
  if (isCivil) {
    if (semester === 3) {
      return [
        { id: 'ce-mos', code: '3130608', name: 'Mechanics of Solids', slug: 'mechanics-of-solids', progress: 60, units: '4/7 Units' },
        { id: 'ce-surv', code: '3130607', name: 'Surveying', slug: 'surveying', progress: 75, units: '5/7 Units' },
        { id: 'ce-ct', code: '3130606', name: 'Concrete Technology', slug: 'concrete-technology', progress: 80, units: '6/7 Units' },
        { id: 'ce-fm', code: '3130609', name: 'Fluid Mechanics', slug: 'fluid-mechanics', progress: 65, units: '4/7 Units' },
      ];
    }
    if (semester === 4) {
      return [
        { id: 'ce-sa1', code: '3140603', name: 'Structural Analysis - I', slug: 'structural-analysis-1', progress: 60, units: '4/7 Units' },
        { id: 'ce-geo', code: '3140608', name: 'Geotechnical Engineering', slug: 'geotechnical-engineering', progress: 65, units: '4/7 Units' },
        { id: 'ce-adv-surv', code: '3140609', name: 'Advanced Surveying', slug: 'advanced-surveying', progress: 70, units: '5/7 Units' },
        { id: 'ce-wre', code: '3140610', name: 'Water Resources Engineering', slug: 'water-resources', progress: 75, units: '5/7 Units' },
      ];
    }
    if (semester === 5) {
      return [
        { id: 'ce-drcs', code: '3150611', name: 'Design of Reinforced Concrete Structures', slug: 'drcs', progress: 70, units: '5/7 Units' },
        { id: 'ce-te', code: '3150613', name: 'Highway & Transportation Engineering', slug: 'transportation-engineering', progress: 75, units: '5/7 Units' },
        { id: 'ce-hydr', code: '3150614', name: 'Hydrology and Water Resources', slug: 'hydrology', progress: 60, units: '4/7 Units' },
      ];
    }
    if (semester === 6) {
      return [
        { id: 'ce-dss', code: '3160611', name: 'Design of Steel Structures', slug: 'design-steel-structures', progress: 65, units: '4/7 Units' },
        { id: 'ce-ee', code: '3160612', name: 'Environmental Engineering', slug: 'environmental-engineering', progress: 75, units: '5/7 Units' },
        { id: 'ce-cm', code: '3160613', name: 'Construction Management & Equipment', slug: 'construction-management', progress: 80, units: '6/7 Units' },
      ];
    }
    return [
      { id: 'ce-est', code: '3170615', name: 'Estimation, Costing & Valuation', slug: 'estimation-costing', progress: 70, units: '5/7 Units' },
      { id: 'ce-proj2', code: '3180001', name: 'Major Project / Internship', slug: 'project-2', progress: 90, units: 'Ongoing' },
    ];
  }

  // Electronics & Communication (ECE)
  if (isEC) {
    if (semester === 3) {
      return [
        { id: 'ec-dld', code: '3131101', name: 'Digital System Design', slug: 'digital-system-design', progress: 70, units: '5/7 Units' },
        { id: 'ec-ed', code: '3131102', name: 'Electronic Devices', slug: 'electronic-devices', progress: 65, units: '4/7 Units' },
        { id: 'ec-ss', code: '3131103', name: 'Signals and Systems', slug: 'signals-and-systems', progress: 60, units: '4/7 Units' },
        { id: 'ec-na', code: '3131104', name: 'Network Analysis', slug: 'network-analysis', progress: 75, units: '5/7 Units' },
      ];
    }
    if (semester === 4) {
      return [
        { id: 'ec-ac', code: '3141101', name: 'Analog Circuits', slug: 'analog-circuits', progress: 65, units: '4/7 Units' },
        { id: 'ec-cs', code: '3141102', name: 'Communication Systems', slug: 'communication-systems', progress: 70, units: '5/7 Units' },
        { id: 'ec-emw', code: '3141103', name: 'Electromagnetic Waves', slug: 'electromagnetic-waves', progress: 55, units: '3/7 Units' },
      ];
    }
    return [
      { id: 'ec-dsp', code: '3151101', name: 'Digital Signal Processing', slug: 'dsp', progress: 70, units: '5/7 Units' },
      { id: 'ec-vlsi', code: '3151102', name: 'VLSI Design & Architecture', slug: 'vlsi-design', progress: 65, units: '4/7 Units' },
      { id: 'ec-embedded', code: '3161103', name: 'Embedded Systems & RTOS', slug: 'embedded-systems', progress: 75, units: '5/7 Units' },
      { id: 'ec-wireless', code: '3171104', name: 'Wireless Communication & 5G', slug: 'wireless-communication', progress: 80, units: '6/7 Units' },
    ];
  }

  // Computer Engineering / Information Technology / AI & Data Science
  if (semester === 3) {
    return [
      { id: 'cse-ds', code: '3130702', name: 'Data Structures', slug: 'data-structures', progress: 78, units: '5/7 Units' },
      { id: 'cse-dbms', code: '3130703', name: 'Database Management Systems', slug: 'database-management-systems', progress: 82, units: '6/7 Units' },
      { id: 'cse-dld', code: '3130704', name: 'Digital Logic & Design', slug: 'digital-logic-design', progress: 64, units: '4/7 Units' },
      { id: 'cse-etc', code: '3130004', name: 'Effective Technical Communication', slug: 'effective-technical-communication', progress: 90, units: '6/7 Units' },
      { id: 'cse-ps', code: '3130006', name: 'Probability and Statistics', slug: 'probability-and-statistics', progress: 60, units: '4/7 Units' },
    ];
  }

  if (semester === 4) {
    return [
      { id: 'cse-os', code: '3140702', name: 'Operating System', slug: 'operating-system', progress: 70, units: '5/7 Units' },
      { id: 'cse-oop', code: '3140705', name: 'Object Oriented Programming - I (Java)', slug: 'object-oriented-programming', progress: 85, units: '6/7 Units' },
      { id: 'cse-dm', code: '3140708', name: 'Discrete Mathematics', slug: 'discrete-mathematics', progress: 60, units: '4/7 Units' },
      { id: 'cse-coa', code: '3140707', name: 'Computer Organization & Architecture', slug: 'computer-organization-and-architecture', progress: 55, units: '4/7 Units' },
      { id: 'cse-pe', code: '3140709', name: 'Principles of Economics and Management', slug: 'principles-of-economics', progress: 80, units: '5/7 Units' },
    ];
  }

  if (semester === 5) {
    return [
      { id: 'cse-cn', code: '3150710', name: 'Computer Networks', slug: 'computer-networks', progress: 72, units: '5/7 Units' },
      { id: 'cse-daa', code: '3150703', name: 'Analysis and Design of Algorithms', slug: 'design-and-analysis-of-algorithms', progress: 65, units: '4/7 Units' },
      { id: 'cse-se', code: '3150711', name: 'Software Engineering', slug: 'software-engineering', progress: 80, units: '6/7 Units' },
      { id: 'cse-pe-eth', code: '3150709', name: 'Professional Ethics', slug: 'professional-ethics', progress: 90, units: '6/7 Units' },
      { id: 'cse-cs', code: '3150714', name: 'Cyber Security', slug: 'cyber-security', progress: 58, units: '4/7 Units' },
    ];
  }

  if (semester === 6) {
    return [
      { id: 'cse-ajava', code: '3160707', name: 'Advanced Java Programming', slug: 'advanced-java', progress: 70, units: '5/7 Units' },
      { id: 'cse-wt', code: '3160713', name: 'Web Technology', slug: 'web-technology', progress: 85, units: '6/7 Units' },
      { id: 'cse-mad', code: '3160716', name: 'Mobile Application Development', slug: 'mobile-app-development', progress: 60, units: '4/7 Units' },
      { id: 'cse-dmbi', code: '3160714', name: 'Data Mining & Business Intelligence', slug: 'data-mining', progress: 65, units: '5/7 Units' },
    ];
  }

  if (semester === 7) {
    return [
      { id: 'cse-ai', code: '3170710', name: 'Artificial Intelligence', slug: 'artificial-intelligence', progress: 75, units: '5/7 Units' },
      { id: 'cse-cc', code: '3170717', name: 'Cloud Computing', slug: 'cloud-computing', progress: 70, units: '5/7 Units' },
      { id: 'cse-ins', code: '3170720', name: 'Information and Network Security', slug: 'information-security', progress: 65, units: '4/7 Units' },
      { id: 'cse-proj1', code: '3170701', name: 'Major Project - Phase I', slug: 'major-project-1', progress: 80, units: 'Ongoing' },
    ];
  }

  // Semester 8
  return [
    { id: 'cse-ml', code: '3180703', name: 'Machine Learning', slug: 'machine-learning', progress: 70, units: '5/7 Units' },
    { id: 'cse-bda', code: '3180701', name: 'Big Data Analytics', slug: 'big-data-analytics', progress: 65, units: '4/7 Units' },
    { id: 'cse-iot', code: '3180709', name: 'Internet of Things (IoT)', slug: 'iot', progress: 75, units: '5/7 Units' },
    { id: 'cse-proj2', code: '3180702', name: 'Major Project - Phase II / Internship', slug: 'major-project-2', progress: 85, units: 'Ongoing' },
  ];
}
