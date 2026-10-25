import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, Cpu, Zap, Wrench, Building2, Target, BookOpenCheck, BrainCircuit, 
  Layers, Code, Trophy, Award, Activity, Compass, Coins, Bot, Clock, 
  BookOpen, User, Settings, Shield, ArrowRight, Lock, Unlock, Pause, 
  Play, RefreshCw, Sliders, Edit, Plus, Trash2, Copy, CheckCircle2, 
  Bell, ChevronDown, ChevronUp, Star, Pin, EyeOff, Check, AlertCircle,
  Briefcase, Globe, Info, MessageSquare, ThumbsUp, Sparkles, PinOff, Users
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from 'recharts';
import { BRANCH_PACKS, normalizeBranchId } from '../../../config/assessmentPacks';

export function findMatchingBranchData<T>(
  record: Record<string, T>,
  branchInput: string | undefined | null,
  fallbackKey: string = 'Computer Science Engineering'
): T {
  if (!branchInput) return record[fallbackKey] || Object.values(record)[0];
  if (record[branchInput]) return record[branchInput];

  const lower = branchInput.toLowerCase().trim().replace(/[-_]/g, ' ');
  const matchedKey = Object.keys(record).find(k => k.toLowerCase() === lower);
  if (matchedKey) return record[matchedKey];

  if (lower.includes('electr') && !lower.includes('electronics') && !lower.includes('comm') && !lower.includes('tele')) {
    const eeKey = Object.keys(record).find(k => k.toLowerCase().includes('electrical'));
    if (eeKey) return record[eeKey];
  }
  if (lower.includes('electronic') || lower.includes('comm') || lower.includes('ece') || lower.includes('ec')) {
    const eceKey = Object.keys(record).find(k => k.toLowerCase().includes('electronic'));
    if (eceKey) return record[eceKey];
  }
  if (lower.includes('mech') || lower.includes('automobile') || lower.includes('auto') || lower.includes('aero') || lower.includes('prod')) {
    const meKey = Object.keys(record).find(k => k.toLowerCase().includes('mechanical') || k.toLowerCase().includes('auto'));
    if (meKey) return record[meKey];
  }
  if (lower.includes('civil') || lower.includes('struct') || lower.includes('env')) {
    const ceKey = Object.keys(record).find(k => k.toLowerCase().includes('civil'));
    if (ceKey) return record[ceKey];
  }
  if (lower.includes('chem')) {
    const chemKey = Object.keys(record).find(k => k.toLowerCase().includes('chemical'));
    if (chemKey) return record[chemKey];
  }
  if (lower.includes('it') || lower.includes('information')) {
    const itKey = Object.keys(record).find(k => k.toLowerCase().includes('information') || k.toLowerCase().includes('it'));
    if (itKey) return record[itKey];
  }
  if (lower.includes('comp') || lower.includes('cse') || lower.includes('soft') || lower.includes('code')) {
    const csKey = Object.keys(record).find(k => k.toLowerCase().includes('computer'));
    if (csKey) return record[csKey];
  }

  return record[fallbackKey] || Object.values(record)[0];
}

// --- DATA STRUCTURES FOR ADAPTATION ---

// 1. Branch Challenge Data (15+ Branches)
export const BRANCH_CHALLENGES: Record<string, {
  title: string;
  problem: string;
  type: string;
  options?: string[];
  correctIndex?: number;
  inputPlaceholder?: string;
  expectedInput?: string;
  rewardXp: number;
  rewardCoins: number;
  explanation: string;
}> = {
  'Computer Science Engineering': {
    title: 'Floyd\'s Cycle Detection',
    problem: 'What is the space complexity of Floyd\'s Cycle Detection algorithm (Tortoise and Hare) for loop detection in a linked list?',
    type: 'mcq',
    options: ['O(N)', 'O(1)', 'O(log N)', 'O(N log N)'],
    correctIndex: 1,
    rewardXp: 150,
    rewardCoins: 25,
    explanation: 'Floyd\'s cycle detection algorithm uses two pointers (slow and fast) moving at different speeds. Since it only requires two pointer variables, the auxiliary space complexity is O(1).'
  },
  'Information Technology': {
    title: 'CORS Preflight Debugging',
    problem: 'Which HTTP method is used by the browser to send a CORS preflight request to verify server permissions?',
    type: 'mcq',
    options: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    correctIndex: 2,
    rewardXp: 120,
    rewardCoins: 20,
    explanation: 'Browsers automatically send an HTTP OPTIONS request as a preflight check before making cross-origin requests that could affect server state.'
  },
  'Electrical Engineering': {
    title: 'Series RLC Resonance',
    problem: 'Calculate the resonant frequency (Hz) for a series RLC circuit with L = 10mH and C = 10uF (Use 2 decimal places).',
    type: 'input',
    inputPlaceholder: 'e.g. 503.29',
    expectedInput: '503.29',
    rewardXp: 140,
    rewardCoins: 25,
    explanation: 'The resonant frequency is fr = 1 / (2 * pi * sqrt(L * C)). Substituting L = 0.01 H and C = 0.00001 F yields fr ≈ 503.29 Hz.'
  },
  'Electronics & Communication': {
    title: 'K-Map Minimization',
    problem: 'Minimize the 3-variable Boolean function F(A, B, C) = Σm(1, 3, 5, 7). What is the simplified expression?',
    type: 'mcq',
    options: ['F = A', 'F = B', 'F = C', 'F = AB'],
    correctIndex: 2,
    rewardXp: 130,
    rewardCoins: 20,
    explanation: 'The minterms translate to (A\'B\'C + A\'BC + AB\'C + ABC) = C (A\'B\' + A\'B + AB\' + AB) = C.'
  },
  'Mechanical Engineering': {
    title: 'Otto Cycle Efficiency',
    problem: 'Find the thermal efficiency of an ideal Otto cycle with compression ratio r = 8 and specific heat ratio γ = 1.4.',
    type: 'mcq',
    options: ['48.2%', '56.5%', '62.3%', '50.0%'],
    correctIndex: 1,
    rewardXp: 180,
    rewardCoins: 30,
    explanation: 'Thermal efficiency η = 1 - (1 / r^(γ - 1)). For r = 8 and γ = 1.4: η = 1 - (1 / 8^0.4) ≈ 56.47%.'
  },
  'Civil Engineering': {
    title: 'Midpoint Bending Moment',
    problem: 'Determine the maximum bending moment (in kN·m) at the center of a simply supported beam of span L = 6m with UDL w = 10 kN/m.',
    type: 'input',
    inputPlaceholder: 'e.g. 45',
    expectedInput: '45',
    rewardXp: 140,
    rewardCoins: 25,
    explanation: 'For a simply supported beam with UDL, M_max = (w * L^2) / 8. M_max = (10 * 36) / 8 = 45 kN·m.'
  },
  'Chemical Engineering': {
    title: 'Reaction Rate constant',
    problem: 'Using Arrhenius equation, if activation energy decreases, what happens to the reaction rate constant k?',
    type: 'mcq',
    options: ['k increases', 'k decreases', 'k remains unchanged', 'k fluctuates randomly'],
    correctIndex: 0,
    rewardXp: 150,
    rewardCoins: 25,
    explanation: 'Arrhenius equation k = A * exp(-Ea / (R*T)). Decreasing activation energy (Ea) increases the exponential factor, thereby increasing the rate constant k.'
  },
  'Robotics Engineering': {
    title: 'PID Control Logic',
    problem: 'Which term in a PID controller helps eliminate steady-state error in speed tracking control?',
    type: 'mcq',
    options: ['Proportional (P)', 'Integral (I)', 'Derivative (D)', 'Feedforward (F)'],
    correctIndex: 1,
    rewardXp: 160,
    rewardCoins: 25,
    explanation: 'The Integral term accumulates past errors over time, ensuring even small persistent errors are resolved, eliminating steady-state offset.'
  },
  'Artificial Intelligence': {
    title: 'Backpropagation Gradient',
    problem: 'In a neural network node, what is the derivative of the Sigmoid activation function σ(x)?',
    type: 'mcq',
    options: ['σ(x)(1 - σ(x))', 'σ(x)²', '1 - σ(x)', 'σ(x)(1 + σ(x))'],
    correctIndex: 0,
    rewardXp: 160,
    rewardCoins: 25,
    explanation: 'The derivative of Sigmoid σ(x) = 1 / (1 + e^-x) mathematically simplifies to σ(x)(1 - σ(x)), making it very efficient to compute in backpropagation.'
  },
  'Data Science': {
    title: 'Missing Feature Imputation',
    problem: 'When dataset features are missing completely at random (MCAR) and follow a highly skewed distribution, which imputation value is preferred?',
    type: 'mcq',
    options: ['Mean value', 'Median value', 'Zero', 'Row deletion'],
    correctIndex: 1,
    rewardXp: 140,
    rewardCoins: 20,
    explanation: 'For highly skewed numerical features, the median is preferred over the mean because it is robust to outliers and represents the central tendency better.'
  },
  'Automobile Engineering': {
    title: 'Gear Train Ratio',
    problem: 'A driving gear has 20 teeth and drives a driven gear with 60 teeth. What is the gear ratio (Driven / Driver)?',
    type: 'input',
    inputPlaceholder: 'e.g. 3',
    expectedInput: '3',
    rewardXp: 130,
    rewardCoins: 20,
    explanation: 'Gear ratio = N_driven / N_driver = 60 / 20 = 3.'
  },
  'Production Engineering': {
    title: 'Economic Order Quantity (EOQ)',
    problem: 'In production planning, if holding cost doubles, what happens to the Economic Order Quantity (EOQ)?',
    type: 'mcq',
    options: ['Decreases by factor of √2', 'Doubles', 'Halves', 'Increases by factor of √2'],
    correctIndex: 0,
    rewardXp: 150,
    rewardCoins: 25,
    explanation: 'EOQ = sqrt((2 * D * S) / H). If H (holding cost) doubles, the EOQ decreases by a factor of sqrt(2) (approx 30% reduction).'
  },
  'Biomedical Engineering': {
    title: 'ECG Amplifier Gain',
    problem: 'What is the primary function of the Instrumentation Amplifier in an ECG acquisition circuit?',
    type: 'mcq',
    options: ['High input impedance and high CMRR', 'Low pass filtering only', 'Digital analog conversion', 'Active power generation'],
    correctIndex: 0,
    rewardXp: 160,
    rewardCoins: 30,
    explanation: 'Instrumentation amplifiers offer extremely high input impedance to avoid loading biopotential electrodes, and high Common Mode Rejection Ratio (CMRR) to eliminate 50/60 Hz power line noise.'
  },
  'Aerospace Engineering': {
    title: 'Lift Coefficient Calculation',
    problem: 'If the angle of attack of an airfoil increases past the stall angle, what happens to the lift coefficient Cl?',
    type: 'mcq',
    options: ['Cl drops sharply', 'Cl increases linearly', 'Cl remains constant', 'Cl becomes negative instantly'],
    correctIndex: 0,
    rewardXp: 170,
    rewardCoins: 30,
    explanation: 'Past the stall angle, flow separation occurs on the upper surface of the airfoil, causing a sudden and sharp drop in lift coefficient (Cl) and a massive increase in drag.'
  },
  'Electronics Engineering': {
    title: 'Resistor Thermal Noise',
    problem: 'Thermal noise power in a resistor depends directly on temperature and which other factor?',
    type: 'mcq',
    options: ['Bandwidth', 'Resistance value', 'Voltage applied', 'Current flowing'],
    correctIndex: 0,
    rewardXp: 140,
    rewardCoins: 20,
    explanation: 'Thermal noise power is P = k * T * B, where B is the bandwidth. It is independent of the resistance value itself, which only affects noise voltage (V² = 4kTRB).'
  }
};

