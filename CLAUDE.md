<project_background>
read @README.md to understand user's vision
</project_background>

<package_tool>

Use Bun instead of Node.js, npm, pnpm, or vite.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

</package_tool>

<docs_index>

## Local docs -- read them when you're unsure

When you lack confidence about an API, a pattern, or a detail in this project, check the docs below before guessing. Vito put them here for a reason.

| Doc | Path | What it covers |
|-----|------|----------------|
| Anthropic API | `docs/anthropic_api.md` | Messages API reference -- params, streaming, tool use, response structure |

</docs_index>

<testing>

## Testing philosophy

- Tests are required to verify work is done. After implementation, write tests and run `bun test` to prove it works.
- Only test the happy path. Don't test error cases, edge cases, or compatibility -- this is a personal project with one user.
- All test files go in `tests/` directory: `tests/foo.test.ts`.
- Keep tests minimal: one `describe`, fewest assertions that prove the feature works.
- Integration tests (real API calls, real subprocess runs) are fine and preferred over mocks.

</testing>

<lessons>

## Process-level thinking

When writing code that manages OS resources (child processes, sockets, file handles), think at the **process** level, not just the function/class level. Ask: what does this object's lifecycle mean for the host process? A module-level singleton that spawns a subprocess is registering a handle on the event loop -- the process will never exit until that handle is gone.

Concrete rule: never spawn subprocesses or open persistent connections in a constructor or at module scope. Use lazy initialization. And for CLI tools, always ensure cleanup before exit.

## Test failure attribution

When a test fails after your changes, **assume you caused it** until proven otherwise. Don't theorize about environment issues or "pre-existing problems" without first verifying. Cheapest check: revert your changes and see if the test passes. If you skipped that step, your attribution is a guess, not a diagnosis.

</lessons>
