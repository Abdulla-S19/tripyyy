/**
 * Incrementally scans streamed itinerary JSON and returns each object in the top-level
 * `"days": [...]` array as soon as its closing brace arrives.
 */
export class DayExtractor {
  private buf = "";
  private pos = -1;
  private depth = 0;
  private inString = false;
  private escaped = false;
  private start = -1;
  private finished = false;

  push(chunk: string): unknown[] {
    this.buf += chunk;
    const out: unknown[] = [];
    if (this.finished) return out;
    if (this.pos < 0) {
      const m = /"days"\s*:\s*\[/.exec(this.buf);
      if (!m) return out;
      this.pos = m.index + m[0].length;
    }
    for (; this.pos < this.buf.length; this.pos++) {
      const ch = this.buf[this.pos];
      if (this.inString) {
        if (this.escaped) this.escaped = false;
        else if (ch === "\\") this.escaped = true;
        else if (ch === '"') this.inString = false;
        continue;
      }
      if (ch === '"') {
        this.inString = true;
      } else if (ch === "{" || ch === "[") {
        if (this.depth === 0 && ch === "{") this.start = this.pos;
        this.depth++;
      } else if (ch === "}" || ch === "]") {
        if (this.depth === 0) {
          this.finished = true;
          break;
        }
        this.depth--;
        if (this.depth === 0 && ch === "}" && this.start >= 0) {
          try {
            out.push(JSON.parse(this.buf.slice(this.start, this.pos + 1)));
          } catch {
            // malformed fragment — the full response is validated at the end anyway
          }
          this.start = -1;
        }
      }
    }
    return out;
  }
}
