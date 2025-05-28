import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

export function createWallTitle(scene, text, options = {}) {
    const {
        position = { x: 0, y: 0, z: 0 },
        rotation = { x: 0, y: 0, z: 0 },
        size = 1.2,
        fillColor = 0xffffff,
        outlineColor = 0xff00f7,
        outlineOffset = 0.5,
        outlineScale = 1.02
    } = options;

    const loader = new FontLoader();
    loader.load('assets/fonts/helvetiker_regular.typeface.json', (font) => {
        const shapes = font.generateShapes(text, size);
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();

        const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        geometry.translate(-textWidth / 2, 0, 0);

        const fillMaterial = new THREE.MeshBasicMaterial({ color: fillColor });
        const textMesh = new THREE.Mesh(geometry, fillMaterial);
        textMesh.position.set(position.x, position.y, position.z);
        textMesh.rotation.set(rotation.x, rotation.y, rotation.z);
        scene.add(textMesh);

        const outlineMaterial = new THREE.LineBasicMaterial({ color: outlineColor });
        const allShapes = [...shapes];
        shapes.forEach(s => { if (s.holes) allShapes.push(...s.holes); });

        const lineGroup = new THREE.Group();
        allShapes.forEach(shape => {
            const points = shape.getPoints();
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            lineGeo.translate(-textWidth / 2, 0, 0);
            const line = new THREE.Line(lineGeo, outlineMaterial);
            lineGroup.add(line);
        });

        lineGroup.position.set(position.x, position.y, position.z);
        lineGroup.rotation.set(rotation.x, rotation.y, rotation.z);

        // Move the outline slightly forward from the text depending on wall orientation
        const forward = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z));
        lineGroup.position.add(forward.multiplyScalar(outlineOffset));
        lineGroup.scale.set(outlineScale, outlineScale, 1);

        scene.add(lineGroup);
    });
}
