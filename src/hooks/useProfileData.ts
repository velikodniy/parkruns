import { useEffect, useState } from "react";
import { type Profile, ProfileSchema } from "../types.ts";

interface UseProfileDataResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useProfileData(): UseProfileDataResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const parsed = ProfileSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Invalid data: ${parsed.error.message}`);
        }
        setProfile(parsed.data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { profile, loading, error };
}
