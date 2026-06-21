import { writeTextFileAtomic } from "./fs.ts";

const CACHE_DIR = ".cache";

export class JsonCache<T> {
  private path: string;

  constructor(filename: string) {
    this.path = `${CACHE_DIR}/${filename}`;
  }

  async load(): Promise<Map<string, T>> {
    let text: string;
    try {
      text = await Deno.readTextFile(this.path);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) return new Map();
      throw e;
    }

    try {
      return new Map(Object.entries(JSON.parse(text)));
    } catch (e) {
      // A corrupt cache shouldn't poison every future run — drop it and
      // rebuild. Atomic saves make this near-impossible going forward.
      if (e instanceof SyntaxError) {
        console.warn(`Ignoring corrupt cache ${this.path}; rebuilding.`);
        return new Map();
      }
      throw e;
    }
  }

  async save(data: Map<string, T>): Promise<void> {
    const obj = Object.fromEntries(data);
    await writeTextFileAtomic(this.path, JSON.stringify(obj, null, 2) + "\n");
  }

  async resolve(
    keys: string[],
    fetchMissing: (keys: string[]) => Promise<Map<string, T>>,
  ): Promise<Map<string, T>> {
    const cached = await this.load();
    const missing = keys.filter((k) => !cached.has(k));

    if (missing.length > 0) {
      const fetched = await fetchMissing(missing);
      for (const [k, v] of fetched) cached.set(k, v);
      await this.save(cached);
    }

    return cached;
  }
}
