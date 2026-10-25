import { PILOT_TOPICS } from './generate-pilot-content';

console.log("Checking Pilot Topics Metadata:");
PILOT_TOPICS.forEach((topic, i) => {
  console.log(`Topic ${i + 1}:`, {
    topic: topic.payload.topic,
    unitNo: topic.params.unitNo,
    semester: topic.params.semester,
    branch: topic.params.branch,
    university: topic.params.university
  });
});
