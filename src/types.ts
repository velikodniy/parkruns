import { z } from "zod";

export const AthleteSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  clubName: z.string().nullable(),
  homeRun: z.string().nullable(),
});

export const RunSchema = z.object({
  eventName: z.string(),
  eventId: z.number(),
  eventDate: z.string(),
  finishTime: z.string(),
  finishTimeSeconds: z.number(),
  position: z.number(),
  genderPosition: z.number(),
  ageGrade: z.number(),
  ageCategory: z.string(),
  wasPB: z.boolean(),
  runNumber: z.number(),
});

export const ProfileAthleteSchema = AthleteSchema.pick({
  id: true,
  clubName: true,
  homeRun: true,
}).extend({
  fullName: z.string(),
});

export const ProfileSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  athlete: ProfileAthleteSchema,
  runs: z.array(RunSchema),
});

/** Props shared by all chart components */
export interface ChartProps {
  runs: Run[];
  width?: number;
  height?: number;
}

export type Athlete = z.infer<typeof AthleteSchema>;
export type Run = z.infer<typeof RunSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
