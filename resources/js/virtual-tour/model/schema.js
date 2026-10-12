import { z } from 'zod';

// ============================================================
// ESQUEMA ZOD — Validación de tour.json en Runtime
// IE N° 31501 «Sebastián Lorente»
// ============================================================

const MAP_POSITION = 1;

export const MapPositionSchema = z.object({
    x: z.number().min(0).max(MAP_POSITION),
    y: z.number().min(0).max(MAP_POSITION),
});

export const InitialViewSchema = z.object({
    yaw: z.number().min(-2 * Math.PI).max(2 * Math.PI),
    pitch: z.number().min(-Math.PI).max(Math.PI),
    fov: z.number().min(30).max(120),
});

export const LinkTypeSchema = z.enum([
    'forward',
    'back',
    'door',
    'stairs-up',
    'stairs-down',
    'elevator',
    'outdoor',
]);

export const LinkSchema = z.object({
    id: z.string().min(1),
    target: z.string().min(1),
    yaw: z.number().min(-2 * Math.PI).max(2 * Math.PI),
    pitch: z.number().min(-Math.PI).max(Math.PI),
    type: LinkTypeSchema,
    label: z.string().optional(),
});

export const InfoMediaSchema = z.object({
    type: z.enum(['image', 'video']),
    url: z.string().url().or(z.string().startsWith('/')),
    alt: z.string().optional(),
});

export const InfoPointSchema = z.object({
    id: z.string().min(1),
    yaw: z.number().min(-2 * Math.PI).max(2 * Math.PI),
    pitch: z.number().min(-Math.PI).max(Math.PI),
    title: z.string().min(1).max(80),
    content: z.string().max(2000),
    media: InfoMediaSchema.nullable(),
});

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SceneSchema = z.object({
    id: z.string().regex(slugRegex, 'El id debe ser un slug (minúsculas, números y guiones)'),
    name: z.string().min(1).max(100),
    floor: z.string().optional(),
    panorama: z.string().min(1),
    thumbnail: z.string().min(1),
    initialView: InitialViewSchema,
    mapPosition: MapPositionSchema.optional(),
    links: z.array(LinkSchema),
    infoPoints: z.array(InfoPointSchema),
});

export const FloorSchema = z.object({
    id: z.string().regex(slugRegex, 'El id del piso debe ser un slug'),
    name: z.string().min(1).max(60),
    order: z.number().int().min(1),
});

export const TourSchema = z.object({
    version: z.number().int().min(1),
    startScene: z.string().min(1),
    northConvention: z.string().optional(),
    floors: z.array(FloorSchema).optional().default([]),
    scenes: z.array(SceneSchema).min(1),
});