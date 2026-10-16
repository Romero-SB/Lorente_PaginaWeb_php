import { useCallback, useEffect, useRef } from 'react';

import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';

import { LINK_TYPE_CATALOG } from '../model/types';

// ============================================================
// TourViewer — Visor 360° Optimizado WebGL
// IE N° 31501 «Sebastián Lorente»
// ============================================================

export function TourViewer({
    tour,
    onSceneChange,
    editMode = false,
    onViewerClick,
}) {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);

    // Construir nodos para VirtualTourPlugin
    const buildNodes = useCallback((t) => {
        return t.scenes.map((scene) => ({
            id: scene.id,
            panorama: scene.panorama,
            name: scene.name,
            thumbnail: scene.thumbnail,
            caption: scene.name,
            links: scene.links.map((link) => ({
                nodeId: link.target,
                position: { yaw: link.yaw, pitch: link.pitch },
                name: link.label ?? LINK_TYPE_CATALOG[link.type]?.label ?? 'Avanzar',
                arrowStyle: getLinkArrowStyle(link),
            })),
            markers: scene.infoPoints.map((ip) => ({
                id: ip.id,
                position: { yaw: ip.yaw, pitch: ip.pitch },
                tooltip: {
                    content: `<div style="padding:4px 6px;"><strong>${ip.title}</strong><br/><span style="font-size:12px;color:#cbd5e1;">${ip.content}</span></div>`,
                    position: 'top center',
                },
                html: buildInfoIcon(),
                anchor: 'bottom center',
            })),
        }));
    }, []);

    useEffect(() => {
        if (!containerRef.current || !tour) return;

        // Leer parámetro inicial ?escena= de la URL
        const params = new URLSearchParams(window.location.search);
        const initialSceneId = params.get('escena') ?? tour.startScene;

        const startScene =
            tour.scenes.find((s) => s.id === initialSceneId) ??
            tour.scenes.find((s) => s.id === tour.startScene) ??
            tour.scenes[0];

        const allNodes = buildNodes(tour);
        const startIdx = allNodes.findIndex((n) => n.id === startScene.id);
        const orderedNodes =
            startIdx > 0
                ? [allNodes[startIdx], ...allNodes.slice(0, startIdx), ...allNodes.slice(startIdx + 1)]
                : allNodes;

        // Inicializar Viewer
        const viewer = new Viewer({
            container: containerRef.current,
            defaultYaw: startScene.initialView?.yaw ?? 0,
            defaultPitch: startScene.initialView?.pitch ?? 0,
            defaultZoomLvl: fovToZoom(startScene.initialView?.fov ?? 70),
            loadingTxt: 'Cargando vista 360°…',
            loadingImg: startScene.thumbnail,
            navbar: [
                'zoom',
                'move',
                'fullscreen',
            ],
            plugins: [
                VirtualTourPlugin.withConfig({
                    nodes: orderedNodes,
                    startNodeId: startScene.id,
                    preload: (node, link) => true,
                    transitionOptions: {
                        showLoader: true,
                        speed: '20rpm',
                        effect: 'fade',
                        rotation: true,
                    },
                }),
                MarkersPlugin.withConfig({}),
            ],
        });

        viewerRef.current = viewer;

        // Notificar cambio de escena inicial
        onSceneChange?.(startScene.id);

        // Escuchar cambio de escena
        const vt = viewer.getPlugin(VirtualTourPlugin);
        if (vt) {
            vt.addEventListener('node-changed', (event) => {
                const sceneId = event.node.id;
                onSceneChange?.(sceneId);

                // Sincronizar URL sin recargar
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.set('escena', sceneId);
                window.history.replaceState({}, '', currentUrl.toString());
            });
        }

        // Modo edición: captura de clics
        if (editMode && onViewerClick) {
            viewer.addEventListener('click', (event) => {
                if (event.data && !event.data.rightClick && event.data.yaw !== undefined) {
                    onViewerClick({ yaw: event.data.yaw, pitch: event.data.pitch });
                }
            });
        }

        // Limpieza WebGL rigurosa al desmontar el componente
        return () => {
            viewer.destroy();
            viewerRef.current = null;
        };
    }, [tour, buildNodes, editMode, onSceneChange, onViewerClick]);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', minHeight: 0 }}
            aria-label="Recorrido virtual 360°"
            role="application"
        />
    );
}

// Helpers
function fovToZoom(fov) {
    return Math.max(0, Math.min(100, Math.round(((120 - fov) / 90) * 100)));
}

function getLinkArrowStyle(link) {
    const colorMap = {
        'stairs-up': '#d9b45a',
        'stairs-down': '#d9b45a',
        elevator: '#6366f1',
        door: '#10b981',
        outdoor: '#22d3ee',
        forward: '#ffffff',
        back: '#ffffff',
    };
    return { color: colorMap[link.type] ?? '#ffffff' };
}

function buildInfoIcon() {
    return `<div style="width:28px;height:28px;background:rgba(15,27,66,0.92);border:2px solid #c29a2b;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,0.4);font-family:'Inter',sans-serif;">i</div>`;
}