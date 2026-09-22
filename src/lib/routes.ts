export function controlWorkspaceHref(assessmentId: string, controlId: string): string {
  return `/evaluations/${assessmentId}/controles/${encodeURIComponent(controlId)}`;
}
