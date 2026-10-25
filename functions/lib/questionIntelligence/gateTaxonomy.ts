// ============================================================
// GATE 2027 OFFICIAL TAXONOMY & SYLLABUS DATASET
// Official IIT Madras GATE 2027 30 Papers + Revised Sectional Codes
// Reference: https://gate2027.iitm.ac.in/exam_papers_and_syllabus
// ============================================================

export interface GatePaperSection {
  code: string;
  name: string;
  isCompulsory?: boolean;
  subjects: GateSubjectDef[];
}

export interface GateSubjectDef {
  id: string;
  name: string;
  code?: string;
  topics: string[];
}

export interface GatePaperDef {
  code: string;
  name: string;
  category: string;
  isNew?: boolean;
  syllabusUrl: string;
  sections: GatePaperSection[];
}

export const COMMON_GENERAL_APTITUDE_SECTION: GatePaperSection = {
  code: 'GA',
  name: 'General Aptitude (Common to All 30 Papers - 15 Marks)',
  isCompulsory: true,
  subjects: [
    {
      id: 'ga_verbal',
      name: 'Verbal Aptitude',
      topics: ['Basic English Grammar', 'Sentence Completion', 'Vocabulary & Word Analogy', 'Reading Comprehension', 'Critical Reasoning'],
    },
    {
      id: 'ga_quant',
      name: 'Quantitative Aptitude',
      topics: ['Data Interpretation & Graphs', 'Numerical Computation & Estimation', 'Elementary Statistics & Probability', 'Percentages & Ratios', 'Permutation & Combination'],
    },
    {
      id: 'ga_analytical',
      name: 'Analytical Aptitude',
      topics: ['Logic & Deduction', 'Analogy & Patterns', 'Number Series & Relations', 'Blood Relations & Direction Sense'],
    },
    {
      id: 'ga_spatial',
      name: 'Spatial Aptitude',
      topics: ['Transformation of 2D & 3D Shapes', 'Paper Folding & Cutting', 'Mirror & Water Images', 'Grouping of Identical Figures'],
    },
  ],
};

