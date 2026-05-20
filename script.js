// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// --- Three.js Setup ---
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

// Camera setup
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
// Start camera higher up so we can scroll down
camera.position.set(0, 0, 8);
scene.add(camera);

// Renderer setup
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true, // Transparent background to show CSS background
    antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLightBlue = new THREE.PointLight(0x00f3ff, 3, 20); // Neon blue accent
pointLightBlue.position.set(5, 5, 5);
scene.add(pointLightBlue);

const pointLightPink = new THREE.PointLight(0xff00ea, 3, 20); // Neon pink accent
pointLightPink.position.set(-5, -5, 2);
scene.add(pointLightPink);

const pointLightWhite = new THREE.PointLight(0xffffff, 1, 20);
pointLightWhite.position.set(0, 0, 5);
scene.add(pointLightWhite);

// Objects - Abstract Shapes (Anti-gravity effect)
const objects = [];

// Geometries
const geometries = [
    new THREE.IcosahedronGeometry(0.8, 0),
    new THREE.TorusGeometry(0.6, 0.2, 16, 100),
    new THREE.TetrahedronGeometry(0.9, 0),
    new THREE.OctahedronGeometry(0.7, 0)
];

// Materials (Mix of wireframe tech look and solid metallic)
const wireMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f3ff,
    roughness: 0.1,
    metalness: 0.8,
    wireframe: true,
    transparent: true,
    opacity: 0.3
});

const solidMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.2,
    metalness: 0.9,
});

const solidMaterialPink = new THREE.MeshStandardMaterial({
    color: 0xff00ea,
    roughness: 0.3,
    metalness: 0.7,
});

const shapesCount = 60; // More shapes to fill vertical scrolling space
const verticalSpread = 40; // How far up/down they spawn

for(let i = 0; i < shapesCount; i++) {
    const geometry = geometries[Math.floor(Math.random() * geometries.length)];
    
    let mat;
    const matRand = Math.random();
    if(matRand < 0.4) mat = wireMaterial;
    else if(matRand < 0.8) mat = solidMaterial;
    else mat = solidMaterialPink;

    const mesh = new THREE.Mesh(geometry, mat);
    
    // Position randomly across a tall vertical space
    // We want objects to be placed below the initial view so they "float up" as we scroll down
    mesh.position.x = (Math.random() - 0.5) * 15;
    mesh.position.y = (Math.random() - 0.5) * verticalSpread - 5; 
    mesh.position.z = (Math.random() - 0.5) * 15 - 5;
    
    // Random rotation
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    
    // Custom properties for animation
    mesh.userData = {
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.01,
            y: (Math.random() - 0.5) * 0.01,
            z: (Math.random() - 0.5) * 0.01
        },
        floatSpeed: Math.random() * 0.005 + 0.001,
        floatOffset: Math.random() * Math.PI * 2
    };

    scene.add(mesh);
    objects.push(mesh);
}

// Particles (Stars/Dust/Cyber-motes)
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1000;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 20; // x
    if (i % 3 === 1) { 
        posArray[i] = (Math.random() - 0.5) * verticalSpread; // y spread
    }
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03,
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Resize handler
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Mouse interaction for slight parallax
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / sizes.width) * 2 - 1;
    mouseY = -(event.clientY / sizes.height) * 2 + 1;
});

// --- GSAP ScrollTrigger Animations ---

// 1. Move camera down on scroll (Objects appear to float up)
gsap.to(camera.position, {
    y: -verticalSpread * 0.6, // Move down significantly to see all objects
    ease: "none",
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5 // Smooth scrubbing
    }
});

// 2. Rotate entire particle field slightly during scroll
gsap.to(particlesMesh.rotation, {
    y: Math.PI,
    x: Math.PI * 0.2,
    ease: "none",
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 2
    }
});

// 3. HTML Elements Fade & Slide In using IntersectionObserver (Avoids CSS Transition conflicts)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.glass-panel').forEach(panel => {
    observer.observe(panel);
});

// --- Animation Loop ---
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Anti-gravity rotation & floating for all abstract objects
    objects.forEach((obj) => {
        // Continuous rotation
        obj.rotation.x += obj.userData.rotationSpeed.x;
        obj.rotation.y += obj.userData.rotationSpeed.y;
        obj.rotation.z += obj.userData.rotationSpeed.z;
        
        // Gentle floating up and down
        obj.position.y += Math.sin(elapsedTime + obj.userData.floatOffset) * obj.userData.floatSpeed;
    });

    // Slow continuous rotation of particles
    particlesMesh.rotation.y += 0.0005;

    // Smooth Parallax mouse effect (Camera subtle move)
    targetX = mouseX * 0.5;
    targetY = mouseY * 0.5;
    
    // Group or Camera rotation based on mouse
    camera.position.x += (targetX - camera.position.x) * 0.02;
    // Don't modify camera.position.y directly here much as it conflicts with ScrollTrigger
    // Instead we could rotate the camera slightly
    camera.rotation.y += (-mouseX * 0.1 - camera.rotation.y) * 0.05;
    camera.rotation.x += (mouseY * 0.1 - camera.rotation.x) * 0.05;

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();

// --- WhatsApp Conversational Form Logic ---
const waSubmitBtn = document.getElementById('wa-submit');
if (waSubmitBtn) {
    waSubmitBtn.addEventListener('click', () => {
        const name = document.getElementById('wa-name').value.trim() || '[Name]';
        const service = document.getElementById('wa-service').value;
        const budget = document.getElementById('wa-budget').value;
        const contact = document.getElementById('wa-contact').value.trim() || '[Email/Phone]';

        const message = `Hi SachiRaw! My name is ${name} and I'm looking to build a ${service} for my brand. My budget is approximately ${budget}, and you can reach me back at this number or ${contact}. Let's create some digital magic together!`;

        const waUrl = `https://wa.me/94701240951?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    });
}
