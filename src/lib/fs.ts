/** Directory portion of a POSIX path (the app runs on macOS/Linux). */
function dirname(path: string): string {
  const slash = path.lastIndexOf("/");
  if (slash === -1) return ".";
  if (slash === 0) return "/";
  return path.slice(0, slash);
}

/**
 * Writes text to `path` atomically: write a sibling temp file, then rename it
 * over the target. Because the temp file lives in the same directory, the
 * rename stays on one filesystem and is atomic — a concurrent reader (or a
 * process killed mid-write) sees either the whole old file or the whole new
 * one, never a truncated mix. The parent directory is created if needed.
 */
export async function writeTextFileAtomic(
  path: string,
  data: string,
): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${crypto.randomUUID()}.tmp`;
  try {
    await Deno.writeTextFile(tmp, data);
    await Deno.rename(tmp, path);
  } catch (error) {
    // Best-effort cleanup so a failed write never leaves a stray temp file.
    await Deno.remove(tmp).catch(() => {});
    throw error;
  }
}
