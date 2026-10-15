export type MentionableAgent = {
  id: string;
  name: string;
  defaultModel: string;
};

const TRAILING_MENTION_PATTERN = /(?:^|\s)@([\w-]*)$/;
const MENTION_PATTERN = /(?:^|\s)@([\w-]+)/g;

export function getAgentHandle(agentName: string) {
  return agentName.replace(/\s+/g, "");
}

export function getMentionQuery(value: string) {
  const match = TRAILING_MENTION_PATTERN.exec(value);
  return match ? match[1].toLowerCase() : null;
}

export function filterMentionableAgents(agents: MentionableAgent[], query: string) {
  return agents.filter(agent => getAgentHandle(agent.name).toLowerCase().startsWith(query));
}

export function insertAgentMention(value: string, agent: MentionableAgent) {
  const withoutQuery = value.replace(/@[\w-]*$/, "");
  return `${withoutQuery}@${getAgentHandle(agent.name)} `;
}

export function findMentionedAgent(prompt: string, agents: MentionableAgent[]) {
  for (const match of prompt.matchAll(MENTION_PATTERN)) {
    const handle = match[1].toLowerCase();
    const agent = agents.find(item => getAgentHandle(item.name).toLowerCase() === handle);

    if (agent) return agent;
  }

  return null;
}

export function stripAgentMention(prompt: string, agent: MentionableAgent) {
  const handle = getAgentHandle(agent.name);
  const mentionPattern = new RegExp(`(^|\\s)@${handle}(?=\\s|$)`, "i");
  const stripped = prompt.replace(mentionPattern, "$1").replace(/\s{2,}/g, " ").trim();

  return stripped || prompt.trim();
}