// 2. Career Roadmap Milestones by Branch
export const BRANCH_ROADMAPS: Record<string, Array<{ stage: string; title: string; desc: string; skills: string[] }>> = {
  'Computer Science Engineering': [
    { stage: 'Sem 1-2', title: 'Foundations & C Coding', desc: 'Master procedural logic, basic discrete mathematics, and algorithms.', skills: ['C programming', 'Flowcharts', 'Calculus'] },
    { stage: 'Sem 3-4', title: 'Data Structures & DBMS', desc: 'Core computer science fundamentals, indexing, and memory allocation.', skills: ['DSA', 'SQL', 'OS concepts'] },
    { stage: 'Sem 5-6', title: 'Software Engineering & Networks', desc: 'Design patterns, computer networks, and dynamic web apps.', skills: ['TCP/IP', 'React/Node', 'System Design'] },
    { stage: 'Sem 7-8', title: 'Cloud & AI Specialization', desc: 'Deploying scalable microservices and implementing ML pipelines.', skills: ['Docker', 'AWS', 'TensorFlow'] }
  ],
  'Electrical Engineering': [
    { stage: 'Sem 1-2', title: 'Network Analysis', desc: 'AC/DC circuits, mesh/nodal analysis, and electromagnetism.', skills: ['Kirchhoff Laws', 'Phasors', 'MATLAB'] },
    { stage: 'Sem 3-4', title: 'Electrical Machines', desc: 'Transformers, induction motors, and synchronous generators.', skills: ['AC Machines', 'DC Motors', 'Magnetic Circuits'] },
    { stage: 'Sem 5-6', title: 'Control Systems & Power Systems', desc: 'Stability analysis, fault analysis, and switchgears.', skills: ['Bode Plots', 'Relays', 'Power Grid'] },
    { stage: 'Sem 7-8', title: 'Smart Grid & Automation', desc: 'SCADA, PLC programming, and solar/wind power integration.', skills: ['PLC/SCADA', 'Inverters', 'Renewable Energy'] }
  ],
  'Mechanical Engineering': [
    { stage: 'Sem 1-2', title: 'Engineering Graphics', desc: 'Fundamentals of orthographic projection, drafting, and 3D shapes.', skills: ['AutoCAD', 'SolidModeling', 'Vectors'] },
    { stage: 'Sem 3-4', title: 'Thermodynamics & Strength of Materials', desc: 'Heat cycles, stress-strain behavior, and beam deflection.', skills: ['SFD/BMD', 'Otto Cycle', 'Rankine Cycle'] },
    { stage: 'Sem 5-6', title: 'Kinematics & Fluid Machines', desc: 'Gear train design, Bernoulli applications, and pumps.', skills: ['Gear Design', 'Turbines', 'CFD Basics'] },
    { stage: 'Sem 7-8', title: 'CIM & Manufacturing Automation', desc: 'CNC programming, robotics, and industrial automation.', skills: ['CNC G-Code', 'CAD/CAM', 'Industry 4.0'] }
  ],
  'Civil Engineering': [
    { stage: 'Sem 1-2', title: 'Basic Surveying', desc: 'Leveling, coordinates, tape, and electronic measurement tools.', skills: ['Theodolite', 'Levelling', 'Contours'] },
    { stage: 'Sem 3-4', title: 'Geotechnical & Solid Mechanics', desc: 'Soil properties, shear stress, and structural bending moments.', skills: ['Soil Mechanics', 'Concrete Testing', 'BMD'] },
    { stage: 'Sem 5-6', title: 'RCC & Highway Design', desc: 'Designing concrete slabs, column reinforcement, and pavements.', skills: ['RCC Code IS456', 'Pavement Tech', 'STAAD Pro'] },
    { stage: 'Sem 7-8', title: 'Steel Structures & Town Planning', desc: 'Designing steel girders, urban mapping, and estimation.', skills: ['Steel Design', 'Quantity Survey', 'GIS'] }
  ],
  'Electronics & Communication': [
    { stage: 'Sem 1-2', title: 'Basic Electronics', desc: 'Diodes, semiconductor physics, and active analog filters.', skills: ['Op-Amps', 'Multisim', 'Soldering'] },
    { stage: 'Sem 3-4', title: 'Digital Logic & Microcontrollers', desc: 'Logic gates, registers, assembly coding, and microcontrollers.', skills: ['Verilog', '8051/ARM', 'K-Maps'] },
    { stage: 'Sem 5-6', title: 'DSP & Digital Communication', desc: 'Frequency domain analysis, Fourier transforms, and modulation.', skills: ['MATLAB', 'PCM/QAM', 'Filter Design'] },
    { stage: 'Sem 7-8', title: 'Embedded RTOS & VLSI', desc: 'Real-time operating systems, chip design, and FPGA layout.', skills: ['Embedded C', 'FPGA', 'CMOS Design'] }
  ]
};

// 3. News Feed by Branch
export const BRANCH_NEWS: Record<string, Array<{ source: string; title: string; age: string }>> = {
  'Computer Science Engineering': [
    { source: 'IEEE Spectrum', title: 'V8 Engine releases new WebAssembly compiler enhancing JS runtime by 20%', age: '2 hours ago' },
    { source: 'TechCrunch', title: 'Llama 4 models achieve near-human coding capability on benchmarks', age: '1 day ago' }
  ],
  'Electrical Engineering': [
    { source: 'Power Grid Journal', title: 'High-Voltage DC (HVDC) transmission lines show record efficiency in offshore wind integration', age: '5 hours ago' },
    { source: 'IEEE Power', title: 'Solid-state transformers set to replace traditional electromagnetic grid equipment', age: '2 days ago' }
  ],
  'Mechanical Engineering': [
    { source: 'CAD Industry Review', title: 'Generative AI integrations in CAD software reduce component weight optimization cycles by 40%', age: '4 hours ago' },
    { source: 'Manufacturer Today', title: 'Additive metal manufacturing reaches sub-micron tolerances for aerospace applications', age: '1 day ago' }
  ],
  'Civil Engineering': [
    { source: 'ASCE News', title: 'Self-healing concrete using bacterial spores clears long-term durability tests in bridges', age: '8 hours ago' },
    { source: 'Structure Mag', title: 'Precast modular sky-rise construction cuts carbon footprint by 35% in dense urban zones', age: '2 days ago' }
  ],
  'Electronics & Communication': [
    { source: 'SemiWiki', title: '2nm gate-all-around (GAA) silicon transistors enter high-volume commercial production trial', age: '3 hours ago' },
    { source: 'Telecom Horizon', title: 'OpenRAN implementations successfully tested for low-latency private 5G factory automation', age: '12 hours ago' }
  ]
};

