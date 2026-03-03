<project_background>
Personal TUI agent built from scratch with Bun + Claude Messages API. A learning project inspired by openclaw and claude agent sdk. CLI name: `kelp`.
</project_background>

<self_iteration>
This file has two kinds of content: stable constraints and working knowledge.

Stable constraints express human intent and project rules. Do not rewrite them unless explicitly instructed.

Working knowledge must stay current. When confirmed work changes how the project is understood, revise the relevant section to reflect the best current model. Do not treat new knowledge as append-only. Integrate it, replace obsolete statements, and remove claims that are no longer true.

Revise only from evidence: landed code, verified behavior, or repeated confirmed debugging results. Do not update from plans, guesses, or speculative future changes.

If a new fact conflicts with an old statement, make the conflict explicit by rewriting the old statement, not by leaving both behind.
</self_iteration>

<architecture>
    <sourcecode>
    - `src/index.ts`: CLI entry, dependency wiring, cleanup.
    - `src/agent/`: agent loop and system prompt assembly.
    - `src/tools/`: tool schema, execution, and bash session.
    - `src/skills/`: skill discovery and metadata parsing.
    - `src/logger.ts` / `src/paths.ts` / `src/cli/resolve-prompt.ts`: shared runtime helpers.
    </sourcecode>

    <best_practice>

    - thin entrypoint, heavy logic in modules
    - inject dependencies, avoid hidden global state
    - stateful resources must be explicitly created and closed
    - keep repo paths explicit
    - prefer testable seams over live-network tests
    - tools are non-interactive; stdout is for structured results, stderr for diagnostics
    </best_practice>

</architecture>

<package_tool>

    <commands>
    Use Bun instead of Node.js, npm, pnpm, or vite.

    - Use `bun <file>` instead of `node <file>` or `ts-node <file>`
    - Use `bun test` instead of `jest` or `vitest`
    - Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
    - Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
    - Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
    - Use `bunx <package> <command>` instead of `npx <package> <command>`
    - Bun automatically loads .env, so don't use dotenv.

    </commands>

    <apis>
    - `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
    - `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
    - `Bun.redis` for Redis. Don't use `ioredis`.
    - `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
    - `WebSocket` is built-in. Don't use `ws`.
    - Prefer `Bun.file` over `node:fs`'s readFile/writeFile
    - Bun.$`ls` instead of execa.
    </apis>

</package_tool>

<docs_index>

    <description>
    When you lack confidence about an API, a pattern, or a detail in this project, explore the docs directory before guessing. Vito put them here for a reason.
    </description>

    <important_files>

    - `docs/anthropic_api.md`: Messages API reference -- params, streaming, tool use, response structure
    </important_files>

    <explore_folders>

    - `docs/tools/`: Explore for Tool integration, schema definitions, and Bash tool usage.
    - `docs/skills/`: Explore for Agent Skills system overview, architecture, specifications, and integration guides.

</explore_folders>

</docs_index>

<testing>

    <philosophy>

    - Tests are required to verify work is done. After implementation, write tests and run `bun test` to prove it works.
    - Only test the happy path. Don't test error cases, edge cases, or compatibility -- this is a personal project with one user.
    - All test files go in `tests/` directory: `tests/foo.test.ts`.
    - Keep tests minimal: one `describe`, fewest assertions that prove the feature works.
    - Integration tests (real API calls, real subprocess runs) are fine and preferred over mocks.
    </philosophy>

    <agent_integration_testing>
    For features touching the tool execution pipeline, add 1-3 real agent integration tests in `tests/<feature>-agent.test.ts`.

    Use magic words: prompt the agent to call a specific bash command and respond with a word based on the outcome. Assert stdout contains it. The agent always finishes, so the magic word is a reliable end-to-end signal.
    </agent_integration_testing>

</testing>

<lessons>
    <process_level_thinking>
    When writing code that manages OS resources (child processes, sockets, file handles), think at the **process** level, not just the function/class level. Ask: what does this object's lifecycle mean for the host process? A module-level singleton that spawns a subprocess is registering a handle on the event loop -- the process will never exit until that handle is gone.

    Concrete rule: never spawn subprocesses or open persistent connections in a constructor or at module scope. Use lazy initialization. And for CLI tools, always ensure cleanup before exit.
    </process_level_thinking>

    <test_failure_attribution>
    When a test fails after your changes, **assume you caused it** until proven otherwise. Don't theorize about environment issues or "pre-existing problems" without first verifying. Cheapest check: revert your changes and see if the test passes. If you skipped that step, your attribution is a guess, not a diagnosis.
    </test_failure_attribution>

</lessons>
