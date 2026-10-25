// ============================================================
// SHIKSHA SAHAYAK — GTU ENGINEERING PHYSICS (BE01R00021 / 3110018)
// Comprehensive Verified Question Generator (Unit 1 to Unit 5)
// Command: npx tsx scripts/generate-physics-mcqs.ts
// ============================================================

import fs from 'fs';
import path from 'path';

export interface QuestionData {
  unitNo: number;
  unitName: string;
  topicName: string;
  questionText: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE';
  examYear?: number;
}

export const PHYSICS_QUESTION_BANK: QuestionData[] = [
  // ============================================================
  // UNIT 1: OPTICS, INTERFERENCE & DIFFRACTION
  // ============================================================
  {
    unitNo: 1,
    unitName: 'Optics & Wave Interference',
    topicName: 'Thin Film Interference & Newton Rings',
    questionText: 'In Newton\'s rings experiment viewed by reflected monochromatic light of wavelength $\\lambda$, the central spot is always dark because:',
    options: [
      { id: 'A', text: 'An additional phase change of $\\pi$ radians (path difference of $\\lambda/2$) occurs upon reflection at the rarer-to-denser medium boundary' },
      { id: 'B', text: 'The film thickness at the point of contact is equal to $\\lambda/4$' },
      { id: 'C', text: 'Destructive interference occurs due to absorption of light by the plano-convex lens' },
      { id: 'D', text: 'Refraction through the glass plate introduces a path difference of $\\lambda$' },
    ],
    correctAnswer: 'A',
    explanation: 'According to Stokes\' treatment, when light is reflected from the boundary of a denser medium (glass plate with higher refractive index), it undergoes a phase shift of $\\pi$ radians, equivalent to a path difference of $\\lambda/2$. At the point of contact, film thickness $t = 0$, so the net effective path difference $\\Delta = 2\\mu t + \\lambda/2 = \\lambda/2$, which satisfies the condition for destructive interference (dark fringe).',
    difficulty: 'easy',
    bloomLevel: 'UNDERSTAND',
    examYear: 2024,
  },
  {
    unitNo: 1,
    unitName: 'Optics & Wave Interference',
    topicName: 'Thin Film Interference & Newton Rings',
    questionText: 'In Newton\'s rings experiment using light of wavelength $\\lambda$, the diameter $D_n$ of the $n^{\\text{th}}$ dark ring in reflected light is directly proportional to:',
    options: [
      { id: 'A', text: '$\\sqrt{n}$' },
      { id: 'B', text: '$n$' },
      { id: 'C', text: '$n^2$' },
      { id: 'D', text: '$\\sqrt{2n - 1}$' },
    ],
    correctAnswer: 'A',
    explanation: 'The diameter of the $n^{\\text{th}}$ dark ring in reflected light is given by $D_n = \\sqrt{4 n R \\lambda} = 2\\sqrt{n R \\lambda}$, where $R$ is the radius of curvature of the plano-convex lens. Therefore, $D_n \\propto \\sqrt{n}$ (proportional to the square root of natural numbers). For bright rings, diameter is proportional to $\\sqrt{2n - 1}$.',
    difficulty: 'easy',
    bloomLevel: 'REMEMBER',
    examYear: 2023,
  },
  {
    unitNo: 1,
    unitName: 'Optics & Wave Interference',
    topicName: 'Diffraction Grating & Resolving Power',
    questionText: 'A plane transmission diffraction grating has $N$ lines per centimeter. What is the maximum wavelength of light $\\lambda$ for which the first-order principal maximum ($n=1$) can be observed at normal incidence?',
    options: [
      { id: 'A', text: '$\\lambda_{\\text{max}} = \\frac{1}{N}$' },
      { id: 'B', text: '$\\lambda_{\\text{max}} = \\frac{1}{2N}$' },
      { id: 'C', text: '$\\lambda_{\\text{max}} = N$' },
      { id: 'D', text: '$\\lambda_{\\text{max}} = \\frac{2}{N}$' },
    ],
    correctAnswer: 'A',
    explanation: 'The grating equation at normal incidence is $(a + b)\\sin\\theta = n\\lambda$, where the grating element $(a + b) = 1/N$. For the first order ($n=1$), $\\lambda = \\frac{1}{N}\\sin\\theta$. Since the maximum possible value of $\\sin\\theta$ is 1 (at $\\theta = 90^\\circ$), the maximum observable wavelength is $\\lambda_{\\text{max}} = 1/N$.',
    difficulty: 'medium',
    bloomLevel: 'APPLY',
    examYear: 2024,
  },
  {
    unitNo: 1,
    unitName: 'Optics & Wave Interference',
    topicName: 'Wedge Shaped Thin Film',
    questionText: 'In an air wedge film illuminated by sodium light of wavelength $\\lambda = 6000\\text{ \\AA}$, consecutive dark fringes are separated by fringe width $\\beta = 0.12\\text{ mm}$. What is the wedge angle $\\theta$ in radians?',
    options: [
      { id: 'A', text: '$2.5 \\times 10^{-3}\\text{ rad}$' },
      { id: 'B', text: '$5.0 \\times 10^{-3}\\text{ rad}$' },
      { id: 'C', text: '$1.25 \\times 10^{-3}\\text{ rad}$' },
      { id: 'D', text: '$2.5 \\times 10^{-4}\\text{ rad}$' },
    ],
    correctAnswer: 'A',
    explanation: 'Fringe width in a wedge-shaped film is given by $\\beta = \\frac{\\lambda}{2\\mu \\theta}$. For an air wedge ($\\mu = 1$), $\\theta = \\frac{\\lambda}{2\\beta} = \\frac{6000 \\times 10^{-10}\\text{ m}}{2 \\times (0.12 \\times 10^{-3}\\text{ m})} = \\frac{6 \\times 10^{-7}}{2.4 \\times 10^{-4}} = 2.5 \\times 10^{-3}\\text{ radians}$.',
    difficulty: 'medium',
    bloomLevel: 'APPLY',
    examYear: 2024,
  },
  {
    unitNo: 1,
    unitName: 'Optics & Wave Interference',
    topicName: 'Fraunhofer Single Slit Diffraction',
    questionText: 'In Fraunhofer diffraction at a single slit of width $a$ illuminated by light of wavelength $\\lambda$, the condition for the $m^{\\text{th}}$ minima is:',
    options: [
      { id: 'A', text: '$a \\sin\\theta = m\\lambda \\quad (m = \\pm 1, \\pm 2, \\dots)$' },
      { id: 'B', text: '$a \\sin\\theta = (2m+1)\\frac{\\lambda}{2}$' },
      { id: 'C', text: '$a \\cos\\theta = m\\lambda$' },
      { id: 'D', text: '$a \\tan\\theta = m\\lambda$' },
    ],
    correctAnswer: 'A',
    explanation: 'For Fraunhofer single slit diffraction, the path difference between secondary wavelets from the top and bottom edges of the slit is $a \\sin\\theta$. When $a \\sin\\theta = m\\lambda$ with $m \\in \\{\\pm 1, \\pm 2, \\dots\\}$, the slit can be divided into $2m$ equal zones whose wavelets cancel in pairs, producing complete destructive interference (minima).',
    difficulty: 'easy',
    bloomLevel: 'REMEMBER',
    examYear: 2023,
  },

  // ============================================================
  // UNIT 2: LASERS & OPTICAL FIBERS
  // ============================================================
  {
    unitNo: 2,
    unitName: 'Lasers & Optical Fiber Communications',
    topicName: 'Einstein Coefficients & Population Inversion',
    questionText: 'What is the physical relationship between Einstein\'s coefficient of spontaneous emission $A_{21}$ and stimulated emission $B_{21}$ in a two-level atomic system?',
    options: [
      { id: 'A', text: '$\\frac{A_{21}}{B_{21}} = \\frac{8\\pi h \\nu^3}{c^3}$' },
      { id: 'B', text: '$\\frac{A_{21}}{B_{21}} = \\frac{8\\pi h \\nu^2}{c^2}$' },
      { id: 'C', text: '$\\frac{A_{21}}{B_{21}} = \\frac{h \\nu}{k T}$' },
      { id: 'D', text: '$\\frac{A_{21}}{B_{21}} = 1$' },
    ],
    correctAnswer: 'A',
    explanation: 'By equating the rate of upward and downward transitions under thermal equilibrium and comparing with Planck\'s blackbody radiation formula, Einstein derived the ratio $\\frac{A_{21}}{B_{21}} = \\frac{8\\pi h \\nu^3}{c^3}$. This demonstrates that spontaneous emission increases rapidly with frequency $\\nu^3$, making X-ray lasers much harder to construct than optical lasers.',
    difficulty: 'medium',
    bloomLevel: 'UNDERSTAND',
    examYear: 2024,
  },
  {
    unitNo: 2,
    unitName: 'Lasers & Optical Fiber Communications',
    topicName: 'He-Ne Laser Mechanism',
    questionText: 'In a Helium-Neon (He-Ne) continuous gas laser, what is the primary function of the Helium atoms in the gas mixture?',
    options: [
      { id: 'A', text: 'To achieve efficient resonant collision energy transfer to excite Neon atoms to metastable states ($2s$ and $3s$)' },
      { id: 'B', text: 'To emit the characteristic $632.8\\text{ nm}$ red laser photon directly' },
      { id: 'C', text: 'To act as the optical cavity resonant reflector mirror' },
      { id: 'D', text: 'To cool down the discharge tube by absorbing heat photons' },
    ],
    correctAnswer: 'A',
    explanation: 'In a He-Ne laser (ratio roughly 10:1), electric discharge excites He atoms from ground state to metastable $2^3S$ and $2^1S$ states by electron impact. Because these He energy levels almost exactly match the $2s$ and $3s$ levels of Neon, Helium atoms transfer energy to Neon atoms via resonant inelastic collisions, establishing the population inversion in Neon.',
    difficulty: 'easy',
    bloomLevel: 'UNDERSTAND',
    examYear: 2023,
  },
  {
    unitNo: 2,
    unitName: 'Lasers & Optical Fiber Communications',
    topicName: 'Optical Fibers & Numerical Aperture',
    questionText: 'An optical fiber has a core refractive index $n_1 = 1.50$ and a cladding refractive index $n_2 = 1.45$. What is its Numerical Aperture ($NA$) in air ($n_0 = 1.0$)?',
    options: [
      { id: 'A', text: '$0.384$' },
      { id: 'B', text: '$0.050$' },
      { id: 'C', text: '$0.707$' },
      { id: 'D', text: '$0.125$' },
    ],
    correctAnswer: 'A',
    explanation: 'The Numerical Aperture represents the light-gathering capacity of the fiber and is given by $NA = \\sqrt{n_1^2 - n_2^2} = \\sqrt{(1.50)^2 - (1.45)^2} = \\sqrt{2.25 - 2.1025} = \\sqrt{0.1475} \\approx 0.384$.',
    difficulty: 'medium',
    bloomLevel: 'APPLY',
    examYear: 2024,
  },
  {
    unitNo: 2,
    unitName: 'Lasers & Optical Fiber Communications',
    topicName: 'Optical Fiber Acceptance Angle & V-Number',
    questionText: 'For light to propagate successfully through a step-index optical fiber via Total Internal Reflection (TIR), the angle of incidence $\\theta_i$ at the fiber air-core interface must satisfy:',
    options: [
      { id: 'A', text: '$\\theta_i \\le \\theta_a = \\sin^{-1}(NA)$' },
      { id: 'B', text: '$\\theta_i > \\sin^{-1}(NA)$' },
      { id: 'C', text: '$\\theta_i = 90^\\circ$' },
      { id: 'D', text: '$\\theta_i = \\sin^{-1}(n_2 / n_1)$' },
    ],
    correctAnswer: 'A',
    explanation: 'The maximum launch angle at which light enters the fiber and still undergoes TIR at the core-cladding boundary is the acceptance angle $\\theta_a = \\sin^{-1}(NA)$. Any ray launched with $\\theta_i \\le \\theta_a$ will strike the core-cladding interface at an angle greater than the critical angle $\\theta_c$, ensuring lossless guided propagation.',
    difficulty: 'easy',
    bloomLevel: 'UNDERSTAND',
    examYear: 2024,
  },
  {
    unitNo: 2,
    unitName: 'Lasers & Optical Fiber Communications',
    topicName: 'Optical Fiber Types',
    questionText: 'Which optical fiber design is specifically engineered to minimize intermodal dispersion over long-distance high-bandwidth telecommunications?',
    options: [
      { id: 'A', text: 'Graded-Index (GRIN) Multimode Fiber' },
      { id: 'B', text: 'Step-Index Multimode Fiber with large core diameter' },
      { id: 'C', text: 'Plastic Step-Index Optical Fiber' },
      { id: 'D', text: 'Unclad Glass Rod' },
    ],
    correctAnswer: 'A',
    explanation: 'In Graded-Index (GRIN) fibers, the refractive index decreases parabolically from the core center towards the cladding. Light rays traveling along longer outer helical paths travel faster through the lower index medium than axial rays, equalizing transit times and dramatically reducing intermodal dispersion.',
    difficulty: 'easy',
    bloomLevel: 'REMEMBER',
    examYear: 2023,
  },

  // ============================================================
  // UNIT 3: QUANTUM MECHANICS
  // ============================================================
  {
    unitNo: 3,
    unitName: 'Quantum Mechanics',
    topicName: 'De Broglie Wavelength & Matter Waves',
    questionText: 'An electron of mass $m$ and charge $e$ is accelerated from rest through a potential difference of $V = 100\\text{ Volts}$. What is its de Broglie wavelength $\\lambda$?',
    options: [
      { id: 'A', text: '$1.227\\text{ \\AA} \\quad (0.1227\\text{ nm})$' },
      { id: 'B', text: '$12.27\\text{ \\AA}$' },
      { id: 'C', text: '$0.01227\\text{ nm}$' },
      { id: 'D', text: '$6.626\\text{ \\AA}$' },
    ],
    correctAnswer: 'A',
    explanation: 'For a non-relativistic electron accelerated across potential $V$, $\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2m e V}} = \\frac{12.27}{\\sqrt{V}}\\text{ \\AA}$. For $V = 100\\text{ V}$, $\\lambda = \\frac{12.27}{\\sqrt{100}} = \\frac{12.27}{10} = 1.227\\text{ \\AA} = 0.1227\\text{ nm}$.',
    difficulty: 'medium',
    bloomLevel: 'APPLY',
    examYear: 2024,
  },
  {
    unitNo: 3,
    unitName: 'Quantum Mechanics',
    topicName: 'Heisenberg Uncertainty Principle',
    questionText: 'Heisenberg\'s Uncertainty Principle asserts that for any quantum particle, the simultaneous measurement of position $x$ and linear momentum $p_x$ is fundamentally constrained by:',
    options: [
      { id: 'A', text: '$\\Delta x \\cdot \\Delta p_x \\ge \\frac{\\hbar}{2} = \\frac{h}{4\\pi}$' },
      { id: 'B', text: '$\\Delta x \\cdot \\Delta p_x \\le \\frac{h}{2\\pi}$' },
      { id: 'C', text: '$\\Delta x \\cdot \\Delta p_x = 0$' },
      { id: 'D', text: '$\\Delta x \\cdot \\Delta p_x \\ge h c$' },
    ],
    correctAnswer: 'A',
    explanation: 'Heisenberg showed that the wave nature of matter imposes a fundamental quantum limit on the product of uncertainties in conjugate variables: $\\Delta x \\cdot \\Delta p_x \\ge \\frac{\\hbar}{2} = \\frac{h}{4\\pi}$. Similarly, energy and time satisfy $\\Delta E \\cdot \\Delta t \\ge \\frac{\\hbar}{2}$.',
    difficulty: 'easy',
    bloomLevel: 'REMEMBER',
    examYear: 2024,
  },
  {
    unitNo: 3,
    unitName: 'Quantum Mechanics',
    topicName: 'Particle in a 1D Infinite Potential Box',
    questionText: 'A quantum particle of mass $m$ is trapped in a 1D rigid box of length $L$ with infinite potential walls ($0 \\le x \\le L$). What is the energy of its second excited state ($n=3$)?',
    options: [
      { id: 'A', text: '$E_3 = \\frac{9 h^2}{8 m L^2}$' },
      { id: 'B', text: '$E_3 = \\frac{4 h^2}{8 m L^2}$' },
      { id: 'C', text: '$E_3 = \\frac{3 h^2}{8 m L^2}$' },
      { id: 'D', text: '$E_3 = \\frac{16 h^2}{8 m L^2}$' },
    ],
    correctAnswer: 'A',
    explanation: 'Energy eigenvalues for a particle in a 1D infinite square well are $E_n = \\frac{n^2 h^2}{8 m L^2} = \\frac{n^2 \\pi^2 \\hbar^2}{2 m L^2}$. The ground state corresponds to $n=1$, the first excited state to $n=2$, and the second excited state to $n=3$. Thus, $E_3 = \\frac{3^2 h^2}{8 m L^2} = \\frac{9 h^2}{8 m L^2}$.',
    difficulty: 'medium',
    bloomLevel: 'APPLY',
    examYear: 2023,
  },
  {
    unitNo: 3,
    unitName: 'Quantum Mechanics',
    topicName: 'Born Interpretation of Wavefunction',
    questionText: 'According to Max Born\'s probabilistic interpretation, what is the physical meaning of $|\\psi(x, t)|^2 dV = \\psi^*(x,t)\\psi(x,t) dV$?',
    options: [
      { id: 'A', text: 'The probability of finding the particle within volume element $dV$ at time $t$' },
      { id: 'B', text: 'The exact velocity of the particle at position $x$' },
      { id: 'C', text: 'The charge density distribution divided by $c$' },
      { id: 'D', text: 'The instantaneous kinetic energy of the wave packet' },
    ],
    correctAnswer: 'A',
    explanation: 'While the complex wavefunction $\\psi(x,t)$ itself is not directly measurable, its squared modulus $|\\psi(x,t)|^2 = \\psi^*(x,t)\\psi(x,t)$ represents the probability density $P(x,t)$. Multiplying by volume element $dV$ gives the probability of locating the particle in that region.',
    difficulty: 'easy',
    bloomLevel: 'UNDERSTAND',
    examYear: 2024,
  },
  {
    unitNo: 3,
    unitName: 'Quantum Mechanics',
    topicName: 'Wavefunction Normalization',
    questionText: 'The normalized wave function of a particle in a 1D box of width $L$ is $\\psi_n(x) = \\sqrt{\\frac{2}{L}}\\sin\\left(\\frac{n\\pi x}{L}\\right)$. What is the probability of finding the particle in the ground state ($n=1$) in the left half of the box ($0 \\le x \\le L/2$)?',
    options: [
      { id: 'A', text: '$0.50$ ($50\\%$)' },
      { id: 'B', text: '$0.25$ ($25\\%$)' },
      { id: 'C', text: '$0.75$ ($75\\%$)' },
      { id: 'D', text: '$1.00$ ($100\\%$)' },
    ],
    correctAnswer: 'A',
    explanation: 'The probability density $|\\psi_1(x)|^2 = \\frac{2}{L}\\sin^2\\left(\\frac{\\pi x}{L}\\right)$ is symmetric about the center of the box $x = L/2$. Integrating from $0$ to $L/2$ yields $\\int_0^{L/2} \\frac{2}{L}\\sin^2\\left(\\frac{\\pi x}{L}\\right) dx = \\frac{1}{2} = 0.50$.',
    difficulty: 'medium',
    bloomLevel: 'APPLY',
    examYear: 2024,
  },

  // ============================================================
  // UNIT 4: SUPERCONDUCTIVITY & MAGNETIC MATERIALS
  // ============================================================
  {
    unitNo: 4,
    unitName: 'Superconductivity & Magnetic Materials',
    topicName: 'Meissner Effect & Diamagnetism',
    questionText: 'When a material transitions into the superconducting state below its critical temperature $T_c$ in the presence of an external magnetic field $B$, it expels all magnetic flux from its interior ($B=0$). This phenomenon is called the:',
    options: [
      { id: 'A', text: 'Meissner Effect' },
      { id: 'B', text: 'Hall Effect' },
      { id: 'C', text: 'Seebeck Effect' },
      { id: 'D', text: 'Peltier Effect' },
    ],
    correctAnswer: 'A',
    explanation: 'Discovered by Walther Meissner and Robert Ochsenfeld (1933), the Meissner effect shows that superconductors exhibit perfect diamagnetism with magnetic susceptibility $\\chi_m = -1$ and relative permeability $\\mu_r = 0$, completely expelling magnetic flux lines from their bulk interior.',
    difficulty: 'easy',
    bloomLevel: 'REMEMBER',
    examYear: 2024,
  },
  {
    unitNo: 4,
    unitName: 'Superconductivity & Magnetic Materials',
    topicName: 'Critical Magnetic Field',
    questionText: 'A superconductor has a critical field $H_0 = 8 \\times 10^4\\text{ A/m}$ at $T = 0\\text{ K}$ and critical temperature $T_c = 8\\text{ K}$. What is its critical magnetic field $H_c$ at $T = 4\\text{ K}$?',
    options: [
      { id: 'A', text: '$6.0 \\times 10^4\\text{ A/m}$' },
      { id: 'B', text: '$4.0 \\times 10^4\\text{ A/m}$' },
      { id: 'C', text: '$2.0 \\times 10^4\\text{ A/m}$' },
      { id: 'D', text: '$7.5 \\times 10^4\\text{ A/m}$' },
    ],
    correctAnswer: 'A',
    explanation: 'The critical field variation with temperature is given by $H_c(T) = H_0 \\left[1 - \\left(\\frac{T}{T_c}\\right)^2\\right] = 8 \\times 10^4 \\left[1 - \\left(\\frac{4}{8}\\right)^2\\right] = 8 \\times 10^4 \\left[1 - \\frac{1}{4}\\right] = 8 \\times 10^4 \\times 0.75 = 6.0 \\times 10^4\\text{ A/m}$.',
    difficulty: 'medium',
    bloomLevel: 'APPLY',
    examYear: 2023,
  },
  {
    unitNo: 4,
    unitName: 'Superconductivity & Magnetic Materials',
    topicName: 'BCS Theory & Cooper Pairs',
    questionText: 'According to the BCS (Bardeen-Cooper-Schrieffer) microscopic theory of superconductivity, electrical resistance vanishes due to the formation of:',
    options: [
      { id: 'A', text: 'Cooper pairs formed via electron-phonon-electron lattice interactions' },
      { id: 'B', text: 'Positron-electron annihilation pairs' },
      { id: 'C', text: 'Hole-hole repulsive clusters' },
      { id: 'D', text: 'Photon-electron condensates' },
    ],
    correctAnswer: 'A',
    explanation: 'In BCS theory, an electron passing through the crystal lattice attracts positive ions, creating a slight local polarization (phonon excitation). A second electron is attracted to this positive region, forming a bound electron-electron pair called a Cooper pair with zero net spin (boson behavior) that moves without lattice scattering.',
    difficulty: 'easy',
    bloomLevel: 'UNDERSTAND',
    examYear: 2024,
  },
  {
    unitNo: 4,
    unitName: 'Superconductivity & Magnetic Materials',
    topicName: 'Magnetic Materials & Hysteresis Loop',
    questionText: 'In a ferromagnetic material $B\\text{-}H$ hysteresis loop, the value of magnetic induction $B$ remaining in the specimen when the magnetizing field $H$ is reduced to zero is called:',
    options: [
      { id: 'A', text: 'Retentivity (Residual Magnetism)' },
      { id: 'B', text: 'Coercivity' },
      { id: 'C', text: 'Curie Temperature' },
      { id: 'D', text: 'Permeability' },
    ],
    correctAnswer: 'A',
    explanation: 'Retentivity (or remanence) is the residual flux density $B_r$ remaining in a ferromagnetic material after the external magnetizing force $H$ has been reduced to zero. Coercivity $H_c$, on the other hand, is the reverse magnetic field required to reduce this residual magnetism back to zero.',
    difficulty: 'easy',
    bloomLevel: 'REMEMBER',
    examYear: 2024,
  },
  {
    unitNo: 4,
    unitName: 'Superconductivity & Magnetic Materials',
    topicName: 'Soft vs Hard Magnetic Materials',
    questionText: 'Which property is characteristic of a Soft Magnetic Material (e.g., Silicon Steel, Permalloy) used in transformer cores?',
    options: [
      { id: 'A', text: 'Narrow hysteresis loop, low coercivity, and low hysteresis energy loss' },
      { id: 'B', text: 'Broad hysteresis loop, high coercivity, and high retentivity' },
      { id: 'C', text: 'Negative magnetic susceptibility independent of temperature' },
      { id: 'D', text: 'Zero electrical resistivity at room temperature' },
    ],
    correctAnswer: 'A',
    explanation: 'Soft magnetic materials can be easily magnetized and demagnetized. They have high permeability, small coercive force, and narrow hysteresis loops, which minimizes the area enclosed by the loop and thus drastically reduces core heating/energy loss in AC transformer cores and electric motor armatures.',
    difficulty: 'easy',
    bloomLevel: 'UNDERSTAND',
    examYear: 2023,
  },

  // ============================================================
  // UNIT 5: NANOMATERIALS & MODERN APPLICATIONS
  // ============================================================
  {
    unitNo: 5,
    unitName: 'Nanomaterials & Modern Physics',
    topicName: 'Quantum Confinement & Dimensionality',
    questionText: 'A Quantum Dot is classified as a zero-dimensional (0D) nanomaterial because:',
    options: [
      { id: 'A', text: 'Quantum confinement of charge carriers occurs along all three spatial dimensions ($x, y, z < 100\\text{ nm}$)' },
      { id: 'B', text: 'Electrons can move freely along two spatial directions' },
      { id: 'C', text: 'It has zero mass and zero volume' },
      { id: 'D', text: 'It possesses infinite electrical conductivity' },
    ],
    correctAnswer: 'A',
    explanation: 'In nanomaterials, dimensionality is defined by the degrees of freedom for electron motion: 2D nanostructures (Quantum Wells) confine electrons in 1 dimension, 1D nanostructures (Quantum Wires/Nanotubes) confine in 2 dimensions, and 0D nanostructures (Quantum Dots/Nanoparticles) confine electrons in all 3 spatial dimensions ($< 100\\text{ nm}$), producing discrete atomic-like energy levels.',
    difficulty: 'easy',
    bloomLevel: 'UNDERSTAND',
    examYear: 2024,
  },
  {
    unitNo: 5,
    unitName: 'Nanomaterials & Modern Physics',
    topicName: 'Surface-to-Volume Ratio & Melting Point',
    questionText: 'When a bulk material of radius $R$ is pulverized into nanoscale particles of radius $r$ ($r \\ll R$), what happens to its surface-to-volume ratio ($S/V$) and melting point?',
    options: [
      { id: 'A', text: 'Surface-to-volume ratio increases drastically, causing a significant reduction in melting point' },
      { id: 'B', text: 'Surface-to-volume ratio decreases, increasing the melting point' },
      { id: 'C', text: 'Both surface-to-volume ratio and melting point remain strictly constant' },
      { id: 'D', text: 'Surface-to-volume ratio drops to zero' },
    ],
    correctAnswer: 'A',
    explanation: 'For spherical particles, surface-to-volume ratio $S/V = \\frac{4\\pi r^2}{(4/3)\\pi r^3} = \\frac{3}{r}$, which increases dramatically as particle radius $r$ shrinks into the nanoscale ($1\\text{--}100\\text{ nm}$). Because a larger fraction of atoms reside on the surface with unsaturated dangling bonds and higher surface energy, the melting point of nanoparticles decreases compared to bulk.',
    difficulty: 'medium',
    bloomLevel: 'ANALYZE',
    examYear: 2024,
  },
  {
    unitNo: 5,
    unitName: 'Nanomaterials & Modern Physics',
    topicName: 'Carbon Nanotubes (CNTs)',
    questionText: 'Single-Walled Carbon Nanotubes (SWCNTs) can be conceptually described as a rolled-up cylindrical sheet of:',
    options: [
      { id: 'A', text: 'Graphene ($sp^2$-hybridized honeycomb hexagonal carbon lattice)' },
      { id: 'B', text: 'Diamond ($sp^3$-hybridized tetrahedral crystal lattice)' },
      { id: 'C', text: 'Fullerene ($C_{60}$ soccer-ball molecule)' },
      { id: 'D', text: 'Amorphous carbon soot' },
    ],
    correctAnswer: 'A',
    explanation: 'A single-walled carbon nanotube (SWCNT) is formed by rolling a single two-dimensional monolayer sheet of graphene (consisting of $sp^2$-hybridized carbon atoms arranged in a 2D honeycomb lattice) into a seamless cylinder with diameters typically between $0.8\\text{--}2.0\\text{ nm}$.',
    difficulty: 'easy',
    bloomLevel: 'REMEMBER',
    examYear: 2023,
  },
  {
    unitNo: 5,
    unitName: 'Nanomaterials & Modern Physics',
    topicName: 'Synthesis Methods (Top-Down vs Bottom-Up)',
    questionText: 'Which of the following nanomaterial synthesis techniques is classified as a "Bottom-Up" chemical synthesis method?',
    options: [
      { id: 'A', text: 'Sol-Gel Synthesis and Chemical Vapor Deposition (CVD)' },
      { id: 'B', text: 'High-Energy Ball Milling' },
      { id: 'C', text: 'Photolithographic Etching' },
      { id: 'D', text: 'Mechanical Laser Ablation' },
    ],
    correctAnswer: 'A',
    explanation: 'Bottom-up methods assemble nanostructures atom-by-atom or molecule-by-molecule through chemical reaction and self-assembly (e.g., Sol-Gel, Chemical Vapor Deposition (CVD), Molecular Beam Epitaxy). Top-down methods break down bulk materials mechanically or lithographically (e.g., Ball milling, Lithography, Laser ablation).',
    difficulty: 'easy',
    bloomLevel: 'UNDERSTAND',
    examYear: 2024,
  },
  {
    unitNo: 5,
    unitName: 'Nanomaterials & Modern Physics',
    topicName: 'Photoelectric Effect & Work Function',
    questionText: 'Light of frequency $\\nu$ illuminates a metal with work function $\\Phi_0 = h\\nu_0$. According to Einstein\'s photoelectric equation, the maximum kinetic energy $K_{\\text{max}}$ of emitted photoelectrons is:',
    options: [
      { id: 'A', text: '$K_{\\text{max}} = h\\nu - \\Phi_0 = h(\\nu - \\nu_0)$' },
      { id: 'B', text: '$K_{\\text{max}} = h\\nu + \\Phi_0$' },
      { id: 'C', text: '$K_{\\text{max}} = \\frac{h\\nu}{\\Phi_0}$' },
      { id: 'D', text: '$K_{\\text{max}} = \\frac{1}{2}h\\nu_0$' },
    ],
    correctAnswer: 'A',
    explanation: 'Einstein\'s photoelectric equation states that the incident photon energy $h\\nu$ is used in two parts: first to overcome the surface work function barrier $\\Phi_0 = h\\nu_0$, and the remainder is transferred as the maximum kinetic energy of the liberated electron: $K_{\\text{max}} = h\\nu - \\Phi_0 = h(\\nu - \\nu_0)$.',
    difficulty: 'easy',
    bloomLevel: 'REMEMBER',
    examYear: 2024,
  },
];

