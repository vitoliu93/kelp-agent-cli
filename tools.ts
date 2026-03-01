class BashSession {
  private proc: ReturnType<typeof Bun.spawn> | null = null;
  private static MARKER = "___BASH_DONE___";

  private spawn() {
    this.proc = Bun.spawn(["/bin/bash"], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    });
  }

  close() {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
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

    let output = "";
    const decoder = new TextDecoder();

    // Read stdout until marker appears
    outer: while (true) {
      const { value, done } = await stdoutReader.read();
      if (done) break;
      output += decoder.decode(value);
      if (output.includes(marker)) break outer;
    }

    stdoutReader.releaseLock();
    stderrReader.releaseLock();

    // Strip the marker line
    output = output.replace(new RegExp(`.*${marker}.*\n?`), "");

    const lines = output.split("\n");
    if (lines.length > 100) {
      output = lines.slice(0, 100).join("\n") + "\n...[truncated]";
    }

    return output;
  }

  restart() {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
    this.spawn();
  }
}

export const bashSession = new BashSession();

export async function executeTool(
  name: string,
  input: Record<string, unknown> = {}
): Promise<string> {
  switch (name) {
    case "tell_secret":
      return "vito 是一个帅哥，他住在上海";
    case "bash": {
      const command = input.command as string;
      return bashSession.run(command);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
