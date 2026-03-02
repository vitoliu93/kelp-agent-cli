export class BashSession {
  private static readonly MARKER = "___BASH_DONE___";

  private proc: ReturnType<typeof Bun.spawn> | null = null;

  private spawn(): void {
    this.proc = Bun.spawn(["/bin/bash"], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    });
  }

  close(): void {
    if (!this.proc) return;
    this.proc.kill();
    this.proc = null;
  }

  restart(): void {
    this.close();
    this.spawn();
  }

  async run(command: string): Promise<string> {
    if (!this.proc) this.spawn();

    const proc = this.proc!;
    const marker = `${BashSession.MARKER}_${Date.now()}`;
    const fullCommand = `${command}\necho "${marker}"\n`;

    proc.stdin!.write(fullCommand);
    await proc.stdin!.flush();

    const stdoutReader = proc.stdout!.getReader();
    const stderrReader = proc.stderr!.getReader();
    const decoder = new TextDecoder();
    let output = "";

    while (true) {
      const { value, done } = await stdoutReader.read();
      if (done) break;

      output += decoder.decode(value);
      if (output.includes(marker)) break;
    }

    stdoutReader.releaseLock();
    stderrReader.releaseLock();

    output = output.replace(new RegExp(`.*${marker}.*\n?`), "");

    const lines = output.split("\n");
    if (lines.length > 100) {
      return lines.slice(0, 100).join("\n") + "\n...[truncated]";
    }

    return output;
  }
}