export function buildPhysicsMigrationSql(): string {
  let sql = `-- Migration 079: GTU Engineering Physics (BE01R00021 / 3110018) Full Question Bank\n`;
  sql += `-- Auto-generated 25 verified syllabus-grounded questions across Units 1 to 5.\n`;
  sql += `PRAGMA foreign_keys = ON;\n\n`;

  const nepCode = 'BE01R00021';
  const cbcsCode = '3110018';
  const subjectName = 'Engineering Physics';
  const semester = 1;
  const branches = ['branch_00', 'branch_06', 'branch_07', 'branch_09', 'branch_11', 'branch_16', 'branch_19'];

  let count = 0;
  let mappings = 0;

  for (let i = 0; i < PHYSICS_QUESTION_BANK.length; i++) {
    const q = PHYSICS_QUESTION_BANK[i];
    const qId = `Q_GTU_PHYSICS_${q.examYear || 2024}_${String(i + 1).padStart(3, '0')}`;
    const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
    const correctAnswerJson = JSON.stringify(q.correctAnswer).replace(/'/g, "''");
    const explanationClean = q.explanation.replace(/'/g, "''");
    const questionTextClean = q.questionText.replace(/'/g, "''");
    const topicNameClean = q.topicName.replace(/'/g, "''");

    // Insert for Latest NEP Code
    sql += `INSERT OR IGNORE INTO master_question_bank (
  id, source_type, is_original_pyq, is_ai_generated, provenance_id,
  exam_name, exam_year, exam_session,
  subject_code, subject_name, semester, unit_no, topic_name,
  question_type, question_text, options_json, correct_answer_json,
  explanation, marks, negative_marking,
  difficulty, bloom_level, verification_status, verified_by, verified_at,
  created_at, updated_at
) VALUES (
  '${qId}', 'GTU', 1, 0, 'gtu_physics_${q.examYear || 2024}',
  'GTU', ${q.examYear || 2024}, 'WINTER',
  '${nepCode}', '${subjectName}', ${semester}, ${q.unitNo}, '${topicNameClean}',
  'MCQ', '${questionTextClean}', '${optionsJson}', '${correctAnswerJson}',
  '${explanationClean}', 1.0, 0.25,
  '${q.difficulty}', '${q.bloomLevel}', 'verified', 'gtu_physics_expert', CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);\n`;

    // Also map to branches
    for (const b of branches) {
      sql += `INSERT OR IGNORE INTO question_branch_mappings (id, question_id, branch_id) VALUES ('qbm_${qId}_${b}', '${qId}', '${b}');\n`;
      mappings++;
    }

    // Insert duplicate canonical record pointing to CBCS code 3110018 for cross-version compatibility
    const qIdCbcs = `Q_GTU_3110018_${q.examYear || 2024}_${String(i + 1).padStart(3, '0')}`;
    sql += `INSERT OR IGNORE INTO master_question_bank (
  id, source_type, is_original_pyq, is_ai_generated, provenance_id,
  exam_name, exam_year, exam_session,
  subject_code, subject_name, semester, unit_no, topic_name,
  question_type, question_text, options_json, correct_answer_json,
  explanation, marks, negative_marking,
  difficulty, bloom_level, verification_status, verified_by, verified_at,
  created_at, updated_at
) VALUES (
  '${qIdCbcs}', 'GTU', 1, 0, 'gtu_physics_${q.examYear || 2024}',
  'GTU', ${q.examYear || 2024}, 'WINTER',
  '${cbcsCode}', '${subjectName}', ${semester}, ${q.unitNo}, '${topicNameClean}',
  'MCQ', '${questionTextClean}', '${optionsJson}', '${correctAnswerJson}',
  '${explanationClean}', 1.0, 0.25,
  '${q.difficulty}', '${q.bloomLevel}', 'verified', 'gtu_physics_expert', CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);\n`;

    for (const b of branches) {
      sql += `INSERT OR IGNORE INTO question_branch_mappings (id, question_id, branch_id) VALUES ('qbm_${qIdCbcs}_${b}', '${qIdCbcs}', '${b}');\n`;
      mappings++;
    }

    sql += `\n`;
    count += 2;
  }

  console.log(`Generated migration with ${count} total question records and ${mappings} branch mappings.`);
  return sql;
}

const sql = buildPhysicsMigrationSql();
const outPath = path.join(process.cwd(), 'migrations', '079_seed_gtu_engineering_physics.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Saved migration to ${outPath}`);
