export class BashSession {
  private static readonly MARKER = "___BASH_DONE___";

  private proc: ReturnType<typeof Bun.spawn> | null = null;
  private queue: Promise<string> = Promise.resolve("");
  private timeoutMs: number;

  constructor(timeoutMs = 120_000) {
    this.timeoutMs = timeoutMs;
  }

  private spawn(): void {
    this.proc = Bun.spawn(["/bin/bash"], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "inherit",
    });
  }

  close(): void {
    if (!this.proc) return;
    try { this.proc.stdin?.end(); } catch {}
    try { (this.proc.stdout as ReadableStream | null)?.cancel(); } catch {}
    this.proc.kill();
    this.proc = null;
  }

  restart(): void {
    this.close();
    this.spawn();
  }

  run(command: string): Promise<string> {
    this.queue = this.queue.then(() => this._run(command), () => this._run(command));
    return this.queue;
  }

  private async _run(command: string): Promise<string> {
    if (!this.proc) this.spawn();

    const proc = this.proc!;
    const marker = `${BashSession.MARKER}_${Date.now()}`;
    const fullCommand = `{ ${command}\n} 2>&1\necho "${marker} $?"\n`;

    proc.stdin!.write(fullCommand);
    await proc.stdin!.flush();

    const stdoutReader = proc.stdout!.getReader();
    const decoder = new TextDecoder();
    let output = "";

    let timedOut = false;

    const readLoop = async () => {
      while (true) {
        const { value, done } = await stdoutReader.read();
        if (done) break;
        output += decoder.decode(value);
        if (output.includes(marker)) break;
      }
    };

    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => { timedOut = true; resolve(); }, this.timeoutMs)
    );

    await Promise.race([readLoop(), timeout]);

    stdoutReader.releaseLock();

    if (timedOut) {
      this.restart();
      return "[timeout] Command exceeded 120 seconds";
    }

    const markerRegex = new RegExp(`${marker} (\\d+)\\n?`);
    const match = output.match(markerRegex);
    const exitCode = match ? parseInt(match[1], 10) : 0;
    output = output.replace(markerRegex, "");

    return exitCode !== 0 ? `[exit code: ${exitCode}]\n${output}` : output;
  }
}
