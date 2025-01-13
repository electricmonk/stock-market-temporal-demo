import { z } from 'zod';

// Schema for SMA value from Polygon API
export const polygonSMAValueSchema = z.object({
    timestamp: z.number(),
    value: z.number()
});

// Schema for underlying data
export const underlyingSchema = z.object({
    url: z.string().url()
});

// Schema for the complete Polygon API response
export const polygonResponseSchema = z.object({
    results: z.object({
        underlying: underlyingSchema,
        values: z.array(polygonSMAValueSchema)
    }),
    status: z.string(),
    request_id: z.string(),
    next_url: z.string().url().optional()
});

// Infer TypeScript types from the schemas
export type PolygonSMAValue = z.infer<typeof polygonSMAValueSchema>;
export type PolygonResponse = z.infer<typeof polygonResponseSchema>;