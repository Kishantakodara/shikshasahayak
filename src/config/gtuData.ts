// ============================================================
// OFFICIAL GTU (GUJARAT TECHNOLOGICAL UNIVERSITY) DATA
// Affiliated Engineering Colleges & BE Branches
// ============================================================

export interface GTUCollege {
  code: string;
  name: string;
  shortName: string;
  city: string;
  zone: string;
  itype: string;
}

export interface GTUBranch {
  code: string;
  name: string;
  shortName: string;
}

export interface GTUDegree {
  code: string;
  name: string;
  shortName: string;
}

export const GTU_DEGREES: GTUDegree[] = [
  { code: '01', name: 'Bachelor of Engineering (B.E. / B.Tech)', shortName: 'BE / B.Tech' },
  { code: '06', name: 'Diploma Engineering', shortName: 'Diploma' },
  { code: '02', name: 'Master of Engineering (M.E. / M.Tech)', shortName: 'ME / M.Tech' },
  { code: '05', name: 'Master of Computer Applications (MCA)', shortName: 'MCA' },
  { code: '09', name: 'Master of Business Administration (MBA)', shortName: 'MBA' },
  { code: '07', name: 'Bachelor of Pharmacy (B.Pharm)', shortName: 'B.Pharm' },
  { code: '08', name: 'Master of Pharmacy (M.Pharm)', shortName: 'M.Pharm' },
  { code: '10', name: 'Bachelor of Architecture (B.Arch)', shortName: 'B.Arch' },
  { code: 'other', name: 'Other Degree / Course', shortName: 'Other' }
];

export interface GTUEnrollmentParsed {
  isValid: boolean;
  raw: string;
  year?: string;
  yearFull?: string;
  collegeCode?: string;
  collegeName?: string;
  degreeCode?: string;
  degreeName?: string;
  branchCode?: string;
  branchName?: string;
  studentRoll?: string;
}

export function parseGTUEnrollment(enrollment: string): GTUEnrollmentParsed {
  const clean = enrollment.trim();
  if (!clean || !/^\d+$/.test(clean)) {
    return { isValid: false, raw: clean };
  }

  const result: GTUEnrollmentParsed = {
    isValid: clean.length === 12,
    raw: clean,
  };

  if (clean.length >= 2) {
    const yr = clean.slice(0, 2);
    result.year = yr;
    result.yearFull = `20${yr}`;
  }

  if (clean.length >= 5) {
    const cCode = clean.slice(2, 5);
    result.collegeCode = cCode;
    const foundCollege = GTU_COLLEGES.find((c) => c.code === cCode);
    if (foundCollege) {
      result.collegeName = foundCollege.name;
    }
  }

  if (clean.length >= 7) {
    const dCode = clean.slice(5, 7);
    result.degreeCode = dCode;
    const foundDegree = GTU_DEGREES.find((d) => d.code === dCode);
    if (foundDegree) {
      result.degreeName = foundDegree.name;
    }
  }

  if (clean.length >= 9) {
    const bCode = clean.slice(7, 9);
    result.branchCode = bCode;
    const foundBranch = GTU_BE_BRANCHES.find((b) => b.code === bCode);
    if (foundBranch) {
      result.branchName = foundBranch.name;
    }
  }

  if (clean.length >= 12) {
    result.studentRoll = clean.slice(9, 12);
  }

  return result;
}

