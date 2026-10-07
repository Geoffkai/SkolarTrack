// The application pipeline, in order. The keys are the exact values the database allows
// (applications.status CHECK constraint); everything else is how each stage is presented.
// Shared by the student's tracker and the admin's applicant list so they always match.
export const STAGES = [
  {
    key: "interested",
    label: "Interested",
    text: "text-muted",
    bar: "border-l-muted",
  },
  {
    key: "applied",
    label: "Applied",
    text: "text-primary",
    bar: "border-l-primary",
  },
  {
    key: "interview",
    label: "Interview",
    text: "text-amount",
    bar: "border-l-amount",
  },
  {
    key: "result",
    label: "Result",
    text: "text-success",
    bar: "border-l-success",
  },
];

export function stageFor(key) {
  return STAGES.find((stage) => stage.key === key) ?? STAGES[0];
}
