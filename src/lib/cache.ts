import { writeTextFileAtomic } from "./fs.ts";

const CACHE_DIR = ".cache";

interface JsonCacheOptions<T> {
  directory?: string;
  isValid?: (value: unknown) => value is T;
}

export class JsonCache<T> {
  private path: string;
  private isValid: (value: unknown) => value is T;

  constructor(filename: string, options: JsonCacheOptions<T> = {}) {
    this.path = `${options.directory ?? CACHE_DIR}/${filename}`;
    this.isValid = options.isValid ?? ((_value): _value is T => true);
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
      const parsed: unknown = JSON.parse(text);
      if (
        typeof parsed !== "object" || parsed === null || Array.isArray(parsed)
      ) {
        console.warn(`Ignoring invalid cache ${this.path}; rebuilding.`);
        return new Map();
      }

      const entries = Object.entries(parsed).filter(([, value]) =>
        this.isValid(value)
      ) as [string, T][];
      if (entries.length !== Object.keys(parsed).length) {
        console.warn(`Ignoring invalid entries in cache ${this.path}.`);
      }
      return new Map(entries);
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
    const missing = [...new Set(keys)].filter((k) => !cached.has(k));

    if (missing.length > 0) {
      const fetched = await fetchMissing(missing);
      for (const [k, v] of fetched) {
        if (this.isValid(v)) cached.set(k, v);
      }
      await this.save(cached);
    }

    return cached;
  }
}
