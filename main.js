// Scene setup

// navigation tool (ctrl f)
// photo amount (change amount of photos)
// movement (enable orbit controls)
// grid (enable grid coordinates (in index too))

// movement
// import { OrbitControls } from './assets/OrbitControls.js';

let touchStartY = null;
let touchStartTime = null;

const scene = new THREE.Scene();
// Black Bg
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 0, 15);  // Start further back

function calculateZToFitHeight(height) {
    const fovRad = camera.fov * Math.PI / 180;
    const margin = 0.1; // optional safety buffer
    return (height / 2) / Math.tan(fovRad / 2) + margin;
}

function calculateXToFitFullFrame(photoWidth, photoHeight, minDistance = 12) {
    const aspect = window.innerWidth / window.innerHeight;
    const vFov = camera.fov * Math.PI / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

    const xForWidth = (photoWidth / 2) / Math.tan(hFov / 2);
    const xForHeight = (photoHeight / 2) / Math.tan(vFov / 2);

    return Math.max(xForWidth, xForHeight, minDistance);
}

let lastTouchY = null;

window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        lastTouchY = touchStartY;
    }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (!allowScrolling || lastTouchY === null) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - lastTouchY;

    // Reverse touch scroll: swipe up = scroll up (normal is swipe up = scroll down)
    scrollPosition += deltaY * 0.02;

    if (currentSection === 'sports' || currentSection === 'other') {
        scrollPosition = Math.max(-maxScroll[currentSection] - 1, Math.min(3, scrollPosition));
    }

    camera.position.y = sections[currentSection].position[1] + scrollPosition;

    lastTouchY = currentY;
}, { passive: false });

window.addEventListener('touchend', () => {
    lastTouchY = null;
});

function calculateXToFitWall(photoHalfWidth) {
    const aspect = window.innerWidth / window.innerHeight;
    const vFovRad = camera.fov * Math.PI / 180;

    // Compute horizontal FOV
    const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * aspect);

    // Distance needed from photo center to fully fit half its width
    return photoHalfWidth / Math.tan(hFovRad / 2);
}

const frameWidth = 4;
const assumedAspectRatio = 4 / 5; // or use 16/9 if you want to bias wider screens
const frameHeight = frameWidth / assumedAspectRatio;

const requiredZ = calculateZToFitHeight(frameHeight);
const wallOffset = 14.9;


const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

//movement
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.05;
// controls.enableZoom = true;
// controls.enablePan = true;
// controls.update();

