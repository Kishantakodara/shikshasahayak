import { PILOT_TOPICS } from './generate-pilot-content';
import { formatPayloadToMarkdown } from '../functions/lib/content-factory/provider';
import { validateGeneratedContent } from '../functions/lib/content-factory/validator';

export function getPilotSeedData() {
  const subject = {
    id: 'sub_cn_sem5',
    university_id: 'univ_default',
    branch_id: 'branch_computer',
    semester: 5,
    name: 'Computer Networks',
    code: '3150710',
    slug: 'computer-networks',
    wef_year: '2022-23'
  };

  const items = PILOT_TOPICS.map((item, idx) => {
    const docId = `doc_pilot_cn_${idx + 1}`;
    const cfId = `cf_pilot_cn_${idx + 1}`;
    const validation = validateGeneratedContent(item.payload, item.params);
    const markdown = formatPayloadToMarkdown(item.payload, item.params);

    return {
      docId,
      cfId,
      subjectId: subject.id,
      universityId: 'univ_default',
      branchId: 'branch_computer',
      semester: 5,
      unitNo: item.params.unitNo,
      topic: item.payload.topic,
      title: `${item.payload.topic} — Complete Revision Notes & Question Bank`,
      description: `Authoritative GTU study material for ${item.payload.topic} (Unit ${item.params.unitNo})`,
      markdown,
      payload: item.payload,
      validation
    };
  });

  return { subject, items };
}
