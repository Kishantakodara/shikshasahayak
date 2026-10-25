import { MaterialTypeKey } from '../content/browse';

export const encodeSemesterSlug = (sem: number | string) => {
  return Number(sem) === 0 ? '1-or-2-common' : String(sem);
};

export const decodeSemesterSlug = (slug: string) => {
  return slug === '1-or-2-common' ? 0 : Number(slug);
};

export const browsePaths = {
  hub: () => '/resources',
  typeAbout: (type: MaterialTypeKey) => `/resources/${type}`,
  departments: (type: MaterialTypeKey) => `/resources/${type}/departments`,
  branch: (type: MaterialTypeKey, branchSlug: string) => `/resources/${type}/${branchSlug}`,
  semester: (type: MaterialTypeKey, branchSlug: string, sem: number) =>
    `/resources/${type}/${branchSlug}/semester/${encodeSemesterSlug(sem)}`,
  subject: (
    type: MaterialTypeKey,
    branchSlug: string,
    sem: number,
    subjectSlug: string
  ) => `/resources/${type}/${branchSlug}/semester/${encodeSemesterSlug(sem)}/${subjectSlug}`,
  session: (
    type: MaterialTypeKey,
    branchSlug: string,
    sem: number,
    subjectSlug: string,
    sessionCode: string
  ) =>
    `/resources/${type}/${branchSlug}/semester/${encodeSemesterSlug(sem)}/${subjectSlug}/${sessionCode}`,
  material: (id: string) => `/materials/${id}`,
};
