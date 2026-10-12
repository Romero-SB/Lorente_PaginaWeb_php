// ============================================================
// TIPOS DEL RECORRIDO VIRTUAL — IE N° 31501 «Sebastián Lorente»
// JSDoc para autocompletado en el stack React 19 + Inertia 3
// ============================================================

/**
 * @typedef {'forward'|'back'|'door'|'stairs-up'|'stairs-down'|'elevator'|'outdoor'} LinkType
 * @typedef {{ yaw: number, pitch: number, fov: number }} InitialView
 * @typedef {{ x: number, y: number }} MapPosition
 * @typedef {{ id: string, target: string, yaw: number, pitch: number, type: LinkType, label?: string }} Link
 * @typedef {{ type: 'image'|'video', url: string, alt?: string }} InfoMedia
 * @typedef {{ id: string, yaw: number, pitch: number, title: string, content: string, media: InfoMedia|null }} InfoPoint
 * @typedef {{ id: string, name: string, floor?: string, panorama: string, thumbnail: string, initialView: InitialView, mapPosition?: MapPosition, links: Link[], infoPoints: InfoPoint[] }} Scene
 * @typedef {{ id: string, name: string, order: number }} Floor
 * @typedef {{ version: number, startScene: string, northConvention?: string, floors?: Floor[], scenes: Scene[] }} Tour
 */

/** @type {Record<string, {label: string, description: string}>} */
export const LINK_TYPE_CATALOG = {
    forward:        { label: 'Avanzar',           description: 'Continuar por el pasillo' },
    back:           { label: 'Volver',            description: 'Regresar' },
    door:           { label: 'Entrar',            description: 'Pasar por una puerta' },
    'stairs-up':    { label: 'Subir',             description: 'Subir por escaleras' },
    'stairs-down':  { label: 'Bajar',             description: 'Bajar por escaleras' },
    elevator:       { label: 'Ascensor',          description: 'Usar el ascensor' },
    outdoor:        { label: 'Salir al exterior', description: 'Ir a un espacio exterior' },
};

export const LINK_TYPES = Object.keys(LINK_TYPE_CATALOG);
