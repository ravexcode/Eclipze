import type {
  AgentSkillSelection,
  WorkspaceSkill,
} from "@/types/agent-runner";

const SKILL_CATALOG: readonly WorkspaceSkill[] = [
  {
    slug: "review-code",
    version: "1.0.0",
    name: "Review code",
    description: "Find correctness, security, and maintainability risks.",
    instruction:
      "Review changed code for correctness, security, maintainability, and missing tests. Report evidence and do not modify files.",
  },
  {
    slug: "fix-bug",
    version: "1.0.0",
    name: "Fix bug",
    description: "Trace one bug, apply a focused fix, and explain the change.",
    instruction:
      "Trace the reported bug to its root cause. Apply the smallest safe fix. Preserve unrelated work and report changed files.",
  },
  {
    slug: "run-tests",
    version: "1.0.0",
    name: "Run tests",
    description: "Select a safe project check and summarize its result.",
    instruction:
      "Run only the repository checks approved by the server. Capture concise results and never expose environment secrets.",
  },
  {
    slug: "refactor",
    version: "1.0.0",
    name: "Refactor",
    description: "Improve structure without changing observable behavior.",
    instruction:
      "Refactor for clear names, small responsibilities, and preserved behavior. Avoid broad rewrites and unrelated formatting changes.",
  },
];

export function listWorkspaceSkills() {
  return SKILL_CATALOG.map(skill => ({
    slug: skill.slug,
    version: skill.version,
    name: skill.name,
    description: skill.description,
  }));
}

export function getWorkspaceSkill(slug: string) {
  return SKILL_CATALOG.find(skill => skill.slug === slug) ?? null;
}

export function resolveSkillSnapshot(
  requestedSlugs: unknown,
  selectedSkills: AgentSkillSelection[],
) {
  const slugs = Array.isArray(requestedSlugs)
    ? requestedSlugs.filter((slug): slug is string => typeof slug === "string")
    : selectedSkills.map(skill => skill.slug);

  const uniqueSlugs = [...new Set(slugs)];
  const skills = uniqueSlugs.map(getWorkspaceSkill);

  if (skills.some(skill => !skill)) {
    return { error: "One or more skills are not available." } as const;
  }

  return {
    skills: skills.filter((skill): skill is WorkspaceSkill => Boolean(skill)),
  } as const;
}

export function buildSkillInstructions(skills: WorkspaceSkill[]) {
  return skills.map(skill => `[${skill.name} v${skill.version}] ${skill.instruction}`).join("\n");
}