export const GTU_COLLEGES: GTUCollege[] = [
  { code: '001', name: 'A. D. Patel Institute Of Technology, Karamsad', shortName: 'ADIT', city: 'Karamsad', zone: '3', itype: 'SFI' },
  { code: '002', name: 'Ahmedabad Institute Of Technology', shortName: 'Ahmedabad', city: 'Ahmedabad', zone: '1', itype: 'SFI' },
  { code: '004', name: 'B. H. Gardi College Of Engineering & Technology', shortName: 'B.', city: 'Gujarat', zone: '4', itype: 'SFI' },
  { code: '005', name: 'Babaria Institute Of Technology, Varnama', shortName: 'Babaria', city: 'Gujarat', zone: '3', itype: 'SFI' },
  { code: '007', name: 'Birla Vishvakarma Mahavidyalaya', shortName: 'BVM', city: 'Gujarat', zone: '3', itype: 'GIA' },
  { code: '009', name: 'C. K. Pithawalla College Of Engineering & Technology', shortName: 'C.', city: 'Gujarat', zone: '5', itype: 'SFI' },
  { code: '012', name: 'Gandhinagar Institute Of Technology, Gandhinagar', shortName: 'Gandhinagar', city: 'Gandhinagar', zone: '2', itype: 'SFI' },
  { code: '013', name: 'Government Engineering College, Sector - 28, Gandhinagar', shortName: 'GEC Gandhinagar', city: 'Gandhinagar', zone: '2', itype: 'GOV' },
  { code: '014', name: 'Government Engineering College, Bharuch', shortName: 'GEC Bharuch', city: 'Bharuch', zone: '5', itype: 'GOV' },
  { code: '015', name: 'Government Engineering College, Bhuj', shortName: 'GEC Bhuj', city: 'Bhuj', zone: '6', itype: 'GOV' },
  { code: '016', name: 'Government Engineering College, Modasa', shortName: 'GEC Modasa', city: 'Modasa', zone: '2', itype: 'GOV' },
  { code: '017', name: 'Vishwakarma Government Engineering College, Chandkheda', shortName: 'GEC Chandkheda', city: 'Chandkheda', zone: '2', itype: 'GOV' },
  { code: '018', name: 'Government Engineering College, Dahod', shortName: 'GEC Dahod', city: 'Dahod', zone: '3', itype: 'GOV' },
  { code: '019', name: 'Government Engineering College, Valsad', shortName: 'GEC Valsad', city: 'Valsad', zone: '5', itype: 'GOV' },
  { code: '020', name: 'Government Engineering College, Rajkot', shortName: 'GEC Rajkot', city: 'Rajkot', zone: '4', itype: 'GOV' },
  { code: '021', name: 'Government Engineering College, Bhavnagar', shortName: 'GEC Bhavnagar', city: 'Bhavnagar', zone: '1', itype: 'GOV' },
  { code: '022', name: 'Government Engineering COLLEGE,AT. Katpur, Patan', shortName: 'Government', city: 'Patan', zone: '2', itype: 'GOV' },
  { code: '023', name: 'DR. S & S.S. Ghandhy Governmetn Engineering College, Surat', shortName: 'DR.', city: 'Surat', zone: '5', itype: 'GOV' },
  { code: '024', name: 'Hasmukh Goswami College Of Engineering, Vahelal', shortName: 'Hasmukh', city: 'Vahelal', zone: '2', itype: 'SFI' },
  { code: '026', name: 'Kalol Institute Of Technology & Research Centre, Kalol', shortName: 'Kalol', city: 'Kalol', zone: '2', itype: 'SFI' },
  { code: '027', name: 'Kankeshwaridevi Institute Of Technology, Jamnagar', shortName: 'Kankeshwaridevi', city: 'Jamnagar', zone: '4', itype: 'SFI' },
  { code: '028', name: 'L. D. College Of Engineering', shortName: 'LDCE', city: 'Gujarat', zone: '1', itype: 'GOV' },
  { code: '029', name: 'Laljibhai Chaturbhai Institute Of Technology', shortName: 'Laljibhai', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '030', name: 'Leelaben Dashrathbhai Ramdas Patel Institute Of Technology & Research, Gandhinagar', shortName: 'Leelaben', city: 'Gandhinagar', zone: '2', itype: 'SFI' },
  { code: '031', name: 'Lukhdhirji Engineering College', shortName: 'Lukhdhirji', city: 'Gujarat', zone: '4', itype: 'GOV' },
  { code: '032', name: 'L. J. Institute Of Engineering And Technology, Ahmedabad', shortName: 'LJIET', city: 'Ahmedabad', zone: '1', itype: 'SFI' },
  { code: '033', name: 'Mahatma Gandhi Institute Of Technical Education & Research Centre', shortName: 'Mahatma', city: 'Gujarat', zone: '5', itype: 'SFI' },
  { code: '034', name: 'Narnarayan Shastri Institute Of Technology, Jetalpur', shortName: 'Narnarayan', city: 'Jetalpur', zone: '1', itype: 'SFI' },
  { code: '035', name: 'Noble Group Of Institutions, Junagadh', shortName: 'Noble', city: 'Junagadh', zone: '4', itype: 'SFI' },
  { code: '036', name: 'Sanjaybhai Rajguru College Of Engineering', shortName: 'Sanjaybhai', city: 'Gujarat', zone: '4', itype: 'SFI' },
  { code: '039', name: 'S. P. B. Patel Engineering College', shortName: 'S.', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '041', name: 'Sardar Vallabhbhai Patel Institute Of Technology (Svit)', shortName: 'Sardar', city: 'Gujarat', zone: '3', itype: 'SFI' },
  { code: '042', name: 'Sarvajanik College Of Engineering & Technology, Surat', shortName: 'Sarvajanik', city: 'Surat', zone: '5', itype: 'SFI' },
  { code: '043', name: 'Shantilal Shah Engineering College', shortName: 'Shantilal', city: 'Gujarat', zone: '1', itype: 'GOV' },
  { code: '045', name: 'Shri S\'ad Vidya Mandal Institute Of Technology', shortName: 'Shri', city: 'Gujarat', zone: '5', itype: 'SFI' },
  { code: '047', name: 'V.V.P. Engineering College', shortName: 'V.V.P.', city: 'Gujarat', zone: '4', itype: 'SFI' },
  { code: '049', name: 'S.N.PATEL Institute Of Technology (Snpit), Bardoli, Surat', shortName: 'S.N.PATEL', city: 'Surat', zone: '5', itype: 'SFI' },
  { code: '050', name: 'Sigma Institute Of Engineering, Vadodara', shortName: 'Sigma', city: 'Vadodara', zone: '3', itype: 'SFI' },
  { code: '051', name: 'Alpha College Of Engineering & Technology, Khatraj, Kalol', shortName: 'Alpha', city: 'Kalol', zone: '2', itype: 'SFI' },
  { code: '052', name: 'Central Institute Of Petrochemicals Engineering And Technology', shortName: 'Central', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '054', name: 'Darshan Institute Of Engineering & Technology, Rajkot-morbi Highway, Hadala', shortName: 'Darshan', city: 'Rajkot', zone: '4', itype: 'SFI' },
  { code: '055', name: 'Engineering College, Tuwa', shortName: 'Engineering', city: 'Tuwa', zone: '3', itype: 'SFI' },
  { code: '056', name: 'Grow More Foundation Group Of Institutions', shortName: 'Grow', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '057', name: 'Marwadi Education Foundation\'s Group Of Institutions,rajkot', shortName: 'Marwadi', city: 'Rajkot', zone: '4', itype: 'SFI' },
  { code: '060', name: 'Government Engineering College, Godhara', shortName: 'GEC Gujarat', city: 'Gujarat', zone: '3', itype: 'GOV' },
  { code: '061', name: 'Government Engineering College, Palanpur', shortName: 'GEC Palanpur', city: 'Palanpur', zone: '2', itype: 'GOV' },
  { code: '062', name: 'Gujarat Institute Of Technical Studies, Moyad, Prantij', shortName: 'Gujarat', city: 'Prantij', zone: '2', itype: 'SFI' },
  { code: '064', name: 'K. J. Institute Of Engineering & Technology', shortName: 'K.', city: 'Gujarat', zone: '3', itype: 'SFI' },
  { code: '065', name: 'Merchant Engineering College', shortName: 'Merchant', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '067', name: 'SAL Institute Of Technology & Engineering Research, Ahmedabad', shortName: 'SAL', city: 'Ahmedabad', zone: '1', itype: 'SFI' },
  { code: '075', name: 'Shankersinh Vaghela Bapu Technical Campus', shortName: 'Shankersinh', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '076', name: 'Shree Swami Atmanand Saraswati Institute Of Technology', shortName: 'Shree', city: 'Anand', zone: '5', itype: 'SFI' },
  { code: '078', name: 'SMT. S. R. Patel Engineering College', shortName: 'SMT.', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '079', name: 'Aurum Institute Of Technology, Rajkot', shortName: 'Aurum', city: 'Rajkot', zone: '4', itype: 'SFI' },
  { code: '080', name: 'Vadodara Institute Of Engineering, Kotambi, Waghodiya', shortName: 'Vadodara', city: 'Vadodara', zone: '3', itype: 'SFI' },
  { code: '082', name: 'DR. Jivraj Mehta Institute Of Technology', shortName: 'DR.', city: 'Gujarat', zone: '3', itype: 'SFI' },
  { code: '083', name: 'DR. Subhash Technical Campus - Junagadh', shortName: 'DR.', city: 'Junagadh', zone: '4', itype: 'SFI' },
  { code: '084', name: 'R.N.G. Patel Institute Of Technology RNGPIT', shortName: 'R.N.G.', city: 'Gujarat', zone: '5', itype: 'SFI' },
  { code: '085', name: 'HJD Institute Of Technical Education And Research, Kera', shortName: 'HJD', city: 'Kera', zone: '6', itype: 'SFI' },
  { code: '086', name: 'Laxmi Institute Of Technology, Sarigam', shortName: 'Laxmi', city: 'Sarigam', zone: '5', itype: 'SFI' },
  { code: '088', name: 'Samarth College Of Engineering And Technology, Himmatnagar', shortName: 'Samarth', city: 'Himmatnagar', zone: '2', itype: 'SFI' },
  { code: '089', name: 'Shri Labhubhai Trivedi Institute Of Engineering & Technology', shortName: 'Shri', city: 'Gujarat', zone: '4', itype: 'SFI' },
  { code: '090', name: 'Tatva Institute Of Technological Studies, Modasa', shortName: 'Tatva', city: 'Modasa', zone: '2', itype: 'SFI' },
  { code: '091', name: 'Shri Satsangi Saketdham "Ram Ashram" Group Of INSTITUTIONS.', shortName: 'Shri', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '092', name: 'Veerayatan Institute Of Engineering', shortName: 'Veerayatan', city: 'Gujarat', zone: '6', itype: 'SFI' },
  { code: '093', name: 'Arrdekta Institute Of Technology', shortName: 'Arrdekta', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '094', name: 'Vidhyadeep Institute Of Engineering And Technology', shortName: 'Vidhyadeep', city: 'Gujarat', zone: '5', itype: 'SFI' },
  { code: '096', name: 'Arun Muchhala Engineering College, Dhari, Dist: Amreli', shortName: 'Arun', city: 'Amreli', zone: '4', itype: 'SFI' },
  { code: '099', name: 'Shroff S R Rotary Institute Of Chemical Technology, At & Po: Vataria, Bharuch', shortName: 'Shroff', city: 'Bharuch', zone: '5', itype: 'SFI' },
  { code: '100', name: 'Sigma Engineering College, Matar', shortName: 'Sigma', city: 'Matar', zone: '5', itype: 'SFI' },
  { code: '101', name: 'Ipcowala Institute Of Engineering & Technology', shortName: 'Ipcowala', city: 'Gujarat', zone: '3', itype: 'SFI' },
  { code: '102', name: 'Om Engineering College', shortName: 'Om', city: 'Gujarat', zone: '4', itype: 'SFI' },
  { code: '103', name: 'Om Institute Of Technology', shortName: 'Om', city: 'Gujarat', zone: '3', itype: 'SFI' },
  { code: '104', name: 'Gujarat Technological University - Institute Of Technology & Research', shortName: 'Gujarat', city: 'Gujarat', zone: '2', itype: 'PPP' },
  { code: '107', name: 'Shri J.M. Sabva Institute Of Engineering & TECHNOLOGY-BOTAD,DIST. Bhavnagar', shortName: 'Shri', city: 'Bhavnagar', zone: '1', itype: 'SFI' },
  { code: '108', name: 'Amiraj College Of Engineering & Technology', shortName: 'Amiraj', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '109', name: 'Noble Star Engineering College', shortName: 'Noble', city: 'Gujarat', zone: '4', itype: 'SFI' },
  { code: '110', name: 'GIDC Degree Engineering College', shortName: 'GIDC', city: 'Gujarat', zone: '5', itype: 'PPP' },
  { code: '112', name: 'Pacific School Of Engineering', shortName: 'Pacific', city: 'Gujarat', zone: '5', itype: 'SFI' },
  { code: '113', name: 'SAL College Of Engineering', shortName: 'SAL', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '114', name: 'Shree Pandit Nathulalji Vyas Technical Campus', shortName: 'Shree', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '115', name: 'Swaminarayan College Of Engineering & Technology', shortName: 'Swaminarayan', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '117', name: 'Neotech Institute Of Technology', shortName: 'Neotech', city: 'Gujarat', zone: '3', itype: 'SFI' },
  { code: '118', name: 'D.A. Degree Engineering & Technology', shortName: 'D.A.', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '121', name: 'Apollo Institute Of Engineering & Technology', shortName: 'Apollo', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '122', name: 'Aarya-veer College Of Engineering & Technology, Rajkot', shortName: 'Aarya-veer', city: 'Rajkot', zone: '4', itype: 'SFI' },
  { code: '123', name: 'S.S.AGRAWAL Institute Of Engineering & Technology', shortName: 'S.S.AGRAWAL', city: 'Gujarat', zone: '5', itype: 'SFI' },
  { code: '124', name: 'Sardar Patel College Of Engineering And Technology', shortName: 'Sardar', city: 'Gujarat', zone: '3', itype: 'SFI' },
  { code: '125', name: 'Shree Swaminarayan Institute Of Technology', shortName: 'Shree', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '126', name: 'SAL Engineering & Technical Institute', shortName: 'SAL', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '129', name: 'Gyanmanjari Institute Of Technology', shortName: 'Gyanmanjari', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '130', name: 'SMT. Shantaben Haribhai Gajera Engineering College', shortName: 'SMT.', city: 'Gujarat', zone: '4', itype: 'SFI' },
  { code: '131', name: 'Adani Institute Of Infrastructure Engineering', shortName: 'Adani', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '134', name: 'Prime Institute Of Engineering & Technology', shortName: 'Prime', city: 'Gujarat', zone: '5', itype: 'SFI' },
  { code: '135', name: 'Knowledge Institute Of Technology And Engineering', shortName: 'Knowledge', city: 'Gujarat', zone: '3', itype: 'SFI' },
  { code: '136', name: 'M.K. College Of Engineering & Technological Research', shortName: 'M.K.', city: 'Gujarat', zone: '2', itype: 'SFI' },
  { code: '137', name: 'Gujarat Technological University School Of Engineering And Technology', shortName: 'Gujarat', city: 'Gujarat', zone: '2', itype: 'GOV' },
  { code: '138', name: 'DR. V. R. Godhania College Of Engineering & Technology', shortName: 'DR.', city: 'Gujarat', zone: '4', itype: 'SFI' },
  { code: '142', name: 'Government Enginering College Daman', shortName: 'Government', city: 'Daman', zone: '5', itype: 'GOV' },
  { code: '143', name: 'New L J Institute Of Engineering And Technology', shortName: 'New', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '146', name: 'Shree Dhanvantary College Of Engineering & Technology', shortName: 'Shree', city: 'Gujarat', zone: '5', itype: 'SFI' },
  { code: '147', name: 'Shree Parekh Engineering College', shortName: 'Shree', city: 'Gujarat', zone: '4', itype: 'SFI' },
  { code: '148', name: 'Dalia Institute Of Technology', shortName: 'Dalia', city: 'Gujarat', zone: '1', itype: 'SFI' },
  { code: '149', name: 'Amrut Institute Junagadh', shortName: 'Amrut', city: 'Junagadh', zone: '4', itype: 'SFI' },
  { code: 'other', name: 'Other GTU Affiliated Engineering College', shortName: 'Other GTU', city: 'Gujarat', zone: '0', itype: 'Other' }
];