export const GATE_2027_PAPERS: GatePaperDef[] = [
  // 1. CS - Computer Science and Information Technology
  {
    code: 'CS',
    name: 'Computer Science and Information Technology',
    category: 'Computer Science & AI',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'CS_CORE',
        name: 'Technical Core Computer Science',
        isCompulsory: true,
        subjects: [
          {
            id: 'cs_eng_math',
            name: 'Engineering Mathematics',
            topics: ['Discrete Mathematics', 'Propositional and First-Order Logic', 'Sets, Relations & Functions', 'Partial Orders & Lattices', 'Monoids & Groups', 'Combinatorics & Counting', 'Graph Theory: Connectivity & Coloring', 'Linear Algebra: Matrices & Eigenvalues', 'Calculus: Limits & Maxima-Minima', 'Probability & Distributions'],
          },
          {
            id: 'cs_digital_logic',
            name: 'Digital Logic',
            topics: ['Boolean Algebra & Minimization', 'Combinational Circuits: Adders & Multiplexers', 'Sequential Circuits: Flip-flops & Counters', 'Number Representations: Two\'s Complement', 'Computer Arithmetic: Fixed & Floating Point'],
          },
          {
            id: 'cs_coa',
            name: 'Computer Organization and Architecture',
            topics: ['Machine Instructions & Addressing Modes', 'ALU, Data Path and Control Unit', 'Instruction Pipelining & Pipeline Hazards', 'Memory Hierarchy: Cache, Main & Secondary', 'Cache Mapping & Cache Coherence', 'I/O Interface: Interrupt & DMA'],
          },
          {
            id: 'cs_prog_ds',
            name: 'Programming and Data Structures',
            topics: ['Programming in C: Functions & Pointers', 'Recursion & Dynamic Memory', 'Arrays & Linked Lists', 'Stacks & Queues', 'Trees: Binary Trees & BST', 'Binary Heaps & Priority Queues', 'Graphs: Representation & Traversal'],
          },
          {
            id: 'cs_algorithms',
            name: 'Algorithms',
            topics: ['Asymptotic Analysis of Worst & Average Time', 'Divide-and-Conquer: Recurrences & Master Theorem', 'Greedy Algorithms: Huffman & Minimum Spanning Trees', 'Dynamic Programming: LCS, 0/1 Knapsack', 'Shortest Paths: Dijkstra & Bellman-Ford', 'Graph Search: BFS & DFS', 'NP-Completeness & Reductions'],
          },
          {
            id: 'cs_toc',
            name: 'Theory of Computation',
            topics: ['Regular Expressions & Finite Automata (DFA/NFA)', 'Pumping Lemma for Regular Languages', 'Context-Free Grammars & Pushdown Automata', 'Pumping Lemma for CFLs', 'Turing Machines & Decidability', 'Halting Problem & Undecidability'],
          },
          {
            id: 'cs_compiler',
            name: 'Compiler Design',
            topics: ['Lexical Analysis & Regular Expressions', 'Parsing: LL(1), LR(0), SLR(1), LALR(1), CLR(1)', 'Syntax-Directed Translation & SDD/SDT', 'Intermediate Code Generation: Three-Address Code', 'Runtime Environments & Activation Records', 'Code Optimization & Register Allocation'],
          },
          {
            id: 'cs_os',
            name: 'Operating System',
            topics: ['System Calls, Processes & Threads', 'CPU Scheduling Algorithms', 'Inter-process Communication & Synchronization', 'Semaphores & Mutex', 'Deadlocks: Detection, Prevention & Avoidance', 'Memory Management: Paging & Segmentation', 'Virtual Memory & Page Replacement (LRU, FIFO)', 'File Systems & Disk Scheduling'],
          },
          {
            id: 'cs_dbms',
            name: 'Databases (DBMS)',
            topics: ['ER-Model & Relational Model', 'Relational Algebra & Tuple Calculus', 'SQL: Queries, Joins, Aggregation & Subqueries', 'Database Normalization: 1NF, 2NF, 3NF, BCNF', 'Transaction Processing: ACID Properties', 'Concurrency Control: Two-Phase Locking (2PL)', 'Indexing: B-Trees & B+ Trees', 'File Organization'],
          },
          {
            id: 'cs_networks',
            name: 'Computer Networks',
            topics: ['OSI and TCP/IP Protocol Architectures', 'Data Link Layer: Framing, Error Control & Flow Control', 'Sliding Window Protocols: Go-Back-N & Selective Repeat', 'MAC Protocols: CSMA/CD & Ethernet', 'Network Layer: IPv4, IPv6, Subnetting & CIDR', 'Routing Algorithms: Distance Vector & Link State', 'Transport Layer: TCP, UDP, Flow & Congestion Control', 'Application Layer: DNS, SMTP, HTTP, FTP'],
          },
        ],
      },
    ],
  },

  // 2. DA - Data Science and Artificial Intelligence
  {
    code: 'DA',
    name: 'Data Science and Artificial Intelligence',
    category: 'Computer Science & AI',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/DA_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'DA_CORE',
        name: 'Data Science & AI Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'da_prob_stats',
            name: 'Probability and Statistics',
            topics: ['Random Variables & Distributions', 'Conditional Probability & Bayes Theorem', 'Joint & Marginal Distributions', 'Expectation, Variance & Moments', 'Central Limit Theorem & Law of Large Numbers', 'Hypothesis Testing & p-values', 'Confidence Intervals & Correlation'],
          },
          {
            id: 'da_lin_alg',
            name: 'Linear Algebra and Calculus',
            topics: ['Vector Spaces & Subspaces', 'Linear Independence & Basis', 'Matrices & Determinants', 'Eigenvalues & Eigenvectors', 'Singular Value Decomposition (SVD)', 'Principal Component Analysis (PCA) Math', 'Calculus: Gradients, Hessian & Optimization', 'Gradient Descent & Convex Functions'],
          },
          {
            id: 'da_prog_ds_algo',
            name: 'Programming, Data Structures and Algorithms',
            topics: ['Python Programming & Vectorized Ops', 'Data Structures: Stacks, Queues, Heaps & Trees', 'Sorting & Searching Algorithms', 'Graph Algorithms & Traversal', 'Dynamic Programming Essentials'],
          },
          {
            id: 'da_db_warehouse',
            name: 'Database Management and Warehousing',
            topics: ['ER-Modeling & Relational Schemas', 'SQL Queries, Joins & Grouping', 'Normalization & Constraints', 'Data Warehousing: Star & Snowflake Schemas', 'OLAP Operations & Indexing'],
          },
          {
            id: 'da_machine_learning',
            name: 'Machine Learning',
            topics: ['Supervised Learning: Linear & Logistic Regression', 'Decision Trees, Random Forests & Ensemble Methods', 'Support Vector Machines (SVM)', 'k-Nearest Neighbors (k-NN)', 'Unsupervised Learning: K-Means & Hierarchical Clustering', 'Dimensionality Reduction (PCA & t-SNE)', 'Neural Networks & Multi-Layer Perceptrons', 'Backpropagation & Loss Functions', 'Cross-Validation & Regularization (L1/L2)'],
          },
          {
            id: 'da_ai',
            name: 'Artificial Intelligence',
            topics: ['Search: BFS, DFS, A* and Heuristic Search', 'Adversarial Search & Minimax with Alpha-Beta', 'Propositional Logic & First-Order Logic', 'Knowledge Representation & Reasoning', 'Probabilistic Reasoning & Bayesian Networks', 'Markov Decision Processes (MDP) Basics'],
          },
        ],
      },
    ],
  },

  // 3. RA - Robotics and Automation (NEW Official Paper for GATE 2027)
  {
    code: 'RA',
    name: 'Robotics and Automation',
    category: 'Engineering Specialties',
    isNew: true,
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/RA_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'RA_CORE',
        name: 'Robotics & Automation Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ra_eng_math',
            name: 'Engineering Mathematics',
            topics: ['Linear Algebra: Transformations & Rotation Matrices', 'Differential Equations & State-Space Systems', 'Probability & Stochastic Estimation', 'Numerical Methods & Optimization'],
          },
          {
            id: 'ra_kinematics_dynamics',
            name: 'Robot Kinematics and Dynamics',
            topics: ['Coordinate Frames & Homogeneous Transformations', 'Denavit-Hartenberg (DH) Parameters', 'Forward and Inverse Kinematics', 'Jacobians, Singularities & Statics', 'Euler-Lagrange & Newton-Euler Dynamics', 'Trajectory Generation & Path Planning'],
          },
          {
            id: 'ra_control_systems',
            name: 'Robot Control Systems',
            topics: ['Feedback Control: P, PI, PID Control', 'State-Space Modeling & Feedback', 'Trajectory Tracking & Computed Torque Control', 'Impedance & Force Control', 'Nonlinear Control Fundamentals'],
          },
          {
            id: 'ra_sensors_actuators',
            name: 'Sensors, Vision and Actuators',
            topics: ['Encoders, IMU, LiDAR & Ultrasonic Sensors', 'Actuators: DC Motors, BLDC, Steppers & Servo Systems', 'Robot Vision: Camera Calibration & Epipolar Geometry', 'Object Detection & Pose Estimation', 'Sensor Fusion & Kalman Filtering (EKF, UKF)'],
          },
          {
            id: 'ra_navigation_autonomy',
            name: 'Autonomous Navigation and AI in Robotics',
            topics: ['Simultaneous Localization and Mapping (SLAM)', 'Occupancy Grid Mapping', 'A*, Dijkstra & Rapidly-exploring Random Trees (RRT)', 'Obstacle Avoidance & Potential Field Methods', 'Reinforcement Learning & ROS/ROS2 Ecosystem'],
          },
          {
            id: 'ra_industrial_automation',
            name: 'Industrial Automation and PLCs',
            topics: ['Programmable Logic Controllers (PLCs) & Ladder Logic', 'SCADA & Distributed Control Systems (DCS)', 'Industrial Communication Protocols (Modbus, CAN, Profibus)', 'Pneumatic and Hydraulic Automation Systems', 'Safety & Industrial Manipulator Standards'],
          },
        ],
      },
    ],
  },

  // 4. EC - Electronics and Communication Engineering
  {
    code: 'EC',
    name: 'Electronics and Communication Engineering',
    category: 'Electrical & Electronics',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/EC_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'EC_CORE',
        name: 'Electronics & Communication Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ec_eng_math',
            name: 'Engineering Mathematics',
            topics: ['Linear Algebra & Matrices', 'Calculus & Vector Analysis', 'Differential Equations', 'Complex Analysis', 'Probability & Random Variables'],
          },
          {
            id: 'ec_networks',
            name: 'Networks, Signals and Systems',
            topics: ['Network Theorems & Transient Analysis', 'Two-Port Networks & Resonance', 'Continuous-Time & Discrete-Time Signals', 'Fourier Series, Fourier Transform & Laplace Transform', 'Z-Transform & Sampling Theorem', 'LTI Systems & Convolution'],
          },
          {
            id: 'ec_devices',
            name: 'Electronic Devices',
            topics: ['Energy Bands in Semiconductors', 'Carrier Transport: Diffusion & Drift', 'PN Junction Diode & Zener Diode', 'BJT, MOS Capacitor & MOSFET Characteristics', 'Optoelectronic Devices'],
          },
          {
            id: 'ec_circuits',
            name: 'Analog and Digital Circuits',
            topics: ['Op-Amp Circuits & Applications', 'BJT and MOSFET Biasing & Small-Signal Models', 'Amplifiers: Frequency Response & Feedback', 'Oscillators & Active Filters', 'Combinational & Sequential Logic Circuits', 'Microprocessors & Microcontrollers (8085/8051)'],
          },
          {
            id: 'ec_control',
            name: 'Control Systems',
            topics: ['Transfer Functions & Block Diagram Reduction', 'Time Response Analysis: Steady-State Error', 'Routh-Hurwitz Stability Criterion', 'Root Locus Technique', 'Bode Plots & Nyquist Stability Criterion', 'State-Space Representation'],
          },
          {
            id: 'ec_comm',
            name: 'Communications',
            topics: ['Random Processes: Autocorrelation & PSD', 'Analog Communications: AM, FM, PM & Superheterodyne', 'Digital Communications: PCM, DPCM, ASK, FSK, PSK, QAM', 'Information Theory, Entropy & Channel Capacity', 'Error Control Coding: Hamming & Cyclic Codes'],
          },
          {
            id: 'ec_em',
            name: 'Electromagnetics',
            topics: ['Maxwell\'s Equations & Boundary Conditions', 'Uniform Plane Waves: Polarization & Poynting Vector', 'Transmission Lines: Impedance Matching & Smith Chart', 'Waveguides: TE/TM Modes & Cutoff Frequencies', 'Antenna Parameters: Radiation Pattern & Gain'],
          },
        ],
      },
    ],
  },

  // 5. EE - Electrical Engineering
  {
    code: 'EE',
    name: 'Electrical Engineering',
    category: 'Electrical & Electronics',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/EE_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'EE_CORE',
        name: 'Electrical Engineering Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ee_math',
            name: 'Engineering Mathematics',
            topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Complex Variables', 'Probability and Statistics'],
          },
          {
            id: 'ee_circuits',
            name: 'Electric Circuits',
            topics: ['Network Graph Theory & Theorems', 'Transient Analysis of RLC Circuits', 'Sinusoidal Steady-State Analysis', 'Three-Phase Balanced & Unbalanced Circuits', 'Two-Port Networks'],
          },
          {
            id: 'ee_fields',
            name: 'Electromagnetic Fields',
            topics: ['Coulomb\'s Law, Gauss\'s Law & Electric Potential', 'Biot-Savart Law & Ampere\'s Law', 'Faraday\'s Law & Inductance', 'Maxwell\'s Equations'],
          },
          {
            id: 'ee_machines',
            name: 'Electrical Machines',
            topics: ['Single-Phase and Three-Phase Transformers', 'DC Machines: Operating Principles & Speed Control', 'Three-Phase Induction Motors: Equivalent Circuit & Torque-Slip', 'Synchronous Machines: Salient & Non-Salient, Voltage Regulation', 'Special Electrical Machines'],
          },
          {
            id: 'ee_power_systems',
            name: 'Power Systems',
            topics: ['Power Generation Concepts & Transmission Lines', 'Line Parameters & Performance (Ferranti Effect)', 'Per-Unit Representation & Symmetrical Components', 'Fault Analysis: Symmetrical & Unsymmetrical', 'Load Flow Studies: Gauss-Seidel & Newton-Raphson', 'Power System Stability: Equal Area Criterion', 'Power System Protection & Relaying'],
          },
          {
            id: 'ee_power_electronics',
            name: 'Power Electronics',
            topics: ['Power Semiconductor Devices: Diode, Thyristor, MOSFET, IGBT', 'Phase-Controlled Rectifiers (Single & Three Phase)', 'DC-DC Converters: Buck, Boost, Buck-Boost', 'Voltage and Current Source Inverters', 'Pulse Width Modulation (PWM) Techniques'],
          },
        ],
      },
    ],
  },

  // 6. ME - Mechanical Engineering
  {
    code: 'ME',
    name: 'Mechanical Engineering',
    category: 'Mechanical & Civil',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/ME_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'ME_CORE',
        name: 'Mechanical Engineering Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'me_math',
            name: 'Engineering Mathematics',
            topics: ['Linear Algebra & Matrices', 'Calculus & Vector Calculus', 'Differential Equations', 'Complex Analysis', 'Numerical Methods'],
          },
          {
            id: 'me_mechanics_design',
            name: 'Applied Mechanics and Design',
            topics: ['Engineering Mechanics: Free-Body Diagrams & Trusses', 'Mechanics of Materials: Stress, Strain & Mohr\'s Circle', 'Shear Force and Bending Moment Diagrams', 'Torsion & Deflection of Beams', 'Theory of Machines: Kinematic Chains, Mechanisms & Flywheels', 'Vibrations: Free & Forced Single Degree of Freedom', 'Machine Design: Failure Theories, Fatigue, Shafts, Gears & Bearings'],
          },
          {
            id: 'me_thermal_fluid',
            name: 'Fluid Mechanics and Thermal Sciences',
            topics: ['Fluid Mechanics: Fluid Statics, Manometry & Buoyancy', 'Bernoulli\'s Equation & Navier-Stokes Basics', 'Laminar and Turbulent Flow in Pipes', 'Boundary Layer Theory', 'Thermodynamics: First & Second Laws, Carnot Engine', 'Entropy & Availability', 'Vapor Power & Gas Power Cycles (Rankine, Brayton, Otto, Diesel)', 'Heat Transfer: Conduction, Convection & Radiation', 'Heat Exchangers: LMTD & NTU Methods'],
          },
          {
            id: 'me_manufacturing_industrial',
            name: 'Materials, Manufacturing and Industrial Engineering',
            topics: ['Engineering Materials: Phase Diagrams & Heat Treatment', 'Casting, Forming and Joining Processes', 'Welding: Arc, Resistance & Solid State', 'Machining and Machine Tool Operations: Merchant\'s Circle', 'Metrology and Inspection: Fits, Tolerances & Limits', 'Computer Integrated Manufacturing (CIM) & CNC', 'Production Planning and Control: Forecasting & Scheduling', 'Inventory Control: EOQ Models', 'Operations Research: Linear Programming & Simplex Method'],
          },
        ],
      },
    ],
  },

  // 7. CE - Civil Engineering
  {
    code: 'CE',
    name: 'Civil Engineering',
    category: 'Mechanical & Civil',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CE_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'CE_CORE',
        name: 'Civil Engineering Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ce_math',
            name: 'Engineering Mathematics',
            topics: ['Linear Algebra', 'Calculus', 'Ordinary & Partial Differential Equations', 'Probability and Statistics', 'Numerical Methods'],
          },
          {
            id: 'ce_structural',
            name: 'Structural Engineering',
            topics: ['Engineering Mechanics: System of Forces & Trusses', 'Solid Mechanics: Bending, Shear & Torsion', 'Structural Analysis: Determinate & Indeterminate Structures', 'Influence Lines & Deflection Methods', 'Construction Materials and Management', 'Concrete Structures: Working Stress & Limit State Design', 'Steel Structures: Beams, Columns & Connections'],
          },
          {
            id: 'ce_geotechnical',
            name: 'Geotechnical Engineering',
            topics: ['Soil Mechanics: Phase Relationships & Classification', 'Permeability, Seepage & Effective Stress Principle', 'Consolidation and Compaction', 'Shear Strength: Mohr-Coulomb Criterion', 'Foundation Engineering: Earth Pressure, Slope Stability & Bearing Capacity', 'Deep Foundations: Pile Load Capacity'],
          },
          {
            id: 'ce_water_resources',
            name: 'Water Resources Engineering',
            topics: ['Fluid Mechanics: Fluid Statics, Kinematics & Dynamics', 'Open Channel Flow: Energy-Depth Relationships & Hydraulic Jump', 'Hydrology: Hydrograph Analysis & Ground Water Hydrology', 'Irrigation Engineering: Crop Water Requirements & Canal Design'],
          },
          {
            id: 'ce_environmental',
            name: 'Environmental Engineering',
            topics: ['Water Quality Parameters & Drinking Water Standards', 'Water Treatment Processes: Coagulation, Filtration & Disinfection', 'Sewage Treatment: Primary, Secondary (Activated Sludge) & Tertiary', 'Air Pollution: Pollutants, Standards & Control Devices', 'Municipal Solid Waste Management & Noise Pollution'],
          },
          {
            id: 'ce_transport_geomatics',
            name: 'Transportation and Geomatics Engineering',
            topics: ['Geometric Design of Highways: Cross-Sectional Elements, Sight Distances & Curves', 'Pavement Design: Flexible and Rigid Pavements (IRC Guidelines)', 'Traffic Engineering: Flow Parameters & Signal Design (Webster Method)', 'Surveying: Principles, Levelling, Traversing & Photogrammetry'],
          },
        ],
      },
    ],
  },

  // 8. CH - Chemical Engineering
  {
    code: 'CH',
    name: 'Chemical Engineering',
    category: 'Chemical & Bio',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CH_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'CH_CORE',
        name: 'Chemical Engineering Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ch_math',
            name: 'Engineering Mathematics',
            topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Complex Variables', 'Probability and Statistics'],
          },
          {
            id: 'ch_proc_calc_thermo',
            name: 'Process Calculations and Thermodynamics',
            topics: ['Steady and Unsteady Material & Energy Balances', 'Recycle, Bypass and Purge Calculations', 'First and Second Laws of Thermodynamics', 'Vapor-Liquid Equilibrium & Raoult\'s Law', 'Phase Equilibria and Chemical Reaction Equilibria'],
          },
          {
            id: 'ch_fluid_heat_mass',
            name: 'Transport Phenomena (Fluid, Heat, Mass)',
            topics: ['Fluid Mechanics: Navier-Stokes & Friction Factors', 'Heat Transfer: Conduction, Convection & Radiation', 'Heat Exchangers and Evaporators', 'Mass Transfer: Fick\'s Law & Diffusion Coefficients', 'Distillation: McCabe-Thiele and Ponchon-Savarit Methods', 'Absorption, Extraction and Drying Operations'],
          },
          {
            id: 'ch_cre_control',
            name: 'Reaction Engineering, Control and Plant Design',
            topics: ['Chemical Reaction Engineering: Kinetics & Ideal Reactors (CSTR, PFR)', 'Non-ideal Flow: Residence Time Distribution (RTD)', 'Process Dynamics and Control: Transfer Functions & P/PI/PID Controllers', 'Bode and Nyquist Stability Criteria', 'Plant Design and Economics: Cost Estimation & Capital Investment', 'Chemical Technology: Inorganic & Organic Process Industries'],
          },
        ],
      },
    ],
  },

  // 9. IN - Instrumentation Engineering
  {
    code: 'IN',
    name: 'Instrumentation Engineering',
    category: 'Electrical & Electronics',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/IN_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'IN_CORE',
        name: 'Instrumentation Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'in_circuits_signals',
            name: 'Circuits, Signals and Systems',
            topics: ['Kirchhoff\'s Laws & Network Theorems', 'Transient Response of Circuits', 'Fourier and Laplace Transforms', 'Z-Transform and Sampling Theorem'],
          },
          {
            id: 'in_sensors_industrial',
            name: 'Sensors and Industrial Instrumentation',
            topics: ['Resistive, Capacitive & Inductive Transducers', 'Piezoelectric, Thermocouple, RTD & Thermistor', 'Pressure, Flow and Level Measurements', 'pH, Conductivity and Viscosity Measurements'],
          },
          {
            id: 'in_control_comm',
            name: 'Control Systems and Optical Instrumentation',
            topics: ['Feedback Principles & State-Space Analysis', 'Frequency Response: Bode & Nyquist Plots', 'Optical Fiber Sensors & Lasers in Instrumentation', 'Signal Conditioning & Analog-to-Digital Converters (ADC)'],
          },
        ],
      },
    ],
  },

  // 10. BT - Biotechnology
  {
    code: 'BT',
    name: 'Biotechnology',
    category: 'Chemical & Bio',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/BT_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'BT_CORE',
        name: 'Biotechnology Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'bt_eng_math',
            name: 'Engineering Mathematics',
            topics: ['Linear Algebra & Matrices', 'Calculus & Differential Equations', 'Probability & Numerical Methods'],
          },
          {
            id: 'bt_bio_tech',
            name: 'General and Applied Biotechnology',
            topics: ['Biochemistry & Molecular Biology', 'Microbiology & Immunology', 'Recombinant DNA Technology', 'Bioprocess Engineering & Upstream Processing', 'Downstream Processing & Bioseparations', 'Bioinformatics & Computational Biology'],
          },
        ],
      },
    ],
  },

  // 11. BM - Biomedical Engineering
  {
    code: 'BM',
    name: 'Biomedical Engineering',
    category: 'Chemical & Bio',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/BM_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'BM_CORE',
        name: 'Biomedical Engineering Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'bm_core_sub',
            name: 'Biomedical Signals & Devices',
            topics: ['Bioelectric Potentials & Electrodes (ECG, EEG, EMG)', 'Biomedical Signal Processing & Filtering', 'Biomedical Imaging Systems (X-Ray, CT, MRI, Ultrasound)', 'Biomaterials & Biomechanics', 'Medical Device Safety & Physiological Modeling'],
          },
        ],
      },
    ],
  },

  // 12. AE - Aerospace Engineering
  {
    code: 'AE',
    name: 'Aerospace Engineering',
    category: 'Engineering Specialties',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/AE_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'AE_CORE',
        name: 'Aerospace Engineering Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ae_aero_propulsion',
            name: 'Aerodynamics and Propulsion',
            topics: ['Incompressible and Compressible Aerodynamics', 'Shock Waves and Expansion Fans', 'Airfoils and Wings: Lift and Drag', 'Aircraft Gas Turbine Engines & Rocket Propulsion'],
          },
          {
            id: 'ae_flight_structures',
            name: 'Flight Mechanics and Space Dynamics',
            topics: ['Aircraft Performance & Static/Dynamic Stability', 'Spacecraft Trajectories and Orbital Mechanics', 'Thin-Walled Aerospace Structures', 'Structural Dynamics & Aeroelasticity'],
          },
        ],
      },
    ],
  },

  // 13. AG - Agricultural Engineering
  {
    code: 'AG',
    name: 'Agricultural Engineering',
    category: 'Engineering Specialties',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/AG_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'AG_CORE',
        name: 'Agricultural Engineering Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ag_machinery_soil',
            name: 'Farm Machinery, Soil and Water',
            topics: ['Farm Power and Tractors', 'Farm Machinery: Tillage, Sowing and Harvesting', 'Soil and Water Conservation Engineering', 'Irrigation and Drainage Systems', 'Agricultural Processing and Storage Technology'],
          },
        ],
      },
    ],
  },

  // 14. AR - Architecture and Planning
  {
    code: 'AR',
    name: 'Architecture and Planning',
    category: 'Engineering Specialties',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/AR_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'AR_CORE',
        name: 'Architecture and Planning Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ar_design_planning',
            name: 'Architecture and Urban Planning',
            topics: ['Architecture, Planning and Design History', 'Building Construction, Services and Management', 'Urban and Regional Planning Principles', 'Environmental Planning and Sustainable Architecture', 'Housing and Infrastructure Planning'],
          },
        ],
      },
    ],
  },

  // 15. CY - Chemistry
  {
    code: 'CY',
    name: 'Chemistry',
    category: 'Sciences & Mathematics',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/XL0_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'CY_CORE',
        name: 'Chemistry Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'cy_physical',
            name: 'Physical Chemistry',
            topics: ['Quantum Mechanics and Chemical Bonding', 'Chemical Thermodynamics and Equilibria', 'Chemical Kinetics and Catalysis', 'Electrochemistry and Surface Chemistry'],
          },
          {
            id: 'cy_inorganic_organic',
            name: 'Inorganic and Organic Chemistry',
            topics: ['Main Group Elements and Coordination Chemistry', 'Organometallics and Bioinorganic Chemistry', 'Reaction Mechanisms in Organic Chemistry', 'Pericyclic Reactions and Photochemistry', 'Spectroscopy (NMR, IR, UV-Vis, Mass)'],
          },
        ],
      },
    ],
  },

  // 16. ES - Environmental Science & Engineering
  {
    code: 'ES',
    name: 'Environmental Science & Engineering',
    category: 'Engineering Specialties',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/ES_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'ES_CORE',
        name: 'Environmental Science Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'es_core_sub',
            name: 'Environmental Science & Engineering Core',
            topics: ['Environmental Principles and Ecology', 'Environmental Chemistry and Microbiology', 'Water & Wastewater Quality & Treatment', 'Air Pollution Science & Control', 'Solid & Hazardous Waste Management', 'Global Environmental Issues and Climate Change'],
          },
        ],
      },
    ],
  },

  // 17. EY - Ecology and Evolution
  {
    code: 'EY',
    name: 'Ecology and Evolution',
    category: 'Sciences & Mathematics',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/EY_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'EY_CORE',
        name: 'Ecology & Evolution Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ey_core_sub',
            name: 'Ecology, Evolution and Behaviour',
            topics: ['Population and Community Ecology', 'Evolutionary Genetics & Speciation', 'Animal Behaviour and Sociobiology', 'Applied Ecology, Conservation and Biodiversity'],
          },
        ],
      },
    ],
  },

  // 18. GE - Geomatics Engineering
  {
    code: 'GE',
    name: 'Geomatics Engineering',
    category: 'Engineering Specialties',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/GE_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'GE_PART_A',
        name: 'Part A: Common Geomatics Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ge_part_a_sub',
            name: 'Surveying, Remote Sensing & GIS',
            topics: ['Fundamentals of Surveying and Photogrammetry', 'Remote Sensing Systems and Sensors', 'Global Navigation Satellite Systems (GNSS)', 'Geographical Information System (GIS)'],
          },
        ],
      },
    ],
  },

  // 19. GG - Geology and Geophysics
  {
    code: 'GG',
    name: 'Geology and Geophysics',
    category: 'Sciences & Mathematics',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/GG_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'GG_PART_A',
        name: 'Part A: Common Earth Science Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'gg_part_a_sub',
            name: 'Earth and Planetary System',
            topics: ['Earth Structure, Composition and Plate Tectonics', 'Structural Geology and Geotectonics', 'Paleontology and Stratigraphy', 'Mineralogy and Petrology'],
          },
        ],
      },
    ],
  },

  // 20. MA - Mathematics
  {
    code: 'MA',
    name: 'Mathematics',
    category: 'Sciences & Mathematics',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/MA_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'MA_CORE',
        name: 'Pure & Applied Mathematics Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'ma_core_sub',
            name: 'Mathematical Sciences',
            topics: ['Linear Algebra and Vector Spaces', 'Real Analysis and Metric Spaces', 'Complex Analysis', 'Ordinary and Partial Differential Equations', 'Algebra: Groups, Rings and Fields', 'Functional Analysis and Topology', 'Numerical Analysis and Optimization'],
          },
        ],
      },
    ],
  },

  // 21. MN - Mining Engineering
  {
    code: 'MN',
    name: 'Mining Engineering',
    category: 'Engineering Specialties',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/MN_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'MN_CORE',
        name: 'Mining Engineering Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'mn_core_sub',
            name: 'Mining Technology and Operations',
            topics: ['Mine Development and Surveying', 'Geomechanics and Ground Control', 'Mining Methods (Underground and Surface)', 'Mine Ventilation, Safety and Environment', 'Mine Economics and Systems Engineering'],
          },
        ],
      },
    ],
  },

  // 22. MT - Metallurgical Engineering
  {
    code: 'MT',
    name: 'Metallurgical Engineering',
    category: 'Engineering Specialties',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/MT_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'MT_CORE',
        name: 'Metallurgical Engineering Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'mt_core_sub',
            name: 'Metallurgy and Materials Processing',
            topics: ['Thermodynamics and Rate Processes', 'Extractive and Chemical Metallurgy', 'Physical Metallurgy and Phase Transformations', 'Mechanical Metallurgy and Material Testing', 'Manufacturing and Joining Processes'],
          },
        ],
      },
    ],
  },

  // 23. NM - Naval Architecture and Marine Engineering
  {
    code: 'NM',
    name: 'Naval Architecture and Marine Engineering',
    category: 'Mechanical & Civil',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/NM_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'NM_CORE',
        name: 'Naval Architecture Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'nm_core_sub',
            name: 'Marine Structures and Hydrodynamics',
            topics: ['Ship Hydrostatics, Stability and Dynamics', 'Marine Hydrodynamics, Resistance and Propulsion', 'Ship Design and Construction Systems', 'Vibration of Marine Structures and Marine Machinery'],
          },
        ],
      },
    ],
  },

  // 24. PE - Petroleum Engineering
  {
    code: 'PE',
    name: 'Petroleum Engineering',
    category: 'Engineering Specialties',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/PE_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'PE_CORE',
        name: 'Petroleum Engineering Technical Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'pe_core_sub',
            name: 'Petroleum Technology and Production',
            topics: ['Petroleum Geology and Formation Evaluation', 'Drilling Engineering and Well Completion', 'Reservoir Engineering and Enhanced Oil Recovery (EOR)', 'Petroleum Production Operations', 'Offshore Drilling and Health, Safety & Environment'],
          },
        ],
      },
    ],
  },

  // 25. PH - Physics
  {
    code: 'PH',
    name: 'Physics',
    category: 'Sciences & Mathematics',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/PH_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'PH_CORE',
        name: 'Physics Core Curriculum',
        isCompulsory: true,
        subjects: [
          {
            id: 'ph_core_sub',
            name: 'Advanced Physics',
            topics: ['Mathematical Physics and Classical Mechanics', 'Electromagnetic Theory and Optics', 'Quantum Mechanics and Applications', 'Thermodynamics and Statistical Physics', 'Atomic, Molecular and Optical Physics', 'Condensed Matter Physics', 'Nuclear and Particle Physics'],
          },
        ],
      },
    ],
  },

  // 26. PI - Production and Industrial Engineering
  {
    code: 'PI',
    name: 'Production and Industrial Engineering',
    category: 'Mechanical & Civil',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/PI_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'PI_CORE',
        name: 'Production & Industrial Engineering Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'pi_core_sub',
            name: 'Manufacturing and Industrial Operations',
            topics: ['Engineering Materials and Manufacturing Processes', 'Metrology, Quality Assurance and Reliability', 'Work Study, Ergonomics and Facility Layout', 'Operations Research: Linear & Non-linear Programming', 'Supply Chain, Production Planning and Inventory Control'],
          },
        ],
      },
    ],
  },

  // 27. ST - Statistics
  {
    code: 'ST',
    name: 'Statistics',
    category: 'Sciences & Mathematics',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/ST_GATE2027_Syllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'ST_CORE',
        name: 'Statistical Sciences Core',
        isCompulsory: true,
        subjects: [
          {
            id: 'st_core_sub',
            name: 'Advanced Statistics',
            topics: ['Probability and Random Variables', 'Stochastic Processes and Markov Chains', 'Estimation Theory and Testing of Hypotheses', 'Non-parametric Tests and Regression Analysis', 'Multivariate Analysis and Sampling Theory'],
          },
        ],
      },
    ],
  },

  // 28. XE - Engineering Sciences (Revised XE0-XE9 Codes)
  {
    code: 'XE',
    name: 'Engineering Sciences',
    category: 'Interdisciplinary Sciences',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/XE_GATE2027_CombinedSyllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'XE0',
        name: 'Section A: Engineering Mathematics (Compulsory - 15 Marks)',
        isCompulsory: true,
        subjects: [
          {
            id: 'xe0_math',
            name: 'Engineering Mathematics (XE0)',
            topics: ['Linear Algebra: Matrices, Systems of Equations & Eigenvalues', 'Calculus: Multi-variable Calculus & Vector Fields', 'Ordinary Differential Equations & Laplace Transforms', 'Complex Variables & Analytic Functions', 'Probability and Statistics', 'Numerical Methods: Root Finding & Numerical Integration'],
          },
        ],
      },
      {
        code: 'XE1',
        name: 'Section B: Fluid Mechanics (Optional)',
        subjects: [
          { id: 'xe1_fluid', name: 'Fluid Mechanics', topics: ['Flow Kinematics & Conservation Equations', 'Viscous Flow in Pipes and Channels', 'Potential Flow and Boundary Layer Theory'] },
        ],
      },
      {
        code: 'XE2',
        name: 'Section C: Materials Science (Optional)',
        subjects: [
          { id: 'xe2_mat', name: 'Materials Science', topics: ['Crystallography, Imperfections and Point Defects', 'Phase Diagrams and Heat Treatment', 'Mechanical and Electrical Properties of Materials'] },
        ],
      },
      {
        code: 'XE3',
        name: 'Section D: Solid Mechanics (Optional)',
        subjects: [
          { id: 'xe3_solid', name: 'Solid Mechanics', topics: ['Stress, Strain & Equilibrium Equations', 'Energy Methods and Deflection of Structures', 'Theories of Failure and Buckling of Columns'] },
        ],
      },
      {
        code: 'XE4',
        name: 'Section E: Thermodynamics (Optional)',
        subjects: [
          { id: 'xe4_thermo', name: 'Thermodynamics', topics: ['Thermodynamic Laws, Cycles and Entropy', 'Availability and Exergy Analysis', 'Properties of Pure Substances and Mixtures'] },
        ],
      },
      {
        code: 'XE5',
        name: 'Section F: Polymer Science and Engineering (Optional)',
        subjects: [
          { id: 'xe5_poly', name: 'Polymer Science and Engineering', topics: ['Polymer Synthesis, Molecular Weight and Structure', 'Polymer Processing and Rheology', 'Degradation and Environmental Impact of Polymers'] },
        ],
      },
      {
        code: 'XE6',
        name: 'Section G: Food Technology (Optional)',
        subjects: [
          { id: 'xe6_food', name: 'Food Technology', topics: ['Food Chemistry and Nutrition', 'Food Microbiology and Thermal Processing', 'Food Engineering and Packaging'] },
        ],
      },
      {
        code: 'XE7',
        name: 'Section H: Atmospheric and Oceanic Sciences (Optional)',
        subjects: [
          { id: 'xe7_atmos', name: 'Atmospheric and Oceanic Sciences', topics: ['Atmospheric Thermodynamics and Dynamics', 'Ocean Circulation and Wave Dynamics', 'Climate Variability and Monsoon Dynamics'] },
        ],
      },
      {
        code: 'XE9',
        name: 'Section I: Textile Engineering and Fibre Science (Revised Code XE9)',
        subjects: [
          { id: 'xe9_textile', name: 'Textile Engineering & Fibre Science', topics: ['Textile Fibres: Structure and Properties', 'Yarn Manufacture, Weaving and Knitting', 'Chemical Processing of Textiles and Testing'] },
        ],
      },
    ],
  },

  // 29. XH - Humanities and Social Sciences (XH0-XH6)
  {
    code: 'XH',
    name: 'Humanities and Social Sciences',
    category: 'Humanities & Social Sciences',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/XH_GATE2027_CombinedSyllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'XH0',
        name: 'Section B1: Reasoning and Comprehension (Compulsory - 25 Marks)',
        isCompulsory: true,
        subjects: [
          {
            id: 'xh0_reasoning',
            name: 'Reasoning and Comprehension',
            topics: ['Reading Comprehension and Textual Analysis', 'Logical and Analytical Reasoning', 'Argumentation and Critical Evaluation', 'Data Analysis and Quantitative Reasoning in Social Contexts'],
          },
        ],
      },
      {
        code: 'XH1',
        name: 'Section C1: Economics',
        subjects: [{ id: 'xh1_econ', name: 'Economics', topics: ['Microeconomics', 'Macroeconomics', 'Development Economics', 'Econometrics'] }],
      },
      {
        code: 'XH2',
        name: 'Section C2: Linguistics',
        subjects: [{ id: 'xh2_ling', name: 'Linguistics', topics: ['Phonetics and Phonology', 'Morphology and Syntax', 'Semantics and Pragmatics', 'Historical Linguistics'] }],
      },
      {
        code: 'XH3',
        name: 'Section C3: Philosophy',
        subjects: [{ id: 'xh3_phil', name: 'Philosophy', topics: ['Classical Indian Philosophy', 'Western Epistemology and Metaphysics', 'Ethics and Moral Philosophy', 'Contemporary Philosophy'] }],
      },
      {
        code: 'XH4',
        name: 'Section C4: Psychology',
        subjects: [{ id: 'xh4_psych', name: 'Psychology', topics: ['Cognitive Psychology', 'Biological Bases of Behaviour', 'Social Psychology and Personality', 'Research Methodology and Statistics'] }],
      },
      {
        code: 'XH5',
        name: 'Section C5: Sociology',
        subjects: [{ id: 'xh5_socio', name: 'Sociology', topics: ['Sociological Theories', 'Indian Society and Social Change', 'Social Stratification and Mobility', 'Research Methods in Sociology'] }],
      },
      {
        code: 'XH6',
        name: 'Section C6: English',
        subjects: [{ id: 'xh6_eng', name: 'English Literature and Theory', topics: ['History of English Literature', 'Literary and Cultural Theory', 'Postcolonial Literatures', 'Rhetoric and Stylistics'] }],
      },
    ],
  },

  // 30. XL - Life Sciences (XL0-XL5)
  {
    code: 'XL',
    name: 'Life Sciences',
    category: 'Chemical & Bio',
    syllabusUrl: 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/XL_GATE2027_CombinedSyllabus.pdf',
    sections: [
      COMMON_GENERAL_APTITUDE_SECTION,
      {
        code: 'XL0',
        name: 'Section P: Chemistry (Compulsory - 25 Marks)',
        isCompulsory: true,
        subjects: [
          {
            id: 'xl0_chem',
            name: 'Chemistry for Life Sciences',
            topics: ['Atomic Structure and Chemical Bonding', 's, p, d and f Block Elements', 'Chemical Equilibria and Thermodynamics', 'Reaction Kinetics and Electrochemistry', 'Stereochemistry and Bioorganic Compounds'],
          },
        ],
      },
      {
        code: 'XL1',
        name: 'Section Q: Biochemistry',
        subjects: [{ id: 'xl1_biochem', name: 'Biochemistry', topics: ['Biomolecules: Proteins, Lipids, Carbohydrates', 'Enzyme Kinetics and Mechanism', 'Metabolism and Bioenergetics', 'Signal Transduction and Molecular Techniques'] }],
      },
      {
        code: 'XL2',
        name: 'Section R: Botany',
        subjects: [{ id: 'xl2_botany', name: 'Botany', topics: ['Plant Systematics and Anatomy', 'Plant Physiology and Biochemistry', 'Plant Breeding and Genetics', 'Plant Ecology and Economic Botany'] }],
      },
      {
        code: 'XL3',
        name: 'Section S: Microbiology',
        subjects: [{ id: 'xl3_micro', name: 'Microbiology', topics: ['Microbial Diversity and Taxonomy', 'Microbial Physiology and Growth', 'Medical and Environmental Microbiology', 'Applied Microbiology and Fermentation'] }],
      },
      {
        code: 'XL4',
        name: 'Section T: Zoology',
        subjects: [{ id: 'xl4_zoo', name: 'Zoology', topics: ['Animal Diversity and Classification', 'Comparative Anatomy and Physiology', 'Genetics and Evolutionary Biology', 'Immunology and Parasitology'] }],
      },
      {
        code: 'XL5',
        name: 'Section U: Food Technology',
        subjects: [{ id: 'xl5_food', name: 'Food Technology', topics: ['Food Chemistry and Sensory Evaluation', 'Food Microbiology and Spoilage', 'Food Processing and Preservation Techniques', 'Food Safety Standards and Quality Control'] }],
      },
    ],
  },
];

/**
  Finds paper metadata by paper code (e.g. CS, DA, RA, XE, etc.).
 */
export function getGatePaperByCode(code: string): GatePaperDef | undefined {
  const norm = (code || '').toUpperCase().trim();
  return GATE_2027_PAPERS.find(p => p.code === norm);
}

/**
  Returns flat list of all subjects across a given GATE paper.
 */
export function getAllSubjectsForPaper(paperCode: string): GateSubjectDef[] {
  const paper = getGatePaperByCode(paperCode);
  if (!paper) return [];
  const subjects: GateSubjectDef[] = [];
  for (const sec of paper.sections) {
    subjects.push(...sec.subjects);
  }
  return subjects;
}
