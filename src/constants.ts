
import { PaperType, PYQ, Department, Note, Announcement } from './types';

export const DEPARTMENTS: Department[] = [
  { id: 'cse', name: 'Computer', code: '07', color: 'bg-blue-100 text-blue-700', iconName: 'Code' },
  { id: 'it', name: 'Information Technology', code: '16', color: 'bg-indigo-100 text-indigo-700', iconName: 'Monitor' },
  { id: 'ee', name: 'Electrical', code: '09', color: 'bg-yellow-100 text-yellow-700', iconName: 'Zap' },
  { id: 'ece', name: 'Electronics and communication', code: '11', color: 'bg-pink-100 text-pink-700', iconName: 'Cpu' },
  { id: 'me', name: 'Mechanical', code: '19', color: 'bg-orange-100 text-orange-700', iconName: 'Settings' },
  { id: 'ce', name: 'Civil', code: '06', color: 'bg-emerald-100 text-emerald-700', iconName: 'HardHat' },
];

export const SEMESTERS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function formatSemester(sem: number | string): string {
  const num = Number(sem);
  if (num === 0) return "1/2-common";
  return String(num);
}

export const ANNOUNCEMENTS: Announcement[] = [];

export const PYQS: PYQ[] = [];

export const NOTES: Note[] = [];

export const PENDING_SUBMISSIONS: (PYQ | Note)[] = [];

export const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];