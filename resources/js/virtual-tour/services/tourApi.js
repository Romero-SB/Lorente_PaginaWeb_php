import { TourSchema } from '../model/schema';

// ============================================================
// tourApi.js — Capa de acceso a datos del tour
// IE N° 31501 «Sebastián Lorente»
// ============================================================

const DRAFT_KEY = 'virtual-tour:draft';
const BASE_URL = '/tour';

/**
 * Carga y valida el tour publicado desde el servidor
 * @returns {Promise<import('../model/types').Tour>}
 */
export async function getPublishedTour() {
    const res = await fetch(`${BASE_URL}/tour.json`);
    if (!res.ok) {
        const fallback = await fetch(`${BASE_URL}/tour.sample.json`);
        if (!fallback.ok) throw new Error('No se pudo cargar la configuración del recorrido virtual.');
        const data = await fallback.json();
        return TourSchema.parse(data);
    }
    const data = await res.json();
    return TourSchema.parse(data);
}

/**
 * Carga el borrador del editor (localStorage) o el publicado si no hay borrador
 * @returns {Promise<import('../model/types').Tour>}
 */
export async function getDraftTour() {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            return TourSchema.parse(data);
        } catch {
            console.warn('[tourApi] Borrador inválido en almacenamiento local, descartando.');
            localStorage.removeItem(DRAFT_KEY);
        }
    }
    return getPublishedTour();
}

/**
 * Guarda el borrador del editor en localStorage
 * @param {import('../model/types').Tour} tour
 */
export async function saveDraftTour(tour) {
    const validated = TourSchema.parse(tour);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(validated, null, 2));
}

/**
 * Descarta el borrador
 */
export async function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
}