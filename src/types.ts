import { z } from "zod";

export const AthleteSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  clubName: z.string().nullable(),
  homeRun: z.string().nullable(),
  homeRunShortName: z.string().nullable().optional(),
});

export const WeatherSchema = z.object({
  temperatureC: z.number(),
  weatherCode: z.number(),
  windSpeedMs: z.number(),
  windDirectionDeg: z.number(),
});

export const RunSchema = z.object({
  eventName: z.string().min(1),
  eventId: z.number().int().positive(),
  eventEdition: z.number().int().positive(),
  eventDate: z.string().datetime(),
  finishTime: z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/),
  finishTimeSeconds: z.number().int().positive(),
  position: z.number().int().positive(),
  totalFinishers: z.number().int().positive(),
  genderPosition: z.number().int().positive(),
  ageGrade: z.number().min(0).max(100),
  ageCategory: z.string().min(1),
  wasPb: z.boolean(),
  wasFirstVisit: z.boolean(),
  countryISO: z.string().nullable().optional(),
  eventUrl: z.string().nullable().optional(),
  resultsUrl: z.string().nullable().optional(),
  coordinates: z.tuple([z.number(), z.number()]).nullable().optional(),
  weather: WeatherSchema.nullable().optional(),
});

export const ProfileSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  athlete: z.object({
    id: z.number(),
    fullName: z.string(),
    clubName: z.string().nullable(),
    homeRun: z.string().nullable(),
    homeRunShortName: z.string().nullable().optional(),
  }),
  runs: z.array(RunSchema),
});

/** Props shared by all chart components */
export interface ChartProps {
  runs: Run[];
  width?: number;
  height?: number;
}

export type Athlete = z.infer<typeof AthleteSchema>;
export type Weather = z.infer<typeof WeatherSchema>;
export type Run = z.infer<typeof RunSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