export const GTU_BE_BRANCHES: GTUBranch[] = [
  { code: '01', name: 'Aeronautical Engineering', shortName: 'Aero' },
  { code: '02', name: 'Automobile Engineering', shortName: 'Automobile' },
  { code: '03', name: 'Biomedical Engineering', shortName: 'Biomedical' },
  { code: '04', name: 'Bio-Technology', shortName: 'Biotech' },
  { code: '05', name: 'Chemical Engineering', shortName: 'Chemical' },
  { code: '06', name: 'Civil Engineering', shortName: 'Civil' },
  { code: '07', name: 'Computer Engineering', shortName: 'CE' },
  { code: '08', name: 'Electrical & Electronics Engineering', shortName: 'EEE' },
  { code: '09', name: 'Electrical Engineering', shortName: 'EE' },
  { code: '10', name: 'Electronics Engineering', shortName: 'Electronics' },
  { code: '11', name: 'Electronics & Communication Engineering', shortName: 'ECE' },
  { code: '12', name: 'Electronics & Telecommunication Engineering', shortName: 'ETC' },
  { code: '13', name: 'Environmental Engineering', shortName: 'Env' },
  { code: '14', name: 'Food Processing Technology', shortName: 'Food Tech' },
  { code: '15', name: 'Industrial Engineering', shortName: 'Industrial' },
  { code: '16', name: 'Information Technology', shortName: 'IT' },
  { code: '17', name: 'Instrumentation & Control Engineering', shortName: 'IC' },
  { code: '18', name: 'Marine Engineering', shortName: 'Marine' },
  { code: '19', name: 'Mechanical Engineering', shortName: 'Mechanical' },
  { code: '20', name: 'Mechatronics Engineering', shortName: 'Mechatronics' },
  { code: '21', name: 'Metallurgy Engineering', shortName: 'Metallurgy' },
  { code: '22', name: 'Mining Engineering', shortName: 'Mining' },
  { code: '23', name: 'Plastic Technology', shortName: 'Plastic Tech' },
  { code: '24', name: 'Power Electronics', shortName: 'Power Elec' },
  { code: '25', name: 'Production Engineering', shortName: 'Production' },
  { code: '26', name: 'Rubber Technology', shortName: 'Rubber Tech' },
  { code: '28', name: 'Textile Processing', shortName: 'Textile Proc' },
  { code: '29', name: 'Textile Technology', shortName: 'Textile Tech' },
  { code: '31', name: 'Computer Science & Engineering', shortName: 'CSE' },
  { code: '32', name: 'Information & Communication Technology', shortName: 'ICT' },
  { code: '34', name: 'Manufacturing Engineering', shortName: 'Mfg' },
  { code: '35', name: 'Environmental Science & Technology', shortName: 'EST' },
  { code: '36', name: 'Chemical Technology', shortName: 'Chem Tech' },
  { code: '37', name: 'Environmental Science And Engineering', shortName: 'ESE' },
  { code: '39', name: 'Nano Technology', shortName: 'Nano' },
  { code: '40', name: 'Civil & Infrastructure Engineering', shortName: 'CIE' },
  { code: '41', name: 'Robotics And Automation', shortName: 'Robotics' },
  { code: '42', name: 'Computer Science & Engineering (Artificial Intelligence And Machine Learning)', shortName: 'CSE (AI & ML)' },
  { code: '43', name: 'Artificial Intelligence And Data Science', shortName: 'AI & DS' },
  { code: '44', name: 'Chemical Engineering (Green Technology & Sustainability Engineering)', shortName: 'Chem (Green)' },
  { code: '45', name: 'Computer Science & Engineering (Internet Of Things And Cyber Security Including Block Chain Technology)', shortName: 'CSE (IoT & CS)' },
  { code: '46', name: 'Computer Science & Engineering (Data Science)', shortName: 'CSE (Data Science)' },
  { code: '47', name: 'Electronics & Instrumentation Engineering', shortName: 'E&I' },
  { code: '48', name: 'Computer Science & Engineering (Cyber Security)', shortName: 'CSE (Cyber)' },
  { code: '49', name: 'Computer Science & Design', shortName: 'CSD' },
  { code: '50', name: 'Smart & Sustainable Energy', shortName: 'Energy' },
  { code: '51', name: 'Food Engineering & Technology', shortName: 'Food Eng' },
  { code: '52', name: 'Artificial Intelligence And Machine Learning', shortName: 'AI & ML' },
  { code: '53', name: 'Plastics Engineering', shortName: 'Plastics Eng' },
  { code: '54', name: 'Electronics And Communication (Communication System Engineering)', shortName: 'EC (Comm)' },
  { code: '89', name: 'Mechanical Engineering', shortName: 'Mech' },
  { code: 'AA', name: 'Minor/honors -Industrial Process Safety', shortName: 'Minor/honors -Industrial' },
  { code: 'AB', name: 'Minor/honors -Waste Technology', shortName: 'Minor/honors -Waste' },
  { code: 'AC', name: 'Minor/honors -Construction Technology', shortName: 'Minor/honors -Construction' },
  { code: 'AD', name: 'Minor/honors -Next Generation Smart Village', shortName: 'Minor/honors -Next' },
  { code: 'AE', name: 'Minor/honors -Infrastructure Engineering', shortName: 'Minor/honors -Infrastructure' },
  { code: 'AF', name: 'Minor/honors -Smart Cities', shortName: 'Minor/honors -Smart' },
  { code: 'AG', name: 'Minor/honors -Artificial Intelligence & Machine Learning', shortName: 'Minor/honors -Artificial' },
  { code: 'AH', name: 'Minor/honors -Cyber Security', shortName: 'Minor/honors -Cyber' },
  { code: 'AI', name: 'Minor/honors -Internet Of Things', shortName: 'Minor/honors -Internet' },
  { code: 'AJ', name: 'Minor/honors - Solar Energy Systems', shortName: 'Minor/honors -' },
  { code: 'AK', name: 'Minor/honors -Electrical And Computer', shortName: 'Minor/honors -Electrical' },
  { code: 'AL', name: 'Minor/honors -Electric Vehicles', shortName: 'Minor/honors -Electric' },
  { code: 'AM', name: 'Minor/honors -Control Systems And Sensors Technology', shortName: 'Minor/honors -Control' },
  { code: 'AN', name: 'Minor/honors -3 D Printing', shortName: 'Minor/honors -3' },
  { code: 'AO', name: 'Minor/honors -Robotics', shortName: 'Minor/honors -Robotics' },
  { code: 'AP', name: 'Minor/honors -Energy Engineering', shortName: 'Minor/honors -Energy' },
  { code: 'AQ', name: 'Minor/honors - Global Citizenship Personality Development', shortName: 'Minor/honors -' },
  { code: 'AR', name: 'Minor/honours-Industrial Based Non Destructive Techniques And Practices', shortName: 'Minor/honours-Industrial Based' },
  { code: 'AS', name: 'Minor/honours-Green Technology And Sustainability Engineering', shortName: 'Minor/honours-Green Technology' },
  { code: 'AT', name: 'Minor/honours-Data Science', shortName: 'Minor/honours-Data Science' },
  { code: 'AU', name: 'Minor/honours-Forensic Structural Engineering', shortName: 'Minor/honours-Forensic Structural' },
  { code: 'AV', name: 'Minor/honours-Computer Aided Civil Engineering Processes', shortName: 'Minor/honours-Computer Aided' },
  { code: 'IAA', name: 'Industry-Minor/hons.-Electric Vehicles', shortName: 'Industry-Minor/hons.-Electric Vehicles' },
  { code: 'IAB', name: 'Industry-Minor/hons.-Advanced Practices In Construction', shortName: 'Industry-Minor/hons.-Advanced Practices' },
  { code: 'IAC', name: 'Industry-Minor/hons.-Integrated Building System Design', shortName: 'Industry-Minor/hons.-Integrated Building' },
  { code: 'IAD', name: 'Industry-Minor/hons.-Multi-Modal Transportation Infrastructure', shortName: 'Industry-Minor/hons.-Multi-Modal Transportation' },
  { code: 'IAE', name: 'Industry-Minor/hons.-Artificial Intelligence Techniques And Machine Learning Algorithms', shortName: 'Industry-Minor/hons.-Artificial Intelligence' },
  { code: 'IAF', name: 'Industry-Minor/hons.-Cyber Security', shortName: 'Industry-Minor/hons.-Cyber Security' },
  { code: 'IAG', name: 'Industry-Minor/hons.-Applied Data Science With Python', shortName: 'Industry-Minor/hons.-Applied Data' },
  { code: 'IAH', name: 'Industry-Minor/hons.-Full Stack Web Development', shortName: 'Industry-Minor/hons.-Full Stack' },
  { code: 'IAI', name: 'Industry-Minor/hons.-Artificial Intelligence And Machine Learning', shortName: 'Industry-Minor/hons.-Artificial Intelligence' },
  { code: 'IAJ', name: 'Industry-Minor/hons.-Data Science', shortName: 'Industry-Minor/hons.-Data Science' },
  { code: 'IAK', name: 'Industry-Minor/hons.-Data Engineering', shortName: 'Industry-Minor/hons.-Data Engineering' },
  { code: 'IAL', name: 'Industry-Minor/hons.-Cloud Computing', shortName: 'Industry-Minor/hons.-Cloud Computing' },
  { code: 'IAM', name: 'Industry-Minor/hons.-Cyber Security', shortName: 'Industry-Minor/hons.-Cyber Security' },
  { code: 'IAN', name: 'Industry-Minor/hons.-Artificial Intelligence & Machine Learning', shortName: 'Industry-Minor/hons.-Artificial Intelligence' },
  { code: 'IAO', name: 'Industry-Minor/hons.-GEN AI Specialist', shortName: 'Industry-Minor/hons.-GEN AI' },
  { code: 'IAP', name: 'Industry-Minor/hons.-Full Stack JAVA Specialization', shortName: 'Industry-Minor/hons.-Full Stack' },
  { code: 'IAQ', name: 'Industry-Minor/hons.-Cyber Security', shortName: 'Industry-Minor/hons.-Cyber Security' },
  { code: 'IAR', name: 'Industry-Minor/hons.-Data Science', shortName: 'Industry-Minor/hons.-Data Science' },
  { code: 'IAS', name: 'Industry-Minor/hons.-Microsoft Cloud & AI Honors', shortName: 'Industry-Minor/hons.-Microsoft Cloud' },
  { code: 'IAT', name: 'Industry-Minor/hons.-Electric Vehicle', shortName: 'Industry-Minor/hons.-Electric Vehicle' },
  { code: 'IAU', name: 'Industry-Minor/hons.-Industrial Robotics(tata IIS)', shortName: 'Industry-Minor/hons.-Industrial Robotics(tata' },
  { code: 'IAV', name: 'Industry-Minor/hons.-Industrial Additive Manufacturing(tata IIS)', shortName: 'Industry-Minor/hons.-Industrial Additive' },
  { code: 'NA', name: 'Army', shortName: 'Army' },
  { code: 'NB', name: 'Air Force', shortName: 'Air Force' },
  { code: 'NC', name: 'Navy', shortName: 'Navy' },
  { code: 'other', name: 'Other BE Branch', shortName: 'Other' }
];