// Add static gallery titles
function addStaticGalleryTitle({ text, position, rotation, size = 1, fillColor = 0xffffff, outlineColor = 0xff00f7 }) {
    const loader = new THREE.FontLoader();
    loader.load('assets/fonts/helvetiker_regular.typeface.json', (font) => {
        const shapes = font.generateShapes(text, size);
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();

        const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        geometry.translate(-textWidth / 2, 0, 0);

        const material = new THREE.MeshBasicMaterial({ color: fillColor });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.set(rotation.x, rotation.y, rotation.z);
        scene.add(mesh);

        // Outline
        const holeShapes = [];
        shapes.forEach(s => { if (s.holes) holeShapes.push(...s.holes); });
        const allShapes = shapes.concat(holeShapes);

        const lineGroup = new THREE.Object3D();
        const outlineMaterial = new THREE.LineBasicMaterial({ color: outlineColor });
        allShapes.forEach(shape => {
            const points = shape.getPoints();
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            lineGeo.translate(-textWidth / 2, 0, 0);
            const line = new THREE.Line(lineGeo, outlineMaterial);
            lineGroup.add(line);
        });

        lineGroup.position.copy(mesh.position);
        lineGroup.rotation.copy(mesh.rotation);
        lineGroup.scale.set(1.01, 1.01, 1); // less inflated
        const angle = ((rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

        if (Math.abs(angle - 0) < 0.01) {
            lineGroup.position.z += 0.5; // front
        } else if (Math.abs(angle - Math.PI / 2) < 0.01) {
            lineGroup.position.x -= 0.2; // left
        } else if (Math.abs(angle - (3 * Math.PI) / 2) < 0.01) {
            lineGroup.position.x += 0.2; // right
        } else if (Math.abs(angle - Math.PI) < 0.01) {
            lineGroup.position.z -= 0.5; // back
        }

        scene.add(lineGroup);
    });
}

// ✅ Add static titles
addStaticGalleryTitle({
    text: "Sports Gallery",
    position: { x: wallOffset, y: 3, z: 0 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
    size: 0.5,                   // 👈 makes text larger
    fillColor: 0xffffff,        // optional
    outlineColor: 0xff00f7      // optional
});
addStaticGalleryTitle({
    text: "Portraits Gallery",
    position: { x: -wallOffset, y: 3, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    size: 0.5,                   // 👈 makes text larger
    fillColor: 0xffffff,        // optional
    outlineColor: 0xff00f7      // optional
});
addStaticGalleryTitle({
    text: "CONTACT",
    position: { x: 0, y: 2, z: 20 },
    rotation: { x: 0, y: Math.PI, z: 0 },
    size: 2,                   // 👈 makes text larger
    fillColor: 0x5e005c,        // optional
    outlineColor: 0xff00f7      // optional
});

// Create starfield effect
const createStarfield = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05,
        transparent: true
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
    
    return starField;
};

// Create shooting lines
const createShootingLines = () => {
    const linesGroup = new THREE.Group();

    for (let i = 0; i < 80; i++) {
        // Generate random unit direction
        const direction = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();

        // Randomize length
        const length = 3 + Math.random() * 5;

        const start = new THREE.Vector3(0, 0, 0);
        const end = direction.clone().multiplyScalar(length);

        // Geometry from start → end
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });

        const line = new THREE.Line(geometry, material);

        // Position far from center
        const spawnOffsetDir = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        const spawnDistance = 200 + Math.random() * 200;
        const spawnPosition = spawnOffsetDir.multiplyScalar(spawnDistance);

        line.position.copy(spawnPosition);

        // Save the direction the line points to (end relative to start)
        const moveDir = end.clone().normalize();

        line.userData.velocity = moveDir.multiplyScalar(0.8); // speed factor
        linesGroup.add(line);
    }

    scene.add(linesGroup);
    return linesGroup;
};



const starField = createStarfield();
const shootingLines = createShootingLines();

// Section positions - UPDATED

const aboutContentHeight = 3; // 2 unit tall content + top/bottom margin
const aboutZ = calculateZToFitHeight(aboutContentHeight);


const sections = {
    center:  { position: [0, 0, 15], rotation: [0, 0, 0] },
    about:   { position: [0, 0, aboutZ], rotation: [0, 0, 0] },
    sports:  { position: [wallOffset - requiredZ, 0, 0], rotation: [0, -Math.PI / 2, 0] },
    other:   { position: [-wallOffset + requiredZ, 0, 0], rotation: [0, Math.PI / 2, 0] },
    contact: { position: [0, 0, 10], rotation: [0, Math.PI, 0] }
};

// Photo data
// Auto-generated photo data
const generatePhotoData = (prefix, count) => {
    return Array.from({ length: count }, (_, i) => {
        const id = `${prefix}${i + 1}`;
        return {
            id,
            title: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Photo ${i + 1}`,
            description: `Auto-loaded image: ${id}`,
            category: prefix // Add this to track the folder
        };
    });
};

// Set how many images you have in each group
// photo amount
const photos = {
    sports: generatePhotoData('sports', 15), // sports1.jpg to sports10.jpg
    other: generatePhotoData('other', 15)     // other1.jpg to other6.jpg
};


// Create photo frames with proper aspect ratios - UPDATED
const createPhotoFrames = () => {
    const frames = [];
    const wallOffset = 14.9;
    const frameWidth = 4;
    const spacing = 1;

    // Load sports photos one by one
    async function loadSportsSequentially() {
        let lastY = 0;

        for (let i = 0; i < photos.sports.length; i++) {
            const photo = photos.sports[i];
            const path = `assets/photos/sports/${photo.id}.jpg`;

            const texture = await new Promise((resolve, reject) => {
                new THREE.TextureLoader().load(path, resolve, undefined, reject);
            });

            const aspectRatio = texture.image.width / texture.image.height;
            const height = frameWidth / aspectRatio;

            const frame = new THREE.Mesh(
                new THREE.PlaneGeometry(frameWidth, height),
                new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true })
            );
            frame.rotation.y = -Math.PI / 2;
            frame.userData = photo;

            const y = i === 0 ? 0 : lastY - spacing - height / 2;
            frame.position.set(wallOffset, y, 0);
            lastY = y - height / 2;

            frames.push(frame);
            scene.add(frame);
        }

        // Update scroll bounds
        const fovRad = camera.fov * Math.PI / 180;
        const viewHeight = 2 * Math.tan(fovRad / 2) * sections.sports.position[2];
        const halfView = viewHeight / 2;
        maxScroll.sports = -(lastY - sections.sports.position[1] + halfView);
    }

    // Load others photos one by one
    async function loadOthersSequentially() {
        let lastY = 0;

        for (let i = 0; i < photos.other.length; i++) {
            const photo = photos.other[i];
            const path = `assets/photos/others/${photo.id}.jpg`;

            const texture = await new Promise((resolve, reject) => {
                new THREE.TextureLoader().load(path, resolve, undefined, reject);
            });

            const aspectRatio = texture.image.width / texture.image.height;
            const height = frameWidth / aspectRatio;

            const frame = new THREE.Mesh(
                new THREE.PlaneGeometry(frameWidth, height),
                new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true })
            );
            frame.rotation.y = Math.PI / 2;
            frame.userData = photo;

            const y = i === 0 ? 0 : lastY - spacing - height / 2;
            frame.position.set(-wallOffset, y, 0);
            lastY = y - height / 2;

            frames.push(frame);
            scene.add(frame);
        }

        // Update scroll bounds
        const fovRad = camera.fov * Math.PI / 180;
        const viewHeight = 2 * Math.tan(fovRad / 2) * sections.other.position[2];
        const halfView = viewHeight / 2;
        maxScroll.other = -(lastY - sections.other.position[1] + halfView);
    }

    // Kick off both sequential loaders
    loadSportsSequentially();
    loadOthersSequentially();

    return frames;
};


function prewarmTextures(frames) {
    frames.forEach(frame => {
        if (frame.material.map) {
            const dummyScene = new THREE.Scene();
            const dummyCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);
            dummyCamera.position.z = 5;
            dummyScene.add(frame.clone());
            renderer.render(dummyScene, dummyCamera);
        }
    });
}

let aboutTextMesh = null;
let aboutParagraphMesh = null;

const aboutHideY = {
    title: -30,
    paragraph: -32
};


// Enhanced text creation function with optional outline (for "About Me" only)
function create3DTextOnWall(text, position, rotation, callback, useOutline = false, options = {}) {
    const loader = new THREE.FontLoader();
    loader.load('assets/fonts/helvetiker_regular.typeface.json', (font) => {
        const size = options.size || 1;
        const fillColor = options.fillColor || 0xffffff;
        const opacity = options.opacity ?? 0.4;

        const shapes = font.generateShapes(text, size);
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();

        const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        geometry.translate(-textWidth / 2, 0, 0); // for fill

        const fillMaterial = new THREE.MeshBasicMaterial({
            color: fillColor,
            transparent: opacity < 1,
            opacity: opacity
        });

        const mesh = new THREE.Mesh(geometry, fillMaterial);
        const startY = options.startHidden ? position.y - 30 : position.y;
        mesh.position.set(position.x, startY, position.z);
        mesh.rotation.set(rotation.x, rotation.y, rotation.z);
        scene.add(mesh);

        if (useOutline) {
            const lineGroup = new THREE.Object3D();
            const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xff00f7 });

            const holeShapes = [];
            shapes.forEach(s => {
                if (s.holes) holeShapes.push(...s.holes);
            });

            const allShapes = shapes.concat(holeShapes);

            allShapes.forEach(shape => {
                const points = shape.getPoints();
                const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                lineGeo.translate(-textWidth / 2, 0, 0);
                const line = new THREE.Line(lineGeo, outlineMaterial);
                lineGroup.add(line);
            });

            lineGroup.position.copy(mesh.position);
            lineGroup.rotation.copy(mesh.rotation);
            lineGroup.position.z += 0.5; // in front
            lineGroup.scale.set(1.03, 1.03, 1); // slightly larger
            mesh.userData.outline = lineGroup;
            scene.add(lineGroup);
        }

        if (callback) callback(mesh);
    });
}


function wrapText(text, maxCharsPerLine) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let word of words) {
        const testLine = currentLine + word + ' ';
        if (testLine.length > maxCharsPerLine) {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) lines.push(currentLine.trim());
    return lines;
}

// About me z calculation
function calculateZToFitText(textHeight) {
    const vFov = camera.fov * Math.PI / 180;
    const requiredZ = (textHeight / 2) / Math.tan(vFov / 2);

    const dynamicMinZ = (() => {
        if (window.innerWidth < 500) return 12;
        if (window.innerWidth < 800) return 9;
        return 6;
    })();

    return Math.max(requiredZ, dynamicMinZ);
}

const photoFrames = createPhotoFrames();
prewarmTextures(photoFrames);

create3DTextOnWall(
    "ABOUT ME",
    { x: 0, y: 1.5, z: -14.9 },
    { x: 0, y: 0, z: 0 },
    (mesh) => { aboutTextMesh = mesh; },
    true,
    {
        size: 2,
        fillColor: 0x5e005c,
        opacity: 1,
        startHidden: true  // ✅ Keep this for About Me only
    }
);

let aboutParagraphGroup = null;

const screenWidth = window.innerWidth;
const maxChars = screenWidth < 500 ? 20 : screenWidth < 900 ? 30 : 40;

function createParagraph3D(text, options = {}, callback) {
    const {
        maxCharsPerLine = 30,
        fontSize = 0.6,
        fillColor = 0xffffff,
        position = { x: 0, y: 0, z: 0 },
        lineSpacing = 0.75
    } = options;

    const loader = new THREE.FontLoader();
    loader.load('assets/fonts/helvetiker_regular.typeface.json', (font) => {
        const lines = wrapText(text, maxCharsPerLine);
        const group = new THREE.Group();

        lines.forEach((lineText, i) => {
            const shapes = font.generateShapes(lineText, fontSize);
            const geometry = new THREE.ShapeGeometry(shapes);
            geometry.computeBoundingBox();

            const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
            geometry.translate(-textWidth / 2, 0, 0);

            const material = new THREE.MeshBasicMaterial({ color: fillColor });
            const mesh = new THREE.Mesh(geometry, material);

            const lineY = -i * lineSpacing;
            mesh.position.set(position.x, lineY, 0);
            group.add(mesh);
        });

        group.position.set(position.x, -32, position.z); // start hidden
        aboutParagraphGroup = group;
        scene.add(group);
        if (callback) callback(group);
    });
}

function createStaticParagraph3D(text, options = {}) {
    const {
        maxCharsPerLine = 30,
        fontSize = 0.6,
        fillColor = 0xffffff,
        position = { x: 0, y: 0, z: 0 },
        rotation = { x: 0, y: 0, z: 0 }, // 👈 accept rotation
        lineSpacing = 0.75
    } = options;

    const loader = new THREE.FontLoader();
    loader.load('assets/fonts/helvetiker_regular.typeface.json', (font) => {
        const lines = wrapText(text, maxCharsPerLine);
        const group = new THREE.Group();

        lines.forEach((lineText, i) => {
            const shapes = font.generateShapes(lineText, fontSize);
            const geometry = new THREE.ShapeGeometry(shapes);
            geometry.computeBoundingBox();

            const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
            geometry.translate(-textWidth / 2, 0, 0);

            const material = new THREE.MeshBasicMaterial({ color: fillColor });
            const mesh = new THREE.Mesh(geometry, material);

            const lineY = -i * lineSpacing;
            mesh.position.set(0, lineY, 0);
            group.add(mesh);
        });

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z); // 👈 apply rotation
        scene.add(group);
    });
}

createStaticParagraph3D(
    "Ins: @dannyyanny9",
    {
        maxCharsPerLine: maxChars,
        fontSize: 0.4,
        fillColor: 0xfffcff,
        position: { x: 0, y: 0.5, z: 19.9 }, // Just in front of Contact wall
        rotation: { x: 0, y: Math.PI, z: 0 } // 👈 rotate to face camera
    }
);

createParagraph3D(
    "This is a responsive multiline paragraph that wraps based on screen size and moves in/out with the About section. This is a responsive multiline paragraph that wraps based on screen size and moves in/out with the About section. This is a responsive multiline paragraph that wraps based on screen size and moves in/out with the About section.",
    {
        maxCharsPerLine: maxChars,
        fontSize: 0.6,
        fillColor: 0xfffcff,
        position: { x: 0, y: -0.5, z: -14.9 }
    }
);

// Navigation state
let currentSection = 'center';
let allowScrolling = false;
let scrollPosition = 0;
let maxScroll = {
    sports: (photos.sports.length - 1) * 4,
    other: (photos.other.length - 1) * 4,
    about: 0,
    contact: 0
};

// Move to section function
const moveToSection = (section) => {
    currentSection = section;
    allowScrolling = section !== 'center';
    // Start at the title position (3) instead of image top (0)
    if (section === 'sports' || section === 'other') {
        scrollPosition = 3;  // Start at title height
    } else {
        scrollPosition = 0;
    }
    
    // Get all UI elements
    const centerUI = document.getElementById('center-ui');
    const navButtons = document.querySelector('.nav-buttons');
    const title = document.getElementById('main-title');
    const aboutSection = document.getElementById('about-section');
    const buttons = document.querySelectorAll('.nav-btn');
    const homeBtn = document.getElementById('home-btn');

    if (section === 'center') {
        centerUI.classList.remove('moved');
        navButtons.classList.remove('moved');
        title.classList.remove('moved');

        buttons.forEach(btn => {
            gsap.set(btn, { opacity: 0, y: 20 });
            btn.classList.remove('moved');
            btn.style.display = ''; 
        });

        homeBtn.style.display = 'none';
        homeBtn.classList.remove('moved');

        navButtons.style.justifyContent = 'center';
        navButtons.style.flexDirection = 'column';
    } else {
        centerUI.classList.add('moved');
        navButtons.classList.add('moved');
        title.classList.add('moved');

        buttons.forEach((btn, i) => {
            btn.style.display = 'block';
            gsap.fromTo(btn, 
                { opacity: 0, y: 20 }, 
                { opacity: 1, y: 0, duration: 0.6, delay: i * 0.1, ease: 'power2.out' }
            );
        });

        homeBtn.style.display = 'block';
        homeBtn.classList.add('moved');

        navButtons.style.justifyContent = 'flex-end';
        navButtons.style.flexDirection = 'row';
    }

    // Camera animation (existing)
    const frameWidth = 4;
    const assumedAspect = 4 / 5;
    const frameHeight = frameWidth / assumedAspect;

    const minSafeDistance = window.innerWidth < 600 ? 7 : 3.5;
    const distance = calculateXToFitFullFrame(frameWidth, frameHeight, minSafeDistance);

    let targetX = (() => {
        if (section === 'sports') return wallOffset - distance;
        if (section === 'other') return -wallOffset + distance;
        return sections[section].position[0];
    })();
    

    gsap.to(camera.position, {
        x: targetX,
        y: sections[section].position[1] + scrollPosition,
        z: (() => {
            if (section === 'about') {
                return calculateZToFitText(4);
            }
            if (section === 'contact') {
                const zDist = (() => {
                    if (window.innerWidth < 500) return -2;
                    if (window.innerWidth < 800) return -1;
                    return 5;
                })();
                return zDist;
            }
            return sections[section].position[2];
        })(),
        duration: 1.5,
        ease: "power2.inOut"
    });

    gsap.to(camera.rotation, {
        x: sections[section].rotation[0],
        y: sections[section].rotation[1],
        z: sections[section].rotation[2],
        duration: 1.5,
        ease: "power2.inOut"
    });

    // About section text animation
    if (aboutTextMesh) {
        const show = section === 'about';
        const yTarget = show ? 3.5 : aboutHideY.title;

        gsap.to(aboutTextMesh.position, {
            y: yTarget,
            duration: 1.2,
            ease: "power3.inOut",
            onUpdate: () => {
                if (aboutTextMesh.userData.outline) {
                    aboutTextMesh.userData.outline.position.y = aboutTextMesh.position.y;
                }
            }
        });

        if (aboutParagraphGroup) {
            gsap.to(aboutParagraphGroup.position, {
                y: show ? 1.5 : -32,
                duration: 1.2,
                ease: "power3.inOut"
            });
        }
    }

    // ✅ Handle mobile dropdown visibility
    const shouldUseDropdown = () => {
        return window.innerWidth < 600 && section !== 'center';
    };

    if (shouldUseDropdown()) {
        document.body.classList.add('show-dropdown');
    } else {
        document.body.classList.remove('show-dropdown');
    }
};

// Add home button click handler
document.getElementById('home-btn').addEventListener('click', () => {
    moveToSection('center');
});

// Handle scroll with boundaries - UPDATED
const handleScroll = (e) => {
    if (!allowScrolling) return;
    
    const delta = -e.deltaY * 0.008;
    scrollPosition += delta;
    
    if (currentSection === 'sports' || currentSection === 'other') {
        scrollPosition = Math.max(-maxScroll[currentSection] - 1, Math.min(3, scrollPosition));
    }
    
    camera.position.y = sections[currentSection].position[1] + scrollPosition;
};

window.addEventListener('wheel', handleScroll);

// Handle photo clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


window.addEventListener('click', (e) => {
    if (currentSection === 'center') return;

    // Prevent clicks when interacting with UI elements (e.g. buttons, modal)
    const clickedEl = e.target;
    if (
        clickedEl.closest('.nav-buttons') ||
        clickedEl.closest('#photo-modal') ||
        clickedEl.classList.contains('close-modal') ||
        clickedEl.closest('#center-ui')
    ) return;

    // Proceed with raycasting
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(photoFrames);

    if (intersects.length > 0) {
        const photo = intersects[0].object.userData;
        const folder = photo.category === 'sports' ? 'sports' : 'others'; // Use correct folder
        document.getElementById('modal-image').src = `assets/photos/${folder}/${photo.id}.jpg`;
        document.getElementById('photo-title').textContent = photo.title;
        document.getElementById('photo-description').textContent = photo.description;
        document.getElementById('photo-modal').classList.add('visible');
    }
    updateDropdownVisibility();
});

window.addEventListener('touchend', (e) => {
    if (currentSection === 'center') return;

    const touch = e.changedTouches[0];
    const touchEndY = touch.clientY;
    const timeDiff = Date.now() - touchStartTime;

    const deltaY = Math.abs(touchEndY - touchStartY);

    // Consider it a tap only if:
    const isTap = deltaY < 10 && timeDiff < 300;

    if (!isTap) return; // skip if it's a scroll

    // Proceed with raycasting for taps
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(photoFrames);

    if (intersects.length > 0) {
        const photo = intersects[0].object.userData;
        const folder = photo.category === 'sports' ? 'sports' : 'others';
        document.getElementById('modal-image').src = `assets/photos/${folder}/${photo.id}.jpg`;
        document.getElementById('photo-title').textContent = photo.title;
        document.getElementById('photo-description').textContent = photo.description;
        document.getElementById('photo-modal').classList.add('visible');
    }
});

// Close modal
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('photo-modal').classList.remove('visible');
});

// Navigation buttons
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        moveToSection(btn.dataset.section);
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update about & contact z distances
    const newAboutZ = calculateZToFitHeight(aboutContentHeight);
    sections.about.position[2] = newAboutZ;

    const contactTitleHeight = 3;
    sections.contact.position[2] = calculateZToFitHeight(contactTitleHeight);

    // Update X offset for sports and other
    const photoWidth = 4;
    const assumedAspectRatio = 4 / 5;
    const photoHeight = photoWidth / assumedAspectRatio;
    const fallbackX = window.innerWidth < 600 ? 3 : 3.5;

    const dynamicX = calculateXToFitFullFrame(photoWidth, photoHeight, fallbackX);

    sections.sports.position[0] = wallOffset - dynamicX;
    sections.other.position[0] = -wallOffset + dynamicX;
});

// Animate shooting lines
const animateShootingLines = () => {
    shootingLines.children.forEach(line => {
        line.position.add(line.userData.velocity);

        // Re-spawn if too far
        if (line.position.length() > 500) {
            const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();

            const length = 3 + Math.random() * 5;
            const end = direction.clone().multiplyScalar(length);

            // Update geometry
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                end
            ]);
            line.geometry.dispose();
            line.geometry = geometry;

            // Position it far from center
            const newPos = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize().multiplyScalar(200 + Math.random() * 200);
            line.position.copy(newPos);

            line.userData.velocity = end.clone().normalize().multiplyScalar(0.8);
        }
    });
};

window.addEventListener('DOMContentLoaded', () => {
    // Existing dropdown setup
    const dropdown = document.getElementById("custom-dropdown");
    if (dropdown) {
        const selected = dropdown.querySelector(".dropdown-selected");
        const options = dropdown.querySelector(".dropdown-options");

        selected.addEventListener("click", () => {
            options.style.display = options.style.display === "flex" ? "none" : "flex";
        });

        options.querySelectorAll(".dropdown-option").forEach(opt => {
            opt.addEventListener("click", () => {
                const section = opt.dataset.section;
                selected.textContent = opt.textContent + " ▾";
                options.style.display = "none";
                moveToSection(section);
            });
        });
    }

    // ✅ ADD THIS INSIDE TOO
    const nativeDropdown = document.getElementById('nav-dropdown');
    if (nativeDropdown) {
        nativeDropdown.addEventListener('change', (e) => {
            const section = e.target.value;
            moveToSection(section);
        });
    }
    updateDropdownVisibility();
});

function updateDropdownVisibility() {
    const dropdown = document.getElementById("custom-dropdown");
    const navButtons = document.querySelector('.nav-buttons');

    const isHome = currentSection === 'center';
    const navHidden = window.getComputedStyle(navButtons).display === 'none';

    if (!isHome && navHidden) {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}


// grid
// Add grid helper (size, divisions, colorCenterLine, colorGrid)
// const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x444444);
// scene.add(gridHelper);
// const axesHelper = new THREE.AxesHelper(5); // Length of axes
// scene.add(axesHelper);

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);

    // movement
    // controls.update(); // required for damping
    
    // grid
    // Update camera coordinates display
    // const coordsElement = document.getElementById('camera-coords');
    // coordsElement.textContent = 
    //     `Camera: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`;
    // coordsElement.textContent = 
    // `X: ${camera.position.x.toFixed(2)}m | Y: ${camera.position.y.toFixed(2)}m | Z: ${camera.position.z.toFixed(2)}m`;
    
    
    // Rest of your animation code (starfield, shooting lines, etc.)
    starField.rotation.x += 0.0001;
    starField.rotation.y += 0.0001;
    animateShootingLines();
    
    renderer.render(scene, camera);
};

// Start the app
setTimeout(() => {
    document.getElementById('loading-screen').style.display = 'none';
}, 2000);

animate();