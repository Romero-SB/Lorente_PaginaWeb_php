// ============================================================
// VALIDADORES DE INTEGRIDAD DEL TOUR — IE N° 31501 «Sebastián Lorente»
// ============================================================

let issueCounter = 0;
const newId = () => `issue-${++issueCounter}`;

/**
 * Valida la integridad lógica de un tour ya parseado por zod.
 * Devuelve todos los errores y advertencias encontrados.
 * @param {import('./types').Tour} tour
 * @returns {import('./types').ValidationResult}
 */
export function validateTour(tour) {
    issueCounter = 0;
    const issues = [];

    const sceneIds = new Set(tour.scenes.map((s) => s.id));
    const floorIds = new Set((tour.floors || []).map((f) => f.id));
    const linkIds = new Set();
    const infoIds = new Set();

    // R1: startScene debe existir
    if (!sceneIds.has(tour.startScene)) {
        issues.push({
            id: newId(),
            severity: 'error',
            message: `startScene "${tour.startScene}" no existe en scenes.`,
        });
    }

    // R2: ids de escena únicos
    const seenSceneIds = new Set();
    for (const scene of tour.scenes) {
        if (seenSceneIds.has(scene.id)) {
            issues.push({
                id: newId(),
                severity: 'error',
                message: `Id de escena duplicado: "${scene.id}".`,
                sceneId: scene.id,
            });
        }
        seenSceneIds.add(scene.id);
    }

    // R3: Si hay pisos configurados, verificar pertenencia
    if (tour.floors && tour.floors.length > 0) {
        for (const scene of tour.scenes) {
            if (scene.floor && !floorIds.has(scene.floor)) {
                issues.push({
                    id: newId(),
                    severity: 'warning',
                    message: `La escena "${scene.id}" apunta a un piso "${scene.floor}" no listado.`,
                    sceneId: scene.id,
                });
            }
        }
    }

    // R4: links apuntan a escenas existentes + ids de links únicos
    for (const scene of tour.scenes) {
        for (const link of scene.links) {
            if (!sceneIds.has(link.target)) {
                issues.push({
                    id: newId(),
                    severity: 'error',
                    message: `Enlace "${link.id}" en "${scene.id}" apunta a "${link.target}" que no existe.`,
                    sceneId: scene.id,
                    linkId: link.id,
                });
            }

            if (linkIds.has(link.id)) {
                issues.push({
                    id: newId(),
                    severity: 'error',
                    message: `Id de enlace duplicado: "${link.id}" en escena "${scene.id}".`,
                    sceneId: scene.id,
                    linkId: link.id,
                });
            }
            linkIds.add(link.id);
        }
    }

    // R5: ids de infoPoints únicos
    for (const scene of tour.scenes) {
        for (const ip of scene.infoPoints) {
            if (infoIds.has(ip.id)) {
                issues.push({
                    id: newId(),
                    severity: 'error',
                    message: `Id de infoPoint duplicado: "${ip.id}" en escena "${scene.id}".`,
                    sceneId: scene.id,
                    infoPointId: ip.id,
                });
            }
            infoIds.add(ip.id);
        }
    }

    // R6: escenas alcanzables desde startScene (BFS)
    const reachable = new Set();
    if (sceneIds.has(tour.startScene)) {
        const queue = [tour.startScene];
        reachable.add(tour.startScene);
        while (queue.length > 0) {
            const current = queue.shift();
            const scene = tour.scenes.find((s) => s.id === current);
            if (!scene) continue;
            for (const link of scene.links) {
                if (sceneIds.has(link.target) && !reachable.has(link.target)) {
                    reachable.add(link.target);
                    queue.push(link.target);
                }
            }
        }
        for (const scene of tour.scenes) {
            if (!reachable.has(scene.id)) {
                issues.push({
                    id: newId(),
                    severity: 'warning',
                    message: `La escena "${scene.id}" es huérfana: no es alcanzable desde startScene.`,
                    sceneId: scene.id,
                });
            }
        }
    }

    // R7: enlaces sin retorno
    const linkMap = new Map();
    for (const scene of tour.scenes) {
        if (!linkMap.has(scene.id)) linkMap.set(scene.id, new Set());
        for (const link of scene.links) {
            linkMap.get(scene.id).add(link.target);
        }
    }
    for (const scene of tour.scenes) {
        for (const link of scene.links) {
            const targetLinks = linkMap.get(link.target);
            if (targetLinks && !targetLinks.has(scene.id)) {
                issues.push({
                    id: newId(),
                    severity: 'warning',
                    message: `Enlace sin retorno: "${scene.id}" → "${link.target}" pero no existe enlace inverso.`,
                    sceneId: scene.id,
                    linkId: link.id,
                });
            }
        }
    }

    // R8: panorama y thumbnail presentes
    for (const scene of tour.scenes) {
        if (!scene.panorama) {
            issues.push({
                id: newId(),
                severity: 'error',
                message: `La escena "${scene.id}" no tiene panorama definido.`,
                sceneId: scene.id,
            });
        }
        if (!scene.thumbnail) {
            issues.push({
                id: newId(),
                severity: 'error',
                message: `La escena "${scene.id}" no tiene thumbnail definido.`,
                sceneId: scene.id,
            });
        }
    }

    const hasErrors = issues.some((i) => i.severity === 'error');
    return { valid: !hasErrors, issues };
}

export function getErrors(result) {
    return result.issues.filter((i) => i.severity === 'error');
}

export function getWarnings(result) {
    return result.issues.filter((i) => i.severity === 'warning');
}