// --- CORE EXPORTED WIDGETS ---

// Utility component to wrap each widget in a card with actions
export function WidgetCard({ 
  id, 
  title, 
  icon: Icon, 
  description,
  isPinned,
  isCollapsed,
  onTogglePin,
  onToggleCollapse,
  onHide,
  onMoveUp,
  onMoveDown,
  children 
}: {
  id: string;
  title: string;
  icon: any;
  description?: string;
  isPinned: boolean;
  isCollapsed: boolean;
  onTogglePin: () => void;
  onToggleCollapse: () => void;
  onHide: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div id={`widget-${id}`} className="bg-white dark:bg-slate-900 border border-[#EBE7DF] dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all duration-200 text-left flex flex-col justify-between">
      {/* Widget Header */}
      <div className="flex items-start justify-between gap-2 border-b border-[#F5F2EB] dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-[#F97316] dark:text-orange-500 flex items-center justify-center shrink-0">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{title}</h4>
            {description && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate mt-0.5">{description}</span>}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400 dark:text-slate-500">
          {onMoveUp && (
            <button onClick={onMoveUp} title="Move Up" className="p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer border-none bg-transparent">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button onClick={onMoveDown} title="Move Down" className="p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer border-none bg-transparent">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onTogglePin} title={isPinned ? "Unpin Widget" : "Pin Widget"} className={`p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer border-none bg-transparent ${isPinned ? 'text-[#F97316] dark:text-orange-500' : 'hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onToggleCollapse} title={isCollapsed ? "Expand" : "Collapse"} className="p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer border-none bg-transparent">
            {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onHide} title="Hide Widget" className="p-1 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md cursor-pointer border-none bg-transparent">
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Widget Body */}
      <div className={`transition-all duration-205 ${isCollapsed ? 'hidden h-0 overflow-hidden' : 'block'}`}>
        {children}
      </div>
    </div>
  );
}

// 1. Welcome Card
export function WelcomeCard({
  name,
  branch,
  semester,
  college,
  university,
  level,
  xp,
  streak,
  onEditProfile
}: {
  name: string;
  branch: string;
  semester: number;
  college: string;
  university: string;
  level: number;
  xp: number;
  streak: number;
  onEditProfile: () => void;
}) {
  const xpInCurrentLevel = xp % 1000;
  const xpNeededForNext = 1000 - xpInCurrentLevel;
  const progressPercent = (xpInCurrentLevel / 1000) * 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {/* Avatar Placeholder */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center border-2 border-orange-500/20 text-orange-600 dark:text-orange-500 font-bold text-xl uppercase">
            {name.substring(0, 2)}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-orange-600 dark:bg-orange-500 text-white rounded-lg px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider font-mono flex items-center gap-0.5 shadow-sm">
            <Flame className="w-2.5 h-2.5 fill-current" /> {streak}d
          </div>
        </div>

        <div className="min-w-0 text-left flex-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{name}</h3>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium space-y-0.5 mt-1">
            <p className="truncate"><span className="text-[#F97316] dark:text-orange-500 font-bold">Branch:</span> {branch}</p>
            <p className="truncate"><span className="text-[#F97316] dark:text-orange-500 font-bold">Academic:</span> Sem {semester} · {college}</p>
            <p className="truncate text-slate-400 dark:text-slate-500">{university}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#FAF9F5] dark:bg-slate-900 rounded-2xl p-3 border border-[#EBE7DF]/40 dark:border-slate-800">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[10px] font-bold text-[#F97316] dark:text-orange-500">Level {level} Engineer</span>
          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 font-semibold">{xpInCurrentLevel}/1000 XP ({xpNeededForNext} to Lvl {level + 1})</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-orange-600 dark:bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <button onClick={onEditProfile} className="w-full py-2 border border-[#EBE7DF] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold transition-colors cursor-pointer bg-transparent">
        Edit Academic Profile
      </button>
    </div>
  );
}

// 2. Today's Mission
export function TodaysMission({
  userStats,
  setUserStats,
  addToast,
  careerGoal
}: {
  userStats: any;
  setUserStats: React.Dispatch<React.SetStateAction<any>>;
  addToast: (msg: string) => void;
  careerGoal: string;
}) {
  const [missions, setMissions] = useState([
    { id: 'm1', text: 'Solve Daily Branch Challenge', completed: false, xp: 20, coins: 5 },
    { id: 'm2', text: 'Complete 1 Quiz / Practice Sets', completed: false, xp: 15, coins: 5 },
    { id: 'm3', text: 'Read Notes for next Semester Unit', completed: false, xp: 10, coins: 2 },
    { id: 'm4', text: 'Review 1 Campus Project Codebase', completed: false, xp: 10, coins: 2 },
    { id: 'm5', text: 'Practice 1 GATE/Aptitude PYQ', completed: false, xp: 15, coins: 5 }
  ]);

  // Adjust mission text slightly based on career goal
  const adaptiveMissions = useMemo(() => {
    return missions.map(m => {
      if (m.id === 'm5') {
        if (careerGoal === 'GATE') return { ...m, text: 'Solve 2 GATE PYQ problems on Linear Algebra' };
        if (careerGoal === 'Placement') return { ...m, text: 'Review interview questions on Resume skills' };
        if (careerGoal === 'Research') return { ...m, text: 'Read an IEEE paper related to your major' };
        if (careerGoal === 'Entrepreneurship') return { ...m, text: 'Outline marketing roadmap for project' };
      }
      return m;
    });
  }, [missions, careerGoal]);

  const toggleMission = (id: string) => {
    setMissions(prev => prev.map(m => {
      if (m.id === id) {
        const nextState = !m.completed;
        if (nextState) {
          setUserStats((s: any) => ({ ...s, xp: s.xp + m.xp, coins: s.coins + m.coins }));
          addToast(`Mission Completed: +${m.xp} XP & +${m.coins} Coins! 🎯`);
        } else {
          setUserStats((s: any) => ({ ...s, xp: Math.max(0, s.xp - m.xp), coins: Math.max(0, s.coins - m.coins) }));
        }
        return { ...m, completed: nextState };
      }
      return m;
    }));
  };

  const completedCount = adaptiveMissions.filter(m => m.completed).length;
  const progressPercent = (completedCount / adaptiveMissions.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">DAILY CHECKLIST</span>
        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-500 font-mono">{completedCount}/{adaptiveMissions.length} Complete ({Math.round(progressPercent)}%)</span>
      </div>

      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-orange-600 dark:bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="space-y-2">
        {adaptiveMissions.map(m => (
          <label key={m.id} className="flex items-start gap-2.5 p-2 bg-slate-50 dark:bg-slate-900 hover:bg-orange-50/20 dark:hover:bg-orange-950/5 rounded-xl border border-transparent hover:border-orange-500/10 cursor-pointer transition-all">
            <input 
              type="checkbox" 
              checked={m.completed} 
              onChange={() => toggleMission(m.id)}
              className="mt-0.5 rounded text-orange-600 dark:text-orange-500 focus:ring-orange-500 accent-orange-600"
            />
            <div className="text-left flex-1 min-w-0">
              <p className={`text-xs font-semibold ${m.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                {m.text}
              </p>
              <div className="flex gap-2 mt-0.5 text-[8.5px] font-mono text-[#F97316] dark:text-orange-500 font-bold">
                <span>+{m.xp} XP</span>
                <span>+{m.coins} Coins</span>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// 3. Continue Learning
export function ContinueLearning({
  semester,
  branch,
  onContinue
}: {
  semester: number;
  branch?: string;
  onContinue: () => void;
}) {
  const subjectList = useMemo(() => {
    const branchKey = normalizeBranchId(branch);
    const pack = BRANCH_PACKS[branchKey] || BRANCH_PACKS['cse'];
    const sem = Number(semester) || 3;
    const coreSubs = pack.coreSubjects[sem] || pack.coreSubjects[3] || ['Core Engineering'];
    
    return [
      {
        name: coreSubs[0] || 'Core Engineering Subject',
        progress: 65,
        code: `31${sem}0701`,
        unit: 'Unit 2: Core Analysis & Practice'
      },
      {
        name: coreSubs[1] || coreSubs[0] || 'Advanced Engineering Subject',
        progress: 42,
        code: `31${sem}0702`,
        unit: 'Unit 1: Fundamentals & Concepts'
      }
    ];
  }, [semester, branch]);

  return (
    <div className="space-y-3">
      {subjectList.map((sub, i) => (
        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-[#FAF9F5] dark:border-slate-800">
          <div className="min-w-0 flex-1 text-left mr-2">
            <label onClick={onContinue} className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase cursor-pointer">
              {sub.code}
            </label>
            <h5 className="text-xs font-bold text-slate-800 dark:text-white truncate">{sub.name}</h5>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{sub.unit}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full flex-1 max-w-[120px] overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${sub.progress}%` }} />
              </div>
              <span className="text-[9px] font-bold font-mono text-emerald-500">{sub.progress}%</span>
            </div>
          </div>
          <button 
            onClick={onContinue}
            className="px-3.5 py-1.5 bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 text-white rounded-xl text-[10px] font-bold shadow-xs cursor-pointer border-none"
          >
            Resume
          </button>
        </div>
      ))}
    </div>
  );
}

// 4. AI Mentor Widget
export function AIMentorWidget({
  branch,
  careerGoal,
  onNavigateToMentor
}: {
  branch: string;
  careerGoal: string;
  onNavigateToMentor: () => void;
}) {
  const recommendations = useMemo(() => {
    const b = (branch || '').toLowerCase();
    let strengths = 'Circuit Laws, DC Machines';
    let weakTopics = 'Power system protection relays, AC machines';
    let quiz = 'RLC resonance calculation quiz';
    let notes = 'Synchronous Machine characteristics';
    let challenge = 'Analyze unbalanced 3-phase load';
    let tip = 'Try simulating transformer loads in MATLAB to back your resume projects.';

    if (b.includes('electr') && !b.includes('electronics') && !b.includes('comm')) {
      strengths = 'Circuit Laws, DC Machines & Phasors';
      weakTopics = 'Power system protection relays, Symmetrical components';
      quiz = 'RLC resonance calculation quiz';
      notes = 'Synchronous Machine characteristics';
      challenge = 'Analyze unbalanced 3-phase load';
      tip = careerGoal === 'GATE' ? 'Focus on electromagnetic field theory & transient circuit analysis.' : 'Try simulating transformer loads in MATLAB/Simulink for core engineering placements.';
    } else if (b.includes('electronic') || b.includes('comm') || b.includes('ece') || b.includes('ec')) {
      strengths = 'Digital Logic, Semiconductor Physics';
      weakTopics = 'DSP Z-Transforms, Transmission Lines';
      quiz = 'K-Map & Minterm Simplification Test';
      notes = 'Op-Amp Inverting & Non-inverting Notes';
      challenge = 'Design 4-bit synchronous counter';
      tip = careerGoal === 'GATE' ? 'Strengthen signals & systems convolution integral formulas.' : 'Build embedded C or Verilog HDL projects on FPGA for core VLSI roles.';
    } else if (b.includes('mech') || b.includes('auto')) {
      strengths = 'AutoCAD drafting, Thermodynamics laws';
      weakTopics = 'Shear force diagrams, Fluid turbine velocity triangles';
      quiz = 'Otto cycle efficiency quiz';
      notes = 'Bending Stresses in beams notes';
      challenge = 'Spur gear force vector analysis';
      tip = 'Get certified in SolidWorks or ANSYS. Structural simulations are highly valued by recruiters.';
    } else if (b.includes('civil') || b.includes('struct')) {
      strengths = 'Surveying & Levelling, Concrete Technology';
      weakTopics = 'Indeterminate Structures, Soil Shear Strength';
      quiz = 'Simply supported beam BMD quiz';
      notes = 'IS 456 RCC Design Formulas';
      challenge = 'Calculate active earth pressure for retaining wall';
      tip = 'Learn STAAD.Pro and AutoCAD for structural engineering internships.';
    } else if (b.includes('comp') || b.includes('it') || b.includes('cse') || b.includes('soft')) {
      strengths = 'OOPs Concepts, Database Schemas';
      weakTopics = 'Graph algorithms, SQL Join optimizations';
      quiz = 'DBMS Normalization Mock';
      notes = 'AVL Trees Balancing Notes';
      challenge = 'Floyd Warshall Implementation';
      if (careerGoal === 'Placement') {
        tip = 'Practice LeetCode mediums daily. Focus heavily on Trees and DBMS indexes for software roles.';
      } else if (careerGoal === 'GATE') {
        tip = 'Strengthen theory of computation proofs and cache memory mapping algorithms.';
      }
    }

    return { strengths, weakTopics, quiz, notes, challenge, tip };
  }, [branch, careerGoal]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
        <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/5 border border-emerald-500/10 rounded-2xl">
          <span className="text-[8.5px] font-bold text-emerald-600 block mb-1">STRENGTHS</span>
          <p className="text-slate-800 dark:text-white font-bold">{recommendations.strengths}</p>
        </div>
        <div className="p-3 bg-red-50/40 dark:bg-red-950/5 border border-red-500/10 rounded-2xl">
          <span className="text-[8.5px] font-bold text-red-500 block mb-1">WEAK AREAS</span>
          <p className="text-slate-800 dark:text-white font-bold">{recommendations.weakTopics}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs font-semibold">
        <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
          <div>
            <span className="text-[8px] text-slate-400 font-bold uppercase">REC. PRACTICE</span>
            <p className="text-slate-700 dark:text-slate-200 font-bold">{recommendations.challenge}</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-orange-500" />
        </div>
        <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
          <div>
            <span className="text-[8px] text-slate-400 font-bold uppercase">REC. STUDY</span>
            <p className="text-slate-700 dark:text-slate-200 font-bold">{recommendations.notes}</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-orange-500" />
        </div>
      </div>

      <div className="p-3.5 bg-orange-50/30 dark:bg-orange-950/5 border border-orange-500/10 rounded-2xl relative overflow-hidden">
        <div className="flex items-center gap-1.5 mb-1.5 text-[#F97316] dark:text-orange-500">
          <Bot className="h-4 w-4 shrink-0" />
          <span className="text-[9.5px] font-extrabold uppercase tracking-wider">AI Career Tip</span>
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">"{recommendations.tip}"</p>
      </div>

      <button onClick={onNavigateToMentor} className="w-full py-2 bg-[#171A1F] hover:bg-slate-800 dark:bg-orange-500 dark:hover:bg-orange-700 text-white rounded-xl text-[10px] font-bold transition-colors cursor-pointer border-none">
        Open Chat with AI Mentor
      </button>
    </div>
  );
}

// 5. Quick Stats
export function QuickStatsWidget({
  xp,
  coins,
  streak,
  quizzesCompleted,
  weeklyRank = 1,
  totalStudents = 1,
  accuracy = 0,
  projectsApproved = 0,
  certificatesCount = 0
}: {
  xp: number;
  coins: number;
  streak: number;
  quizzesCompleted: number;
  weeklyRank?: string | number;
  totalStudents?: number;
  accuracy?: number;
  projectsApproved?: number;
  certificatesCount?: number;
}) {
  const stats = [
    { title: 'Total XP', value: xp, desc: 'Accumulated score', icon: Award },
    { title: 'Weekly Rank', value: `#${weeklyRank}`, desc: `Out of ${totalStudents.toLocaleString()} student${totalStudents === 1 ? '' : 's'}`, icon: Trophy },
    { title: 'Campus Coins', value: coins, desc: 'Shop credit', icon: Coins },
    { title: 'Average Accuracy', value: accuracy > 0 ? `${accuracy}%` : 'N/A', desc: 'Based on quizzes', icon: Activity },
    { title: 'Study Hours', value: `${(quizzesCompleted * 0.5 + streak * 0.2).toFixed(1)}h`, desc: 'Focus sessions logged', icon: Clock },
    { title: 'Problems Solved', value: (quizzesCompleted * 5).toString(), desc: 'Questions attempted', icon: BookOpenCheck },
    { title: 'Quizzes Completed', value: quizzesCompleted, desc: 'Assessments submitted', icon: Layers },
    { title: 'Projects Approved', value: projectsApproved.toString(), desc: 'Verified by Faculty', icon: Code },
    { title: 'Certificates Uploaded', value: certificatesCount.toString(), desc: 'In portfolio', icon: Shield }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex flex-col justify-between text-left">
            <div className="flex justify-between items-start gap-1 mb-2">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{s.title}</span>
              <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </div>
            <div>
              <div className="text-base font-black font-mono text-slate-800 dark:text-white">{s.value}</div>
              <p className="text-[8.5px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{s.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 6. 100 Days Track
export function HundredDaysTrack({
  day,
  todayTask,
  onNavigate
}: {
  day: number;
  todayTask: string;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[8.5px] font-bold text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full uppercase font-mono">Day {day} of 100</span>
          <h5 className="text-xs font-bold text-slate-800 dark:text-white mt-1.5">100 Days of Engineering Excellence</h5>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold font-mono text-emerald-500">{day}%</div>
          <span className="text-[8.5px] text-slate-400 font-semibold block">Completed</span>
        </div>
      </div>

      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${day}%` }} />
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-[#FAF9F5] dark:border-slate-800">
        <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 block mb-1">TODAY'S TASK</span>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">{todayTask}</p>
      </div>

      <div className="flex gap-2">
        <button onClick={onNavigate} className="flex-1 py-2 bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 text-white rounded-xl text-[10px] font-bold shadow-xs cursor-pointer border-none">
          Solve Task
        </button>
        <button onClick={onNavigate} className="px-4 py-2 border border-[#EBE7DF] dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer bg-transparent">
          Manage Track
        </button>
      </div>
    </div>
  );
}

// 7. Branch Challenge
export function BranchChallengeWidget({
  branch,
  userStats,
  setUserStats,
  addToast
}: {
  branch: string;
  userStats: any;
  setUserStats: React.Dispatch<React.SetStateAction<any>>;
  addToast: (msg: string) => void;
}) {
  const challenge = useMemo(() => {
    return findMatchingBranchData(BRANCH_CHALLENGES, branch);
  }, [branch]);

  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(null);
  const [textAnswerInput, setTextAnswerInput] = useState('');
  const [solved, setSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = () => {
    if (challenge.type === 'mcq') {
      if (selectedMcqOption === null) {
        addToast('Please select an option first!');
        return;
      }
      if (selectedMcqOption === challenge.correctIndex) {
        setSolved(true);
        setUserStats((prev: any) => ({
          ...prev,
          xp: prev.xp + challenge.rewardXp,
          coins: prev.coins + challenge.rewardCoins,
          dailyChallengeDone: true
        }));
        addToast(`Correct! +${challenge.rewardXp} XP and +${challenge.rewardCoins} Coins! 🎉`);
      } else {
        setAttempts(a => a + 1);
        addToast('Incorrect answer. Review the concept and try again!');
      }
    } else {
      if (!textAnswerInput.trim()) {
        addToast('Please write your calculated answer.');
        return;
      }
      if (textAnswerInput.trim() === challenge.expectedInput) {
        setSolved(true);
        setUserStats((prev: any) => ({
          ...prev,
          xp: prev.xp + challenge.rewardXp,
          coins: prev.coins + challenge.rewardCoins,
          dailyChallengeDone: true
        }));
        addToast(`Correct! +${challenge.rewardXp} XP and +${challenge.rewardCoins} Coins! 🎉`);
      } else {
        setAttempts(a => a + 1);
        addToast('Calculated answer does not match standard model. Try again!');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-orange-50/30 dark:bg-orange-950/5 border border-orange-500/10 rounded-2xl p-4 text-left">
        <span className="text-[8.5px] font-bold text-orange-600 dark:text-orange-500 bg-orange-100 dark:bg-orange-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
          {challenge.title}
        </span>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2 leading-relaxed">{challenge.problem}</p>
      </div>

      {!solved ? (
        <div className="space-y-3">
          {challenge.type === 'mcq' && challenge.options ? (
            <div className="grid grid-cols-1 gap-2">
              {challenge.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedMcqOption(i)}
                  className={`w-full p-2.5 text-left text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    selectedMcqOption === i
                      ? 'border-[#F97316] bg-orange-50/30 dark:bg-orange-950/10 text-[#F97316] dark:text-orange-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="text"
              placeholder={challenge.inputPlaceholder}
              value={textAnswerInput}
              onChange={(e) => setTextAnswerInput(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white dark:text-slate-100 focus:outline-none text-xs font-medium"
            />
          )}

          <div className="flex gap-2">
            <button onClick={handleSubmit} className="flex-1 py-2.5 bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 text-white rounded-xl text-[10px] font-bold shadow-xs cursor-pointer border-none">
              Submit Solution
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/40 dark:bg-emerald-950/5 border border-emerald-500/10 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-extrabold uppercase">
            <CheckCircle2 className="h-4.5 w-4.5" /> Challenge Completed
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
            <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Explanation:</span>
            {challenge.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

// 8. Weekly Challenge
export function WeeklyChallengeWidget() {
  const tasks = [
    { text: 'Complete 5 Core Quizzes', current: 3, total: 5, xp: 100 },
    { text: 'Solve 3 Branch Challenges', current: 1, total: 3, xp: 80 },
    { text: 'Watch 2 Semester Lectures', current: 2, total: 2, xp: 50 }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">WEEKLY PROGRESS</span>
        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-500 font-mono">Ends in 3 days</span>
      </div>

      <div className="space-y-3">
        {tasks.map((t, i) => {
          const isDone = t.current >= t.total;
          return (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-[#FAF9F5] dark:border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold text-left ${isDone ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>
                  {t.text}
                </span>
                <span className="text-[10px] font-bold font-mono text-[#F97316] dark:text-orange-500 shrink-0">+{t.xp} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full flex-1 overflow-hidden">
                  <div className="h-full bg-[#F97316] rounded-full" style={{ width: `${(t.current / t.total) * 100}%` }} />
                </div>
                <span className="text-[9.5px] font-mono font-bold text-slate-500 shrink-0">{t.current}/{t.total}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3.5 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-500/10 rounded-2xl flex items-center gap-3">
        <Award className="h-8 w-8 text-[#F97316] dark:text-orange-500 shrink-0" />
        <div className="text-left min-w-0">
          <h6 className="text-xs font-extrabold text-[#F97316] dark:text-orange-500 uppercase tracking-wider">Milestone Badge Reward</h6>
          <p className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 truncate mt-0.5">Unlock: "Branch Engineer of the Week"</p>
        </div>
      </div>
    </div>
  );
}

// 9. Daily Login Reward
export function DailyLoginRewardWidget({
  claimed,
  onClaim
}: {
  claimed: boolean;
  onClaim: () => void;
}) {
  const days = [
    { day: 1, reward: '+50 XP', type: 'xp', active: true },
    { day: 2, reward: '+10 Coins', type: 'coins', active: true },
    { day: 3, reward: '+100 XP', type: 'xp', active: false },
    { day: 4, reward: '+25 Coins', type: 'coins', active: false },
    { day: 5, reward: 'Freeze', type: 'freeze', active: false },
    { day: 6, reward: '+150 XP', type: 'xp', active: false },
    { day: 7, reward: 'Premium', type: 'theme', active: false }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div 
            key={i} 
            className={`p-2 rounded-xl text-center border flex flex-col justify-between h-20 transition-all ${
              d.day === 1 && claimed
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-600'
                : d.day === 1 && !claimed
                ? 'bg-orange-50/80 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50 text-[#F97316] dark:text-orange-500 shadow-sm scale-102 font-extrabold'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="text-[8px] font-black uppercase tracking-wider font-mono">D{d.day}</span>
            <div className="my-1 flex items-center justify-center">
              {d.type === 'xp' ? <Award className="w-3.5 h-3.5 shrink-0" /> :
               d.type === 'coins' ? <Coins className="w-3.5 h-3.5 shrink-0" /> :
               d.type === 'freeze' ? <Flame className="w-3.5 h-3.5 shrink-0" /> :
               <Sparkles className="w-3.5 h-3.5 shrink-0" />}
            </div>
            <span className="text-[8.5px] font-mono font-bold truncate leading-none">{d.reward}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onClaim}
        disabled={claimed}
        className={`w-full py-2.5 rounded-xl text-[10px] font-bold shadow-xs cursor-pointer border-none transition-colors ${
          claimed
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            : 'bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 text-white'
        }`}
      >
        {claimed ? 'Claimed Today ✓' : 'Claim Day 1 Rewards (+50 XP & +10 Coins)'}
      </button>
    </div>
  );
}

// 10. Upcoming Deadlines
export function UpcomingDeadlinesWidget() {
  const deadlines = [
    { title: 'Operating Systems Assignment 3', date: 'Jul 11', type: 'Assignment', time: '11:59 PM', urgency: 'high' },
    { title: 'RLC series circuit simulation', date: 'Jul 12', type: 'Challenge', time: '5:00 PM', urgency: 'medium' },
    { title: 'Faculty Mid-semester review', date: 'Jul 15', type: 'Exam', time: '10:00 AM', urgency: 'low' }
  ];

  return (
    <div className="space-y-3">
      {deadlines.map((dl, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className={`w-1.5 h-10 rounded-full shrink-0 ${
            dl.urgency === 'high' ? 'bg-red-500' : dl.urgency === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
          }`} />

          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-baseline gap-1">
              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                dl.urgency === 'high' ? 'bg-red-50 dark:bg-red-950/20 text-red-600' :
                dl.urgency === 'medium' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500' :
                'bg-blue-50 dark:bg-blue-950/20 text-blue-600'
              }`}>
                {dl.type}
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-semibold">{dl.date} · {dl.time}</span>
            </div>
            <h6 className="text-xs font-bold text-slate-800 dark:text-white truncate mt-1">{dl.title}</h6>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniLeaderboardWidget({
  activeTab,
  onNavigate,
  users: dbUsers
}: {
  activeTab: string;
  onNavigate: () => void;
  users?: Array<{ rank: number; name: string; dept: string; xp: number; streak: number; img: string; highlight: boolean }>;
}) {
  const [selectedTab, setSelectedTab] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  
  const users = (dbUsers && dbUsers.length > 0) ? dbUsers.map(u => ({
    rank: u.rank,
    name: u.name,
    branch: u.dept || 'Engineering',
    xp: u.xp || 0,
    weeklyGain: `+${(u.streak || 0) * 10}`,
    streak: u.streak || 0,
    quizzes: u.rank * 4,
    avatar: u.img || '/images/avatar_boy.webp',
    current: u.highlight || false
  })) : [
    { rank: 1, name: 'Batch Topper', branch: 'CSE', xp: 2940, weeklyGain: '+340', streak: 28, quizzes: 42, avatar: '/images/avatar_girl.webp', badge: 'gold' },
    { rank: 2, name: 'Active Learner', branch: 'EE', xp: 2780, weeklyGain: '+290', streak: 21, quizzes: 38, avatar: '/images/avatar_boy.webp', badge: 'silver' },
    { rank: 3, name: 'You', branch: 'CSE', xp: 2450, weeklyGain: '+180', streak: 24, quizzes: 24, avatar: '/images/avatar_boy.webp', current: true, badge: 'bronze' }
  ];

  const getBadgeIcon = (rank: number, badge?: string) => {
    if (rank === 1 || badge === 'gold') return '🥇';
    if (rank === 2 || badge === 'silver') return '🥈';
    if (rank === 3 || badge === 'bronze') return '🥉';
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-500';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-4">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#FAF9F5] dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Trophy className="h-4 w-4 text-orange-500" />
            <span>Top Performers</span>
          </h3>
          <p className="text-[9px] text-slate-400 mt-0.5">Your rank: #3 in CSE</p>
        </div>
        
        {/* Time Period Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          {[
            { id: 'weekly', label: 'Week' },
            { id: 'monthly', label: 'Month' },
            { id: 'alltime', label: 'All Time' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer border-none ${
                selectedTab === tab.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium - Mobile Optimized */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src={users[1].avatar} 
              alt={users[1].name} 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-slate-300 dark:border-slate-700 shadow-md"
            />
            <span className="absolute -top-1 -right-1 text-lg">🥈</span>
          </div>
          <div className="mt-2 text-center">
            <div className="w-12 sm:w-16 h-10 sm:h-12 bg-slate-200 dark:bg-slate-800 rounded-t-lg flex items-center justify-center">
              <span className="text-base sm:text-lg font-black text-slate-600 dark:text-slate-400">2</span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-[70px]">{users[1].name.split(' ')[0]}</p>
            <p className="text-[8px] font-mono text-slate-400">{users[1].xp.toLocaleString()} XP</p>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center -mt-2">
          <div className="relative">
            <img 
              src={users[0].avatar} 
              alt={users[0].name} 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-3 border-amber-400 dark:border-amber-500 shadow-lg ring-2 ring-amber-200 dark:ring-amber-900/50"
            />
            <span className="absolute -top-1 -right-1 text-xl">🥇</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">
              Top
            </div>
          </div>
          <div className="mt-2 text-center">
            <div className="w-14 sm:w-18 h-14 sm:h-16 bg-gradient-to-b from-amber-400 to-amber-500 rounded-t-lg flex items-center justify-center shadow-lg">
              <span className="text-xl sm:text-2xl font-black text-white">1</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-white mt-1 truncate max-w-[80px]">{users[0].name.split(' ')[0]}</p>
            <p className="text-[9px] font-mono text-orange-600 dark:text-orange-500 font-bold">{users[0].xp.toLocaleString()} XP</p>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src={users[2].avatar} 
              alt={users[2].name} 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-orange-300 dark:border-orange-700 shadow-md"
            />
            <span className="absolute -top-1 -right-1 text-lg">🥉</span>
          </div>
          <div className="mt-2 text-center">
            <div className="w-12 sm:w-16 h-8 sm:h-10 bg-orange-200 dark:bg-orange-900/30 rounded-t-lg flex items-center justify-center">
              <span className="text-base sm:text-lg font-black text-orange-600 dark:text-orange-500">3</span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-[70px]">{users[2].name.split(' ')[0]}</p>
            <p className="text-[8px] font-mono text-slate-400">{users[2].xp.toLocaleString()} XP</p>
            <span className="inline-block mt-0.5 text-[7px] bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-500 px-1.5 py-0.5 rounded-full font-bold">YOU</span>
          </div>
        </div>
      </div>

      {/* Detailed List - Mobile Optimized */}
      <div className="space-y-2">
        {users.map((u, i) => (
          <div 
            key={i} 
            className={`group relative p-3 rounded-xl transition-all ${
              u.current 
                ? 'bg-gradient-to-r from-orange-50 to-orange-50/30 dark:from-orange-950/20 dark:to-orange-950/5 border-2 border-orange-200 dark:border-orange-900/50 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                u.rank <= 3 
                  ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {getBadgeIcon(u.rank) || `#${u.rank}`}
              </div>

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img 
                  src={u.avatar} 
                  alt={u.name} 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-sm"
                />
                {u.streak >= 20 && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] shadow-sm">
                    🔥
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-xs sm:text-sm font-bold truncate ${
                    u.current ? 'text-orange-600 dark:text-orange-500' : 'text-slate-800 dark:text-white'
                  }`}>
                    {u.name}
                  </p>
                  {u.current && (
                    <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase shrink-0">
                      You
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-bold">{u.branch}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {u.streak}d
                  </span>
                  <span>•</span>
                  <span className="hidden sm:inline">{u.quizzes} quizzes</span>
                </div>
              </div>

              {/* XP and Weekly Gain */}
              <div className="flex-shrink-0 text-right">
                <p className={`text-sm sm:text-base font-black font-mono ${
                  u.current ? 'text-orange-600 dark:text-orange-500' : 'text-slate-800 dark:text-white'
                }`}>
                  {u.xp.toLocaleString()}
                </p>
                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-0.5">
                  <ArrowRight className="w-2.5 h-2.5 transform rotate-[-45deg]" />
                  {u.weeklyGain}
                </p>
              </div>
            </div>

            {/* Hover Stats - Desktop Only */}
            <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-3 text-center text-[9px]">
                <div>
                  <span className="text-slate-400 block">Quizzes</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{u.quizzes}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Streak</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{u.streak} days</span>
                </div>
                <div>
                  <span className="text-slate-400 block">This Week</span>
                  <span className="font-bold text-emerald-500">{u.weeklyGain}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-[#FAF9F5] dark:border-slate-800">
        <div className="flex items-center gap-3 text-[9px] sm:text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span className="font-bold">2,847</span>
            <span className="hidden sm:inline">students</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span className="font-bold">Top 12%</span>
          </div>
        </div>
        
        <button 
          onClick={onNavigate} 
          className="w-full sm:w-auto px-4 py-2 bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 text-white rounded-xl text-[10px] font-bold shadow-xs cursor-pointer border-none transition-all flex items-center justify-center gap-1.5"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>View Full Leaderboard</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// 12. XP Progress Graph
export function XPProgressGraph() {
  const chartData = [
    { name: 'Mon', xp: 120 },
    { name: 'Tue', xp: 280 },
    { name: 'Wed', xp: 210 },
    { name: 'Thu', xp: 390 },
    { name: 'Fri', xp: 320 },
    { name: 'Sat', xp: 450 },
    { name: 'Sun', xp: 480 }
  ];

  return (
    <div className="space-y-4">
      <div className="h-44 text-xs font-semibold">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#FAF9F5" className="dark:stroke-slate-800" />
            <XAxis dataKey="name" stroke="#A4A9B2" tick={{ fontSize: 9 }} />
            <YAxis stroke="#A4A9B2" tick={{ fontSize: 9 }} />
            <ChartTooltip contentStyle={{ background: '#121417', borderColor: '#262A30', borderRadius: '12px', color: '#fff', fontSize: 10 }} />
            <Line type="monotone" dataKey="xp" stroke="#F97316" strokeWidth={2.5} dot={{ r: 4, stroke: '#F97316', strokeWidth: 1.5, fill: '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold pt-1 border-t border-[#FAF9F5] dark:border-slate-800">
        <span>Consistency: 6/7 Days Active</span>
        <span className="text-emerald-500 font-mono">↑ 22% weekly trend</span>
      </div>
    </div>
  );
}

// 13. Engineering Heatmap
export function EngineeringHeatmapWidget() {
  // Mock contribution matrix: 12 columns x 7 rows
  const levels = [0, 1, 2, 3, 2, 1, 0, 0, 1, 3, 2, 0, 1, 2, 3, 1, 0, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 0, 1, 2, 3, 2, 1, 0, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 0, 1, 2, 3];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl h-24 overflow-hidden">
        {levels.map((level, i) => {
          const color = 
            level === 0 ? 'bg-slate-200 dark:bg-slate-800' :
            level === 1 ? 'bg-orange-200 dark:bg-orange-950/30' :
            level === 2 ? 'bg-orange-400 dark:bg-orange-850/50' :
            'bg-orange-600 dark:bg-orange-500';
          return (
            <div 
              key={i} 
              className={`h-2.5 w-2.5 rounded-[2px] ${color} mx-auto`}
              title={`Level ${level} contributions`}
            />
          );
        })}
      </div>
      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
        <span>Yearly: 182 study logs</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="h-2 w-2 rounded-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-2 rounded-[1px] bg-orange-200" />
          <div className="h-2 w-2 rounded-[1px] bg-orange-400" />
          <div className="h-2 w-2 rounded-[1px] bg-orange-600 dark:bg-orange-500" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

// 14. Achievements Badges
export function AchievementsWidget() {
  const badges = [
    { title: '100 Day Learner', desc: 'Discipline Master', icon: Target, unlocked: true },
    { title: 'Circuit Master', desc: 'Active in EE/ECE', icon: Zap, unlocked: true },
    { title: 'CAD Expert', desc: 'Design Excellence', icon: Wrench, unlocked: false },
    { title: 'SQL Expert', desc: 'Database Core', icon: Layers, unlocked: true },
    { title: 'Top Performer', desc: 'Top 5% Rank', icon: Trophy, unlocked: false },
    { title: 'Quiz Champion', desc: 'Completed 10 Quizzes', icon: BookOpenCheck, unlocked: true }
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {badges.map((b, i) => (
        <div 
          key={i} 
          className={`p-2 rounded-2xl border text-center flex flex-col items-center justify-between ${
            b.unlocked 
              ? 'border-orange-100 dark:border-orange-950/20 bg-orange-50/20 dark:bg-orange-950/5' 
              : 'border-slate-100 dark:border-slate-800 opacity-40'
          }`}
        >
          <div className={`p-1.5 rounded-lg mb-1 ${b.unlocked ? 'bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
            <b.icon className="h-4.5 w-4.5" />
          </div>
          <span className="text-[9.5px] font-bold text-slate-800 dark:text-white leading-none truncate w-full">{b.title}</span>
          <span className="text-[7.5px] text-slate-400 mt-1 block truncate w-full">{b.desc}</span>
        </div>
      ))}
    </div>
  );
}

// 15. Community Activity
export function CommunityActivityWidget() {
  const activities = [
    { user: 'Rahul Patel', action: 'solved Circuit Challenge', time: '2m ago' },
    { user: 'Ayush Pandey', action: 'completed Day 36 of DSA Track', time: '10m ago' },
    { user: 'Priya Sharma', action: 'uploaded Smart Grid project', time: '1h ago' },
    { user: 'Neha Vyas', action: 'earned Gold Badge in Database', time: '2h ago' }
  ];

  return (
    <div className="space-y-3">
      {activities.map((a, i) => (
        <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
          <div className="text-left min-w-0 mr-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              <span className="font-extrabold text-[#F97316] dark:text-orange-500">{a.user}</span> {a.action}
            </p>
          </div>
          <span className="text-[9px] font-mono text-slate-400 font-semibold shrink-0">{a.time}</span>
        </div>
      ))}
    </div>
  );
}

// 16. AI Recommended Content
export function RecommendedContentWidget({
  branch,
  semester,
  onNavigate
}: {
  branch: string;
  semester: number;
  onNavigate: () => void;
}) {
  const recommendations = useMemo(() => {
    const branchKey = normalizeBranchId(branch);
    const pack = BRANCH_PACKS[branchKey] || BRANCH_PACKS['cse'];
    const sem = Number(semester) || 3;
    const coreSubs = pack.coreSubjects[sem] || pack.coreSubjects[3] || ['Core Engineering'];
    
    return [
      { type: 'Notes', title: `${coreSubs[0] || 'Subject 1'} Handwritten Notes & Key Derivations`, size: '2.4 MB' },
      { type: 'Quiz', title: `${coreSubs[1] || coreSubs[0] || 'Subject 2'} GTU High-Yield Assessment`, size: '10 questions' },
      { type: 'PYQ', title: `${coreSubs[2] || coreSubs[0] || 'Subject 3'} End-Sem Solved Papers`, size: '15 Mins' }
    ];
  }, [branch, semester]);

  return (
    <div className="space-y-3">
      {recommendations.map((rec, i) => (
        <div 
          key={i} 
          onClick={onNavigate}
          className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-[#FAF9F5] dark:border-slate-800 hover:border-orange-500/20 cursor-pointer transition-all text-left"
        >
          <div className="min-w-0 flex-1 mr-2">
            <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase ${
              rec.type === 'Notes' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
              rec.type === 'Quiz' ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400' :
              'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
            }`}>
              {rec.type}
            </span>
            <h6 className="text-xs font-bold text-slate-800 dark:text-white mt-2 truncate">{rec.title}</h6>
          </div>
          <span className="text-[9.5px] font-mono text-slate-400 font-semibold shrink-0">{rec.size}</span>
        </div>
      ))}
    </div>
  );
}

// 17. Engineering Career Roadmap
export function EngineeringCareerRoadmapWidget({
  branch,
  careerGoal
}: {
  branch: string;
  careerGoal: string;
}) {
  const milestones = useMemo(() => {
    return findMatchingBranchData(BRANCH_ROADMAPS, branch);
  }, [branch]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold text-[#F97316] dark:text-orange-500 uppercase tracking-wider font-mono">GOAL: {careerGoal}</span>
        <span className="text-[9.5px] text-slate-400 font-bold">4-Year Track</span>
      </div>

      <div className="relative pl-6 border-l border-orange-100 dark:border-slate-800 space-y-4">
        {milestones.map((m, i) => (
          <div key={i} className="relative text-left">
            <div className="absolute -left-[30px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-orange-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-[#F97316] dark:text-orange-500">{m.stage}</span>
              <h6 className="text-xs font-bold text-slate-800 dark:text-white">{m.title}</h6>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{m.desc}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {m.skills.map((s, idx) => (
                  <span key={idx} className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 18. Engineering Toolbox (Interactive calculators)
export function EngineeringToolboxWidget({
  branch
}: {
  branch: string;
}) {
  const [val1, setVal1] = useState('10');
  const [val2, setVal2] = useState('5');
  const [calcResult, setCalcResult] = useState<string>('');

  const toolConfig = useMemo(() => {
    const b = (branch || '').toLowerCase();
    if (b.includes('electr') || b.includes('electronic') || b.includes('comm')) {
      return {
        title: "Ohm's Law Calculator",
        label1: "Voltage (V)",
        label2: "Resistance (Ω)",
        resultLabel: "Current (I = V/R)",
        calculate: (v1: number, v2: number) => (v2 !== 0 ? (v1 / v2).toFixed(2) + ' A' : 'Err')
      };
    } else if (b.includes('mech') || b.includes('auto')) {
      return {
        title: "Torque Calculator",
        label1: "Power (Watts)",
        label2: "Speed (RPM)",
        resultLabel: "Torque (T = P*60 / (2*pi*N))",
        calculate: (v1: number, v2: number) => (v2 !== 0 ? ((v1 * 60) / (2 * Math.PI * v2)).toFixed(2) + ' N·m' : 'Err')
      };
    } else if (branch.includes('Civil')) {
      return {
        title: "Concrete Weight",
        label1: "Volume (m³)",
        label2: "Density (kg/m³)",
        resultLabel: "Mass (M = V * D)",
        calculate: (v1: number, v2: number) => (v1 * v2).toFixed(0) + ' kg'
      };
    } else if (branch.includes('Chemical')) {
      return {
        title: "Molarity Calculator",
        label1: "Moles of Solute",
        label2: "Volume of Solution (L)",
        resultLabel: "Molarity (M = moles / L)",
        calculate: (v1: number, v2: number) => (v2 !== 0 ? (v1 / v2).toFixed(2) + ' M' : 'Err')
      };
    }
    // Default to Base Converter for CSE / IT / AI / DS
    return {
      title: "Decimal to Binary & Hex",
      label1: "Decimal value",
      label2: "Ignore parameter",
      resultLabel: "Binary representation",
      calculate: (v1: number) => {
        try {
          const num = Math.floor(v1);
          return `${num.toString(2)} (bin) | 0x${num.toString(16).toUpperCase()} (hex)`;
        } catch {
          return 'Err';
        }
      }
    };
  }, [branch]);

  useEffect(() => {
    const v1 = parseFloat(val1);
    const v2 = parseFloat(val2);
    if (!isNaN(v1) && !isNaN(v2)) {
      setCalcResult(toolConfig.calculate(v1, v2));
    } else {
      setCalcResult('Enter numbers');
    }
  }, [val1, val2, toolConfig]);

  return (
    <div className="space-y-4">
      <div className="bg-[#FAF9F5] dark:bg-slate-900 p-3 rounded-2xl border border-transparent text-left">
        <h6 className="text-xs font-extrabold text-[#F97316] dark:text-orange-500 uppercase tracking-wider">{toolConfig.title}</h6>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">{toolConfig.label1}</label>
            <input
              type="number"
              value={val1}
              onChange={(e) => setVal1(e.target.value)}
              className="w-full p-2 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white dark:text-slate-100 text-xs font-semibold focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">{toolConfig.label2}</label>
            <input
              type="number"
              value={val2}
              onChange={(e) => setVal2(e.target.value)}
              disabled={toolConfig.label2.includes('Ignore')}
              className="w-full p-2 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white dark:text-slate-100 text-xs font-semibold focus:outline-none disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      <div className="p-3 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-500/10 rounded-2xl text-left">
        <span className="text-[8.5px] font-bold text-slate-400 uppercase">{toolConfig.resultLabel}</span>
        <div className="text-base font-black font-mono text-[#F97316] dark:text-orange-500 mt-1">{calcResult}</div>
      </div>
    </div>
  );
}

// 19. Branch Clubs
export function BranchClubsWidget() {
  const [joined, setJoined] = useState<Record<string, boolean>>({
    'c1': true,
    'c2': false,
    'c3': false
  });

  const clubs = [
    { id: 'c1', name: 'AI Research Club', members: '142 members', desc: 'Focuses on Machine learning models & datasets.' },
    { id: 'c2', name: 'Robotics & Drone Club', members: '88 members', desc: 'Design microcontrollers and quadcopter frames.' },
    { id: 'c3', name: 'L.D. CAD Specialists', members: '110 members', desc: 'Mechanical and civil design simulations.' }
  ];

  const handleToggleJoin = (id: string) => {
    setJoined(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      {clubs.map(c => (
        <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-[#FAF9F5] dark:border-slate-800">
          <div className="text-left min-w-0 flex-1 mr-3">
            <h6 className="text-xs font-bold text-slate-800 dark:text-white truncate">{c.name}</h6>
            <p className="text-[9.5px] text-slate-400 truncate mt-0.5">{c.members} · {c.desc}</p>
          </div>
          <button
            onClick={() => handleToggleJoin(c.id)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer border-none transition-colors shrink-0 ${
              joined[c.id]
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                : 'bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 text-white shadow-xs'
            }`}
          >
            {joined[c.id] ? 'Joined ✓' : 'Join Club'}
          </button>
        </div>
      ))}
    </div>
  );
}

// 20. Campus Events
export function CampusEventsWidget() {
  const events = [
    { title: 'TCS Placement Drive', date: 'Jul 16', type: 'Placement', loc: 'Main Seminar Hall' },
    { title: 'Robotics Workshop (PID logic)', date: 'Jul 19', type: 'Workshop', loc: 'Lab 4' },
    { title: 'ShikshaSahayak Hackathon 3.0', date: 'Jul 22', type: 'Hackathon', loc: 'Online / Hub' }
  ];

  return (
    <div className="space-y-3">
      {events.map((ev, i) => (
        <div key={i} className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-center bg-[#FAF9F5] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1 shrink-0">
            <span className="text-[10px] font-extrabold font-mono text-[#F97316] dark:text-orange-500 block">{ev.date.split(' ')[1]}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase block">{ev.date.split(' ')[0]}</span>
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-baseline gap-1">
              <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 uppercase">{ev.type}</span>
              <span className="text-[9px] text-slate-400 font-semibold">{ev.loc}</span>
            </div>
            <h6 className="text-xs font-bold text-slate-800 dark:text-white truncate mt-1">{ev.title}</h6>
          </div>
        </div>
      ))}
    </div>
  );
}

// 21. Portfolio Progress
export function PortfolioProgressWidget() {
  const items = [
    { label: 'Academic Resume', status: 'Complete' },
    { label: '2 Approved Projects', status: '1/2 Uploaded' },
    { label: 'GitHub Sync Connected', status: 'Sync active' },
    { label: '2 Core Certificates', status: 'Complete' },
    { label: 'Public Profile Visibility', status: 'Active' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">PORTFOLIO COMPLETION</span>
        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-500 font-mono">80%</span>
      </div>

      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-[#F97316] rounded-full" style={{ width: '80%' }} />
      </div>

      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-left">{it.label}</span>
            <span className={`text-[9.5px] font-bold font-mono ${
              it.status.includes('Complete') || it.status.includes('active') || it.status.includes('Active')
                ? 'text-emerald-500'
                : 'text-amber-500'
            }`}>
              {it.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 22. Career Readiness
export function CareerReadinessWidget({
  careerGoal
}: {
  careerGoal: string;
}) {
  const readinessMetrics = useMemo(() => {
    if (careerGoal === 'GATE') {
      return {
        score: 74,
        details: [
          { name: 'Core Subjects Theory', status: '85% Strong' },
          { name: 'Linear Algebra Math', status: '60% Weak' },
          { name: 'PYQ Practice', status: '70% Good' }
        ],
        tip: 'Focus on engineering mathematics mock quizzes this week to lift score.'
      };
    } else if (careerGoal === 'Research') {
      return {
        score: 68,
        details: [
          { name: 'IEEE Literature Reads', status: '90% Strong' },
          { name: 'Academic Writing', status: '50% Weak' },
          { name: 'Simulation Tools', status: '65% Good' }
        ],
        tip: 'Co-author 1 review article with your faculty mentor for research profiles.'
      };
    }
    // Default to Placement
    return {
      score: 82,
      details: [
        { name: 'Technical Coding Skills', status: '85% Strong' },
        { name: 'Project Quality', status: '80% Good' },
        { name: 'Resume Formatting', status: '95% Strong' }
      ],
      tip: 'Practice communication video mocks to lift recruitment selection odds.'
    };
  }, [careerGoal]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Radial progress circle */}
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800 dark:text-white" />
            <circle 
              cx="18" 
              cy="18" 
              r="16" 
              fill="none" 
              stroke="#F97316" 
              strokeWidth="3" 
              strokeDasharray={`${readinessMetrics.score}, 100`} 
              strokeLinecap="round" 
            />
          </svg>
          <span className="absolute text-xs font-black font-mono text-[#F97316] dark:text-orange-500">{readinessMetrics.score}%</span>
        </div>

        <div className="flex-1 space-y-1.5 text-[10px] font-bold">
          {readinessMetrics.details.map((det, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="text-slate-500">{det.name}:</span>
              <span className={det.status.includes('Weak') ? 'text-red-500' : 'text-emerald-500'}>{det.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-500/10 rounded-2xl text-left">
        <span className="text-[8.5px] font-bold text-slate-400 block mb-1">RECOMMENDED ACTION</span>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">"{readinessMetrics.tip}"</p>
      </div>
    </div>
  );
}

// 23. Study Timer (Pomodoro)
export function StudyTimerWidget({
  userStats,
  setUserStats,
  addToast
}: {
  userStats: any;
  setUserStats: React.Dispatch<React.SetStateAction<any>>;
  addToast: (msg: string) => void;
}) {
  const [seconds, setSeconds] = useState(1500); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: any;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
      if (mode === 'work') {
        setUserStats((s: any) => ({ ...s, xp: s.xp + 50, coins: s.coins + 10 }));
        addToast('Great job! 25m Pomodoro session completed: +50 XP & +10 Coins! 🍅');
        setSeconds(300); // 5 min break
        setMode('break');
      } else {
        addToast('Break over! Back to engineering study.');
        setSeconds(1500);
        setMode('work');
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds, mode]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(mode === 'work' ? 1500 : 300);
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent">
        <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
          {mode === 'work' ? 'FOCUS TIME (TOMATO)' : 'SHORT BREAK'}
        </span>
        <div className="text-4xl font-extrabold font-mono text-slate-800 dark:text-white my-2">{formatTime(seconds)}</div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleStartPause}
          className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold shadow-xs cursor-pointer border-none text-white ${
            isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-orange-600 dark:bg-orange-500 hover:bg-orange-700'
          }`}
        >
          {isRunning ? 'Pause Session' : 'Start Focus Timer'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 rounded-xl text-[10px] font-bold cursor-pointer bg-transparent"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// 24. Engineering News
export function EngineeringNewsWidget({
  branch
}: {
  branch: string;
}) {
  const news = useMemo(() => {
    return findMatchingBranchData(BRANCH_NEWS, branch);
  }, [branch]);

  return (
    <div className="space-y-3">
      {news.map((item, i) => (
        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-[#FAF9F5] dark:border-slate-800 text-left">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[8px] font-bold text-[#F97316] dark:text-orange-500 uppercase tracking-wider font-mono">{item.source}</span>
            <span className="text-[8.5px] text-slate-400 font-semibold">{item.age}</span>
          </div>
          <h6 className="text-xs font-bold text-slate-800 dark:text-white leading-normal">{item.title}</h6>
        </div>
      ))}
    </div>
  );
}

// 25. Campus Shop
export function CampusShopWidget({
  coins,
  setUserStats,
  addToast
}: {
  coins: number;
  setUserStats: React.Dispatch<React.SetStateAction<any>>;
  addToast: (msg: string) => void;
}) {
  const items = [
    { id: 'sh1', name: 'Faculty Resume Review', cost: 150, type: 'review' },
    { id: 'sh2', name: 'Course verified certificate', cost: 300, type: 'cert' },
    { id: 'sh3', name: 'Premium Portal Theme pack', cost: 100, type: 'theme' }
  ];

  const handleBuy = (id: string, name: string, cost: number) => {
    if (coins < cost) {
      addToast(`Insufficient Campus Coins. You need ${cost - coins} more coins! 🪙`);
      return;
    }
    setUserStats((prev: any) => ({ ...prev, coins: prev.coins - cost }));
    addToast(`Purchased ${name}! Check email/profile for details. -${cost} Coins 🎉`);
  };

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-[#FAF9F5] dark:border-slate-800">
          <div className="text-left min-w-0 flex-1 mr-3">
            <h6 className="text-xs font-bold text-slate-800 dark:text-white truncate">{item.name}</h6>
            <span className="text-[9.5px] font-mono text-[#F97316] dark:text-orange-500 font-extrabold tracking-wider mt-0.5 block">{item.cost} Coins</span>
          </div>
          <button
            onClick={() => handleBuy(item.id, item.name, item.cost)}
            className="px-3.5 py-1.5 bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 text-white rounded-xl text-[10px] font-bold shadow-xs cursor-pointer border-none shrink-0"
          >
            Redeem
          </button>
        </div>
      ))}
    </div>
  );
}
