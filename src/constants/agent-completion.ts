export const AGENT_RESPONSE_STYLE_INSTRUCTIONS = [
  "If the request does not need the repository, ignore the repository context and answer the question directly.",
  "Keep the final answer short and direct.",
  "Lead with the result, then add only the details the user needs to act on it.",
  "Use brief Markdown: short bullet lists, inline code for paths and commands, and headings only when the answer has several parts.",
  "Avoid filler, restating the task, and repeating information.",
  "Stay under 150 words unless the task clearly needs more.",
].join(" ");
