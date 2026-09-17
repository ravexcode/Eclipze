## Development Rules

### DO

- Ask for clarification whenever requirements are ambiguous. Never make assumptions.
- Follow the workflow: **Plan → Build → Verify**.
- Write readable, maintainable code:
  - Use meaningful names.
  - Keep functions and components focused.
  - Prefer small, understandable blocks over dense one-line implementations.
- Follow the existing dashboard architecture:
  - Server `layout.tsx` authentication guard.
  - `DashLayout`.
  - `Heading`.
- Reuse existing UI components, design tokens, and theme variables.
- Place code in the appropriate location:
  - `src/utils/` → pure utilities.
  - `src/lib/` → server-only logic.
  - `src/types/` → shared types.
- Keep Settings sections reusable and self-contained.
- Keep provider credential handling strictly server-side.

---

### DON'T

- **Never** read, modify, delete, or commit `.env` files or any of their variants. Only use `.env.example` as reference.
- **Never** create commits. Leave version control decisions to the developer.
- **Never** implement features or code that were not explicitly requested.
- **Never** install new packages unless explicitly required.
- **Never** hardcode new colors or design values when existing theme tokens are available.
- **Never** implement a simulated ChatGPT subscription connection.
- **Never** persist provider credentials that have not successfully passed server-side validation.
