import * as THREE from 'three';

console.log('Minecraft HTML loading...');

// ---------- CONFIG ----------
const WORLD_SIZE = 48; // x and z from -SIZE/2 to SIZE/2
const WATER_LEVEL = 1;
const PLAYER_HEIGHT = 1.8;
const PLAYER_WIDTH = 0.6;
const PLAYER_EYE_HEIGHT = 1.62;
const GRAVITY = 28;
const JUMP_FORCE = 9.2;
const WALK_SPEED = 4.6;
const SPRINT_SPEED = 7.5;
const INTERACTION_RANGE = 5; // требуемая дальность взаимодействия
const WORLD_MIN_Y = -2;
const WORLD_MAX_Y = 32;

// ---------- BLOCK TYPES ----------
const BLOCKS = {
  grass: { id: 'grass', name: 'Трава', colorTop: '#5db747', colorSide: '#7a5a2e', colorBottom: '#6e4a1f', icon: '#5db747' },
  dirt: { id: 'dirt', name: 'Земля', color: '#8b5a2b', icon: '#8b5a2b' },
  stone: { id: 'stone', name: 'Камень', color: '#9e9e9e', icon: '#9e9e9e' },
  sand: { id: 'sand', name: 'Песок', color: '#e8d9a5', icon: '#e8d9a5' },
  wood: { id: 'wood', name: 'Дерево', colorSide: '#8d6e3f', colorTop: '#6d4c1d', colorBottom: '#6d4c1d', icon: '#8d6e3f' },
  leaves: { id: 'leaves', name: 'Листва', color: '#3a9d23', icon: '#3a9d23' },
  water: { id: 'water', name: 'Вода', color: '#3a7bff', icon: '#3a7bff' },
  bedrock: { id: 'bedrock', name: 'Бедрок', color: '#2b2b2b', icon: '#2b2b2b', unbreakable: true },
};
const BLOCK_LIST = [BLOCKS.grass, BLOCKS.dirt, BLOCKS.stone, BLOCKS.sand, BLOCKS.wood, BLOCKS.leaves, BLOCKS.water];
// Отдельный флаг неразрушимости — используется в системе ломания
function isUnbreakable(type){ return BLOCKS[type]?.unbreakable === true; }
function isInsideWorld(x, y, z) {
  const half = Math.floor(WORLD_SIZE / 2);
  return Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z)
    && x >= -half && x < half
    && z >= -half && z < half
    && y >= WORLD_MIN_Y && y <= WORLD_MAX_Y;
}

// ---------- TEXTURE GENERATOR ----------
function makeTexture(baseColor, type = 'solid') {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // add noise
  if (type !== 'water') {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const s = Math.random() * 3 + 1;
      ctx.fillRect(x, y, s, s);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const s = Math.random() * 2 + 1;
      ctx.fillRect(x, y, s, s);
    }
  }
  // border to emphasize pixels
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  // grid
  for (let i = 0; i < size; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0); ctx.lineTo(i, size);
    ctx.moveTo(0, i); ctx.lineTo(size, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGrassSideTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  // dirt bottom 60%
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(0, 0, size, size);
  // grass top 40%
  ctx.fillStyle = '#5db747';
  ctx.fillRect(0, 0, size, size * 0.38);
  // transition pixels
  ctx.fillStyle = '#6e8f3a';
  for (let x = 0; x < size; x += 4) {
    const h = Math.floor(Math.random() * 8 + 2);
    ctx.fillRect(x, size * 0.38 - h, 4, h + 4);
  }
  // noise
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let i = 0; i < 100; i++) ctx.fillRect(Math.random()*size, Math.random()*size, 2, 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0,0,size,size);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWoodSideTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8d6e3f';
  ctx.fillRect(0, 0, size, size);
  // vertical bark lines
  ctx.fillStyle = '#6d4c1d';
  for (let i = 0; i < 6; i++) {
    const x = (i * 11 + Math.random()*3) % size;
    ctx.fillRect(x, 0, 3, size);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = 0; i < 60; i++) ctx.fillRect(Math.random()*size, Math.random()*size, 2, 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2; ctx.strokeRect(0,0,size,size);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function makeWoodTopTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c9a86a';
  ctx.fillRect(0,0,size,size);
  ctx.fillStyle = '#6d4c1d';
  ctx.beginPath();
  ctx.arc(size/2, size/2, 18, 0, Math.PI*2); ctx.strokeStyle='#6d4c1d'; ctx.lineWidth=3; ctx.stroke();
  ctx.beginPath();
  ctx.arc(size/2, size/2, 10, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath();
  ctx.arc(size/2, size/2, 4, 0, Math.PI*2); ctx.fillStyle='#5a3f16'; ctx.fill();
  // rings
  ctx.strokeStyle='rgba(109,76,29,0.5)'; ctx.lineWidth=1;
  for(let r=6;r<22;r+=4){ ctx.beginPath(); ctx.arc(size/2,size/2,r,0,Math.PI*2); ctx.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------- SCENE SETUP ----------
const container = document.getElementById('game-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x9bd6ff, 0.009);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 10, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

// ---------- LIGHTING ----------
const ambient = new THREE.AmbientLight(0xffffff, 0.72);
scene.add(ambient);

const sunLight = new THREE.DirectionalLight(0xfff7d6, 1.25);
sunLight.position.set(80, 140, 60);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 300;
sunLight.shadow.camera.left = -90;
sunLight.shadow.camera.right = 90;
sunLight.shadow.camera.top = 90;
sunLight.shadow.camera.bottom = -90;
sunLight.shadow.bias = -0.0008;
scene.add(sunLight);

// hemisphere for soft sky contribution
const hemi = new THREE.HemisphereLight(0x87ceeb, 0x6b8c42, 0.35);
scene.add(hemi);

// sun mesh
const sunGeo = new THREE.SphereGeometry(12, 16, 16);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffec6b });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.copy(sunLight.position);
scene.add(sunMesh);

// lens flare style glow
const sunGlowGeo = new THREE.SphereGeometry(15, 16, 16);
const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xffeaa0, transparent: true, opacity: 0.22 });
const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
sunGlow.position.copy(sunMesh.position);
scene.add(sunGlow);

// ---------- SKY DOME ----------
const skyGeo = new THREE.SphereGeometry(400, 32, 32);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    topColor: { value: new THREE.Color(0x2a7fff) },
    bottomColor: { value: new THREE.Color(0xcfe8ff) },
    offset: { value: 40 },
    exponent: { value: 0.85 },
  },
  vertexShader: `varying vec3 vWorldPosition;
    void main(){
      vec4 worldPosition = modelMatrix * vec4(position,1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }`,
  fragmentShader: `uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent;
    varying vec3 vWorldPosition;
    void main(){
      float h = normalize(vWorldPosition + vec3(offset)).y;
      float t = max(pow(max(h,0.0), exponent), 0.0);
      // add slight horizon haze
      vec3 col = mix(bottomColor, topColor, t);
      // sun glow near top (fake)
      gl_FragColor = vec4(col, 1.0);
    }`
});
const skyDome = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyDome);

// ---------- CLOUDS ----------
function createClouds() {
  const cloudGroup = new THREE.Group();
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  // a few cloud clusters
  const clusters = [
    { x: -40, z: -20, w: 18, h: 2, d: 10 },
    { x: 30, z: 35, w: 22, h: 2, d: 12 },
    { x: -10, z: 50, w: 16, h: 2, d: 8 },
    { x: 45, z: -35, w: 20, h: 2, d: 10 },
    { x: 0, z: -45, w: 14, h: 2, d: 12 },
  ];
  clusters.forEach(cl => {
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(boxGeo, cloudMat);
      m.position.set(
        cl.x + (Math.random() - 0.5) * cl.w,
        36 + Math.random() * 2,
        cl.z + (Math.random() - 0.5) * cl.d
      );
      m.scale.set(4 + Math.random()*4, 1.5 + Math.random(), 4 + Math.random()*4);
      m.castShadow = false;
      m.receiveShadow = false;
      cloudGroup.add(m);
    }
  });
  scene.add(cloudGroup);
  return cloudGroup;
}
const clouds = createClouds();

// ---------- DISTANT HORIZON (infinite plain feel) ----------
(function addHorizon(){
  const geo = new THREE.PlaneGeometry(1200, 1200);
  const mat = new THREE.MeshLambertMaterial({ color: 0x7bb562 });
  const plane = new THREE.Mesh(geo, mat);
  plane.rotation.x = -Math.PI/2;
  plane.position.y = -0.1;
  plane.receiveShadow = true;
  scene.add(plane);
  // secondary distant fog-colored plane to blend with sky at edges
  const geo2 = new THREE.PlaneGeometry(2000, 2000);
  const mat2 = new THREE.MeshBasicMaterial({ color: 0xa8d8ff, transparent: true, opacity: 0.12 });
  const plane2 = new THREE.Mesh(geo2, mat2);
  plane2.rotation.x = -Math.PI/2;
  plane2.position.y = -0.2;
  scene.add(plane2);
})();

// ---------- BEDROCK TEXTURE ----------
function makeBedrockTexture(){
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2b2b2b'; ctx.fillRect(0,0,size,size);
  // noise speckles
  for(let i=0;i<140;i++){
    const x=Math.random()*size, y=Math.random()*size;
    ctx.fillStyle = Math.random()<0.5 ? 'rgba(80,80,80,0.9)' : 'rgba(15,15,15,0.9)';
    ctx.fillRect(x,y,2,2);
  }
  ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.lineWidth=2; ctx.strokeRect(0,0,size,size);
  for(let i=0;i<size;i+=16){ ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.strokeRect(i,0,0.5,size); ctx.strokeRect(0,i,size,0.5); }
  const tex=new THREE.CanvasTexture(c);
  tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.NearestFilter; tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}

// ---------- MATERIALS ----------
const textures = {
  grassTop: makeTexture('#5db747'),
  grassSide: makeGrassSideTexture(),
  dirt: makeTexture('#8b5a2b'),
  stone: makeTexture('#9e9e9e'),
  sand: makeTexture('#e8d9a5'),
  woodSide: makeWoodSideTexture(),
  woodTop: makeWoodTopTexture(),
  leaves: makeTexture('#3a9d23'),
  water: makeTexture('#3a7bff', 'water'),
  bedrock: makeBedrockTexture(),
};

function getMaterialsForBlock(type) {
  if (type === 'grass') {
    return [
      new THREE.MeshLambertMaterial({ map: textures.grassSide }),
      new THREE.MeshLambertMaterial({ map: textures.grassSide }),
      new THREE.MeshLambertMaterial({ map: textures.grassTop }),
      new THREE.MeshLambertMaterial({ map: textures.dirt }),
      new THREE.MeshLambertMaterial({ map: textures.grassSide }),
      new THREE.MeshLambertMaterial({ map: textures.grassSide }),
    ];
  }
  if (type === 'wood') {
    return [
      new THREE.MeshLambertMaterial({ map: textures.woodSide }),
      new THREE.MeshLambertMaterial({ map: textures.woodSide }),
      new THREE.MeshLambertMaterial({ map: textures.woodTop }),
      new THREE.MeshLambertMaterial({ map: textures.woodTop }),
      new THREE.MeshLambertMaterial({ map: textures.woodSide }),
      new THREE.MeshLambertMaterial({ map: textures.woodSide }),
    ];
  }
  const mapByType = {
    dirt: textures.dirt,
    stone: textures.stone,
    sand: textures.sand,
    leaves: textures.leaves,
    water: textures.water,
    bedrock: textures.bedrock,
  };
  const tex = mapByType[type];
  if (!tex) return new THREE.MeshLambertMaterial({ color: 0xffffff });
  const opts = {};
  opts.map = tex;
  if (type === 'water') {
    return new THREE.MeshLambertMaterial({ map: tex, transparent: true, opacity: 0.68, color: 0x6aa0ff });
  }
  if (type === 'leaves') {
    return new THREE.MeshLambertMaterial({ map: tex, transparent: false });
  }
  const mat = new THREE.MeshLambertMaterial(opts);
  // reuse same mat for all faces but Three expects array of 6 materials when using BoxGeometry for distinct faces
  // we can return single mat - Three handles it
  return mat;
}

// ---------- WORLD DATA ----------
const world = new Map(); // key -> {type, mesh}
const worldMeshes = []; // for raycasting
const blockGeo = new THREE.BoxGeometry(1, 1, 1);

// helper to key
const key = (x, y, z) => `${x},${y},${z}`;
function getBlock(x, y, z) {
  return world.get(key(Math.floor(x), Math.floor(y), Math.floor(z))) || null;
}
function isSolid(x, y, z) {
  const b = getBlock(x, y, z);
  if (!b) return false;
  // water and air are not solid; leaves are solid (you can stand)
  if (b.type === 'water') return false;
  return true;
}

// Create block mesh; central guards keep world data, meshes, raycasts and collision in sync.
function createBlockMesh(bx, by, bz, type) {
  const blockKey = key(bx, by, bz);
  if (!isInsideWorld(bx, by, bz) || world.has(blockKey)) return null;

  const mats = getMaterialsForBlock(type);
  const mesh = new THREE.Mesh(blockGeo, mats);
  mesh.position.set(bx + 0.5, by + 0.5, bz + 0.5);
  mesh.updateMatrixWorld(true);
  mesh.castShadow = type !== 'water' && type !== 'leaves';
  mesh.receiveShadow = true;
  mesh.userData = { bx, by, bz, type };
  scene.add(mesh);
  world.set(blockKey, { type, mesh });
  worldMeshes.push(mesh);
  return mesh;
}

function disposeBlockMaterials(mesh) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  // Materials are per block; textures and blockGeo are shared and must stay alive.
  for (const material of new Set(materials)) material?.dispose();
}

function removeBlockMesh(bx, by, bz) {
  const k = key(bx, by, bz);
  const entry = world.get(k);
  if (!entry || isUnbreakable(entry.type)) return false;
  scene.remove(entry.mesh);
  const idx = worldMeshes.indexOf(entry.mesh);
  if (idx !== -1) worldMeshes.splice(idx, 1);
  disposeBlockMaterials(entry.mesh);
  // blockGeo and canvas textures are shared; do not dispose them here.
  world.delete(k);
  return true;
}

// ---------- NOISE ----------
function hash2(x, y) {
  // simple pseudo random
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function smoothNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  const lerp = (p, q, t) => p + (q - p) * t;
  const x1 = lerp(a, b, u);
  const x2 = lerp(c, d, u);
  return lerp(x1, x2, v);
}
function fbm(x, z) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < 4; i++) {
    sum += smoothNoise(x * freq * 0.08, z * freq * 0.08) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  return sum / norm;
}

// ---------- WORLD GENERATION ----------
function generateWorld() {
  // clear existing meshes/materials without disposing shared geometry or textures
  for (const [, entry] of world) {
    scene.remove(entry.mesh);
    disposeBlockMaterials(entry.mesh);
  }
  world.clear();
  worldMeshes.length = 0;

  const half = Math.floor(WORLD_SIZE / 2);

  // height map
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      const n = fbm(x, z); // 0..1
      const n2 = smoothNoise(x * 0.04, z * 0.04); // larger hills
      // combine
      let h = Math.floor(3 + n * 5 + n2 * 3);
      // add small variation near center for interesting start area
      // keep within limits
      h = Math.max(1, Math.min(9, h));

      // Pond carving: circular depression near center
      const distToCenter = Math.sqrt(x * x + z * z);
      let pondDepth = 0;
      if (distToCenter < 8) {
        pondDepth = Math.floor((8 - distToCenter) * 0.5);
        h -= pondDepth;
        if (h < 0) h = 0;
      }

      // place column
      for (let y = 0; y <= h; y++) {
        let type;
        if (y === h) {
          // top
          if (h <= WATER_LEVEL + 1 && distToCenter < 9) {
            type = 'sand';
          } else if (n > 0.75 && h > 6) {
            type = 'stone';
          } else {
            type = 'grass';
          }
        } else if (y >= h - 2) {
          type = 'dirt';
        } else {
          type = 'stone';
        }
        // sand near water level
        if (h <= 2 && y >= h - 1) type = 'sand';
        createBlockMesh(x, y, z, type);
      }

      // water filling for pond
      if (distToCenter < 7.5 && h < WATER_LEVEL + 1) {
        for (let y = h + 1; y <= WATER_LEVEL; y++) {
          // don't overwrite terrain, only where empty
          if (!getBlock(x, y, z)) {
            createBlockMesh(x, y, z, 'water');
          }
        }
      }
    }
  }
  // bedrock layer — неразрушимый фундамент мира (для теста механики неразрушимых блоков)
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      createBlockMesh(x, WORLD_MIN_Y, z, 'bedrock');
      // optional second layer at WORLD_MIN_Y+1 for extra safety at edges (необязательно)
      // создаём только по границе, чтобы не закрывать ландшафт
      const onBorder = x === -half || x === half-1 || z === -half || z === half-1;
      if (onBorder) createBlockMesh(x, WORLD_MIN_Y+1, z, 'bedrock');
    }
  }

  // Trees - place only on grass
  let treePositions = [];
  // fixed seeded positions + random
  for (let i = 0; i < 22; i++) {
    const tx = Math.floor(Math.random() * (WORLD_SIZE - 6)) - half + 3;
    const tz = Math.floor(Math.random() * (WORLD_SIZE - 6)) - half + 3;
    // avoid pond center
    if (Math.sqrt(tx * tx + tz * tz) < 9) continue;
    // find top y
    let topY = -1;
    for (let y = 12; y >= 0; y--) {
      const b = getBlock(tx, y, tz);
      if (b && b.type === 'grass') { topY = y; break; }
      if (b && b.type === 'sand') break; // no tree on sand
    }
    if (topY === -1) continue;
    // avoid overlapping
    let tooClose = treePositions.some(p => Math.hypot(p.x - tx, p.z - tz) < 4);
    if (tooClose) continue;
    treePositions.push({ x: tx, y: topY, z: tz });
    generateTree(tx, topY + 1, tz);
  }

  // Add some stone pillars / hills for visual interest
  // Small cactus-like? not needed

  updateHudBlocks();
}

function generateTree(tx, ty, tz) {
  const trunkHeight = 4 + Math.floor(Math.random() * 2); // 4-5
  for (let y = 0; y < trunkHeight; y++) {
    if (!getBlock(tx, ty + y, tz)) createBlockMesh(tx, ty + y, tz, 'wood');
  }
  const topY = ty + trunkHeight;
  // leaves layers
  const leafOffsets = [
    // layer 1 (just below top)
    { y: -1, r: 2 },
    { y: 0, r: 2 },
    { y: 1, r: 1 },
    { y: 2, r: 1 },
  ];
  leafOffsets.forEach(l => {
    for (let x = -l.r; x <= l.r; x++) {
      for (let z = -l.r; z <= l.r; z++) {
        // skip corners for roundness
        if (Math.abs(x) === l.r && Math.abs(z) === l.r && l.r === 2 && Math.random() < 0.4) continue;
        if (l.r === 1 && Math.abs(x) === 1 && Math.abs(z) === 1 && Math.random() < 0.5) continue;
        const bx = tx + x, by = topY + l.y, bz = tz + z;
        // don't overwrite trunk
        if (x === 0 && z === 0 && l.y <= 0) continue;
        if (getBlock(bx, by, bz)) continue;
        createBlockMesh(bx, by, bz, 'leaves');
      }
    }
  });
  // top leaf
  if (!getBlock(tx, topY + 2, tz)) createBlockMesh(tx, topY + 2, tz, 'leaves');
}

// initial gen
generateWorld();

// ---------- PLAYER ----------
const player = {
  pos: new THREE.Vector3(0, 10, 8),
  vel: new THREE.Vector3(0, 0, 0),
  yaw: 0, // rotation Y
  pitch: 0, // rotation X
  onGround: false,
};

// Find a clear spawn above a solid surface. player.pos is the camera/eye position.
function findSpawn() {
  const half = Math.floor(WORLD_SIZE / 2);
  const findInColumn = (x, z) => {
    for (let groundY = WORLD_MAX_Y; groundY >= WORLD_MIN_Y; groundY--) {
      if (!isSolid(x, groundY, z)) continue;
      const spawnX = x + 0.5;
      const spawnZ = z + 0.5;
      const eyeY = groundY + 1 + PLAYER_EYE_HEIGHT + 0.04;
      if (!isColliding(spawnX, eyeY, spawnZ)) return { x: spawnX, y: eyeY, z: spawnZ };
    }
    return null;
  };

  const preferredColumns = [[2, 6], [0, 8], [0, 0], [2, 2], [-2, 6]];
  let spawn = null;
  for (const [x, z] of preferredColumns) {
    spawn = findInColumn(x, z);
    if (spawn) break;
  }
  // Fallback for future terrain changes: find any walkable column away from the world edge.
  if (!spawn) {
    for (let x = -half + 1; x < half - 1 && !spawn; x++) {
      for (let z = -half + 1; z < half - 1 && !spawn; z++) {
        spawn = findInColumn(x, z);
      }
    }
  }

  player.pos.set(spawn?.x ?? 0.5, spawn?.y ?? (WORLD_MAX_Y - 1), spawn?.z ?? 0.5);
  player.vel.set(0, 0, 0);
  player.onGround = false;
}
findSpawn();

// ---------- CONTROLS ----------
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  // number keys
  if (e.code.startsWith('Digit')) {
    const num = parseInt(e.code.slice(5), 10);
    if (num >= 1 && num <= BLOCK_LIST.length) selectSlot(num - 1);
  }
  // prevent space scrolling
  if (e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

let mouseSensitivity = 0.0022;
let isPointerLocked = false;
let mouseDownLeft = false, mouseDownRight = false;

renderer.domElement.addEventListener('click', () => {
  if (!isPointerLocked && !menuVisible) {
    renderer.domElement.requestPointerLock();
  }
});
document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === renderer.domElement;
  if (!isPointerLocked) {
    mouseDownLeft = false;
    mouseDownRight = false;
    for (const code of Object.keys(keys)) keys[code] = false;
  }
  document.getElementById('pause-msg').classList.toggle('visible', !isPointerLocked && !menuVisible);
  document.getElementById('hint').classList.toggle('visible', isPointerLocked);
});

document.addEventListener('mousemove', (e) => {
  if (!isPointerLocked) return;
  player.yaw -= e.movementX * mouseSensitivity;
  player.pitch -= e.movementY * mouseSensitivity;
  player.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, player.pitch));
});

// ---------- HOTBAR ----------
let selectedIndex = 0;
const hotbarEl = document.getElementById('hotbar');

function buildHotbar() {
  hotbarEl.innerHTML = '';
  BLOCK_LIST.forEach((b, i) => {
    const slot = document.createElement('div');
    slot.className = 'hotbar-slot' + (i === selectedIndex ? ' selected' : '');
    slot.dataset.index = i;

    const icon = document.createElement('div');
    icon.className = 'slot-icon';
    // use texture canvas as background? Simplify: color + border + texture preview via canvas
    // create tiny canvas preview
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const ctx = c.getContext('2d');
    // pick icon color, with pattern
    let base = b.color || b.colorTop || b.icon;
    ctx.fillStyle = base;
    ctx.fillRect(0,0,32,32);
    // pixel pattern
    if (b.id === 'grass') {
      ctx.fillStyle = '#5db747'; ctx.fillRect(0,0,32,12);
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0,12,32,20);
      ctx.fillStyle = '#6e8f3a'; for(let x=0;x<32;x+=4) ctx.fillRect(x,12,4,2);
    } else if (b.id === 'wood') {
      ctx.fillStyle = '#8d6e3f'; ctx.fillRect(0,0,32,32);
      ctx.fillStyle = '#6d4c1d'; ctx.fillRect(6,0,3,32); ctx.fillRect(18,0,3,32);
    } else if (b.id === 'leaves') {
      ctx.fillStyle = '#3a9d23'; ctx.fillRect(0,0,32,32);
      ctx.fillStyle = '#2e7d1c'; for(let k=0;k<8;k++) ctx.fillRect(Math.random()*28, Math.random()*28, 4,4);
    } else if (b.id === 'water') {
      ctx.fillStyle = '#3a7bff'; ctx.fillRect(0,0,32,32);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; for(let k=0;k<6;k++) ctx.fillRect(Math.random()*28, Math.random()*16+4, 6,2);
    } else {
      // noise dots
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; for(let k=0;k<20;k++) ctx.fillRect(Math.random()*30, Math.random()*30, 2,2);
    }
    ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=2; ctx.strokeRect(0,0,32,32);
    // Convert to data URL for icon background
    icon.style.backgroundImage = `url(${c.toDataURL()})`;
    icon.style.backgroundSize = 'cover';

    const num = document.createElement('div');
    num.className = 'slot-number';
    num.textContent = i + 1;

    const name = document.createElement('div');
    name.className = 'slot-name';
    name.textContent = b.name;

    slot.appendChild(icon);
    slot.appendChild(num);
    slot.appendChild(name);
    slot.addEventListener('click', () => selectSlot(i));
    hotbarEl.appendChild(slot);
  });
}
function selectSlot(i) {
  selectedIndex = i;
  document.querySelectorAll('.hotbar-slot').forEach((el, idx) => {
    el.classList.toggle('selected', idx === i);
  });
}
buildHotbar();
selectSlot(0);

// wheel
window.addEventListener('wheel', (e) => {
  if (menuVisible) return;
  const dir = Math.sign(e.deltaY);
  let next = selectedIndex + dir;
  if (next < 0) next = BLOCK_LIST.length - 1;
  if (next >= BLOCK_LIST.length) next = 0;
  selectSlot(next);
});

// ---------- HIGHLIGHT BOX (визуальное выделение) ----------
const highlightGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const highlightFillMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.10, depthTest: false });
const highlightFill = new THREE.Mesh(highlightGeo, highlightFillMat);
highlightFill.visible = false;
highlightFill.renderOrder = 999;
scene.add(highlightFill);
const highlightEdges = new THREE.EdgesGeometry(highlightGeo);
const highlightLineMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.95, depthTest: false });
const highlightBox = new THREE.LineSegments(highlightEdges, highlightLineMat);
highlightBox.visible = false;
highlightBox.renderOrder = 1000;
scene.add(highlightBox);

// Use raycaster for block selection — определяет блок под прицелом строго через Three.js Raycaster
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
let currentHit = null; // {bx,by,bz, faceNormal, point, distance, mesh, type}

function updateRaycast() {
  const hudTarget = document.getElementById('hud-target');
  if (menuVisible || worldMeshes.length === 0) {
    highlightBox.visible = false;
    highlightFill.visible = false;
    currentHit = null;
    if (hudTarget) { hudTarget.textContent = '—'; hudTarget.style.color = ''; }
    return;
  }
  // Camera transforms change with mouse-look; keep the ray aligned before casting.
  camera.updateMatrixWorld(true);
  raycaster.setFromCamera(center, camera);
  raycaster.far = INTERACTION_RANGE; // ограничение дальности 5 блоков
  const hits = raycaster.intersectObjects(worldMeshes, false);
  if (hits.length === 0) {
    highlightBox.visible = false;
    highlightFill.visible = false;
    currentHit = null;
    if (hudTarget) { hudTarget.textContent = '—'; hudTarget.style.color = ''; }
    return;
  }
  const hit = hits[0];
  const mesh = hit.object;
  const { bx, by, bz, type } = mesh.userData;
  highlightBox.position.set(bx + 0.5, by + 0.5, bz + 0.5);
  highlightFill.position.set(bx + 0.5, by + 0.5, bz + 0.5);
  highlightBox.visible = true;
  highlightFill.visible = true;
  // цвет выделения: красный для неразрушимых
  const unbreak = isUnbreakable(type);
  highlightLineMat.color.setHex(unbreak ? 0xff3344 : 0x111111);
  highlightFillMat.color.setHex(unbreak ? 0xff3344 : 0x000000);
  highlightFillMat.opacity = unbreak ? 0.18 : 0.10;
  // get face normal for placement
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
  const faceNormal = new THREE.Vector3(
    Math.round(worldNormal.x),
    Math.round(worldNormal.y),
    Math.round(worldNormal.z)
  );
  currentHit = { bx, by, bz, type, faceNormal, point: hit.point.clone(), distance: hit.distance, mesh };
  if (hudTarget) {
    const dist = hit.distance.toFixed(1);
    hudTarget.textContent = `${type} ${bx},${by},${bz} [${dist}м]${unbreak ? ' ⛔' : ''}`;
    hudTarget.style.color = unbreak ? '#ff6666' : '#7cfc00';
  }
}

// ---------- PARTICLES ПРИ РАЗРУШЕНИИ ----------
const particles = [];
const particleGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
function spawnBreakParticles(bx, by, bz, type){
  // цвет частицы по типу блока
  const colorMap = {
    grass: 0x5db747, dirt: 0x8b5a2b, stone: 0x9e9e9e, sand: 0xe8d9a5,
    wood: 0x8d6e3f, leaves: 0x3a9d23, water: 0x3a7bff, bedrock: 0x333333
  };
  const col = new THREE.Color(colorMap[type] || 0xffffff);
  for(let i=0;i<12;i++){
    const mat = new THREE.MeshLambertMaterial({ color: col.clone().multiplyScalar(0.85 + Math.random()*0.3), transparent:true, opacity:1 });
    const m = new THREE.Mesh(particleGeo, mat);
    m.position.set(bx+0.5, by+0.5, bz+0.5);
    m.castShadow = false;
    m.receiveShadow = false;
    const vel = new THREE.Vector3(
      (Math.random()-0.5)*6,
      Math.random()*5 + 1,
      (Math.random()-0.5)*6
    );
    // небольшой импульс в сторону камеры для эффекта
    if(currentHit){
      vel.addScaledVector(currentHit.faceNormal, -0.8);
    }
    scene.add(m);
    particles.push({ mesh:m, vel, life:0.55 + Math.random()*0.25, age:0, spin: new THREE.Vector3((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10) });
  }
}
function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.age += dt;
    p.life -= dt;
    // гравитация
    p.vel.y -= 12 * dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.vel.multiplyScalar(0.985);
    p.mesh.rotation.x += p.spin.x * dt;
    p.mesh.rotation.y += p.spin.y * dt;
    p.mesh.rotation.z += p.spin.z * dt;
    if(p.mesh.material) p.mesh.material.opacity = Math.max(0, p.life*1.8);
    if(p.life <= 0){
      scene.remove(p.mesh);
      if(p.mesh.material) p.mesh.material.dispose();
      particles.splice(i,1);
    }
  }
}

// ---------- SOUND (Web Audio) С ВОЗМОЖНОСТЬЮ ОТКЛЮЧЕНИЯ ----------
let audioCtx = null;
let soundEnabled = true;
function initAudio(){
  if(audioCtx) return;
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }catch(e){ console.warn('AudioContext not supported', e); }
}
function ensureAudio(){
  if(!audioCtx) initAudio();
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
}
function updateSoundUI(){
  const btn = document.getElementById('soundToggle');
  if(!btn) return;
  btn.textContent = soundEnabled ? '🔊 Звук: вкл' : '🔇 Звук: выкл';
  btn.classList.toggle('muted', !soundEnabled);
}
function toggleSound(){
  soundEnabled = !soundEnabled;
  updateSoundUI();
  if(soundEnabled) ensureAudio();
  else if(audioCtx?.state === 'running') audioCtx.suspend().catch(()=>{});
}
document.getElementById('soundToggle')?.addEventListener('click', (e)=>{
  e.stopPropagation();
  toggleSound();
});
updateSoundUI();
window.addEventListener('keydown', (e)=>{
  if(e.code === 'KeyM' && !e.repeat){
    toggleSound();
  }
});
function playBreakSound(type){
  if(!soundEnabled) return;
  ensureAudio();
  if(!audioCtx) return;
  const t = audioCtx.currentTime;
  const master = audioCtx.createGain();
  master.gain.value = 0.5;
  master.connect(audioCtx.destination);
  // низкочастотный удар
  const osc = audioCtx.createOscillator();
  osc.type='square';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(50, t+0.14);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.45, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t+0.18);
  osc.connect(gain); gain.connect(master);
  osc.start(t); osc.stop(t+0.18);
  // шумовой щелчок: буфер
  const len = Math.floor(audioCtx.sampleRate*0.08);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for(let i=0;i<len;i++) data[i]=(Math.random()*2-1)*Math.pow(1 - i/len, 2);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const f = audioCtx.createBiquadFilter();
  f.type='highpass'; f.frequency.value=1800;
  const g2 = audioCtx.createGain();
  g2.gain.setValueAtTime(0.35, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t+0.08);
  src.connect(f); f.connect(g2); g2.connect(master);
  src.start(t);
}
function playPlaceSound(){
  if(!soundEnabled) return;
  ensureAudio();
  if(!audioCtx) return;
  const t = audioCtx.currentTime;
  const master = audioCtx.createGain();
  master.gain.value = 0.42;
  master.connect(audioCtx.destination);
  // клик установки — выше тона, короткий
  const osc = audioCtx.createOscillator();
  osc.type='triangle';
  osc.frequency.setValueAtTime(320, t);
  osc.frequency.linearRampToValueAtTime(460, t+0.07);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t+0.12);
  osc.connect(gain); gain.connect(master);
  osc.start(t); osc.stop(t+0.12);
  // второй слой
  const osc2 = audioCtx.createOscillator();
  osc2.type='sine';
  osc2.frequency.setValueAtTime(700, t);
  osc2.frequency.linearRampToValueAtTime(500, t+0.05);
  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0.22, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t+0.06);
  osc2.connect(gain2); gain2.connect(master);
  osc2.start(t); osc2.stop(t+0.06);
}
function playDeniedSound(){
  if(!soundEnabled) return;
  ensureAudio();
  if(!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type='sine'; o.frequency.setValueAtTime(120, t);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t+0.15);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(t); o.stop(t+0.15);
}

// ---------- BLOCK INTERACTION (полноценное) ----------
// Проверяет границы, дубликаты и AABB-пересечение с телом игрока.
function canPlaceAt(x, y, z) {
  if (!isInsideWorld(x, y, z) || getBlock(x, y, z)) return false;

  const feetY = player.pos.y - PLAYER_EYE_HEIGHT;
  const headY = feetY + PLAYER_HEIGHT;
  const playerMinX = player.pos.x - PLAYER_WIDTH / 2;
  const playerMaxX = player.pos.x + PLAYER_WIDTH / 2;
  const playerMinZ = player.pos.z - PLAYER_WIDTH / 2;
  const playerMaxZ = player.pos.z + PLAYER_WIDTH / 2;

  const overlapsX = playerMinX < x + 1 && playerMaxX > x;
  const overlapsY = feetY < y + 1 && headY > y;
  const overlapsZ = playerMinZ < z + 1 && playerMaxZ > z;
  return !(overlapsX && overlapsY && overlapsZ);
}

// Cooldowns also protect repeated mouse/touch input and avoid duplicate updates.
let breakCooldown = 0, placeCooldown = 0;
function tryBreak() {
  if (menuVisible || !currentHit || currentHit.distance > INTERACTION_RANGE || breakCooldown > 0) return;
  const { bx, by, bz, mesh } = currentHit;
  const entry = getBlock(bx, by, bz);
  if (!entry || entry.mesh !== mesh) return; // уже удалён или устаревший raycast-hit
  if (isUnbreakable(entry.type)) {
    playDeniedSound();
    breakCooldown = 0.18;
    return;
  }

  spawnBreakParticles(bx, by, bz, entry.type);
  playBreakSound(entry.type);
  if (removeBlockMesh(bx, by, bz)) {
    breakCooldown = 0.15;
    updateHudBlocks();
    // Preserve the existing small punch/camera feedback on a successful break.
    camera.position.x += (Math.random() - 0.5) * 0.04;
  }
}
function tryPlace() {
  if (menuVisible || !currentHit || currentHit.distance > INTERACTION_RANGE || placeCooldown > 0) return;
  const { bx, by, bz, faceNormal, mesh } = currentHit;
  const target = getBlock(bx, by, bz);
  if (!target || target.mesh !== mesh) return; // target could have been broken this frame

  const nx = bx + faceNormal.x;
  const ny = by + faceNormal.y;
  const nz = bz + faceNormal.z;
  if (!isInsideWorld(nx, ny, nz)) {
    playDeniedSound();
    placeCooldown = 0.12;
    return;
  }
  if (!canPlaceAt(nx, ny, nz)) {
    if (!getBlock(nx, ny, nz)) playDeniedSound();
    placeCooldown = 0.12;
    return;
  }

  const blockType = BLOCK_LIST[selectedIndex]?.id;
  if (!blockType || isUnbreakable(blockType)) return;
  // createBlockMesh atomically adds the block to world data, raycasts and collision checks.
  if (createBlockMesh(nx, ny, nz, blockType)) {
    playPlaceSound();
    placeCooldown = 0.16;
    updateHudBlocks();
  }
}

// Mouse actions are accepted only in the active, pointer-locked game.
renderer.domElement.addEventListener('mousedown', (e) => {
  if (menuVisible || !isPointerLocked) return;
  if (e.button === 0) {
    mouseDownLeft = true;
    tryBreak();
  } else if (e.button === 2) {
    e.preventDefault();
    mouseDownRight = true;
    tryPlace();
  }
});
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouseDownLeft = false;
  if (e.button === 2) mouseDownRight = false;
});
window.addEventListener('blur', () => {
  mouseDownLeft = false;
  mouseDownRight = false;
  for (const code of Object.keys(keys)) keys[code] = false;
});

// ---------- PHYSICS & COLLISION ----------
function checkCollisionAt(x, y, z) {
  // AABB check: player bounding box vs block
  // player.pos is eye position; feet = pos.y - PLAYER_EYE_HEIGHT
  const feetY = y - PLAYER_EYE_HEIGHT; // not needed
  // Instead we test player bbox vs block at given feet position
  // We'll implement helper that tests player at position (px, py, pz) where py is eye Y
  return false;
}

function isColliding(px, py, pz) {
  // px, pz eye X,Z ; py eye Y
  const feetY = py - PLAYER_EYE_HEIGHT;
  const headY = feetY + PLAYER_HEIGHT;
  const minX = px - PLAYER_WIDTH / 2 + 0.001;
  const maxX = px + PLAYER_WIDTH / 2 - 0.001;
  const minZ = pz - PLAYER_WIDTH / 2 + 0.001;
  const maxZ = pz + PLAYER_WIDTH / 2 - 0.001;

  // check blocks overlapping
  const yStart = Math.floor(feetY);
  const yEnd = Math.floor(headY);
  const xStart = Math.floor(minX);
  const xEnd = Math.floor(maxX);
  const zStart = Math.floor(minZ);
  const zEnd = Math.floor(maxZ);

  for (let y = yStart; y <= yEnd; y++) {
    for (let x = xStart; x <= xEnd; x++) {
      for (let z = zStart; z <= zEnd; z++) {
        if (isSolid(x, y, z)) {
          // AABB overlap already via integer check; but need precise feet check
          // For simplicity, if any solid block inside expanded range, collision
          // But need to check actual overlap on Y: block y..y+1 vs feetY..headY
          const bMinY = y, bMaxY = y + 1;
          if (headY <= bMinY || feetY >= bMaxY) continue;
          return true;
        }
      }
    }
  }
  return false;
}

function moveAndCollide(dt) {
  // handle input movement vector
  let moveX = 0, moveZ = 0;
  if (keys['KeyW']) moveZ -= 1;
  if (keys['KeyS']) moveZ += 1;
  if (keys['KeyA']) moveX -= 1;
  if (keys['KeyD']) moveX += 1;

  const isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];
  const speed = isSprinting ? SPRINT_SPEED : WALK_SPEED;

  // normalize
  if (moveX !== 0 || moveZ !== 0) {
    const len = Math.hypot(moveX, moveZ);
    moveX /= len; moveZ /= len;
    // rotate by yaw
    const yaw = player.yaw;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    // forward is -Z? Actually we want: when yaw 0, forward = -Z
    // Input: moveZ -1 = forward, moveX -1 = left
    // Transform:
    let worldX = moveX * cos - moveZ * sin;
    let worldZ = moveX * sin + moveZ * cos;
    // scale by speed
    worldX *= speed * dt;
    worldZ *= speed * dt;

    // attempt X move
    const newX = player.pos.x + worldX;
    if (!isColliding(newX, player.pos.y, player.pos.z)) {
      player.pos.x = newX;
    } else {
      // try slide with smaller step
      // step iteration
      for (let s = 0; s < 4; s++) {
        const stepX = worldX * 0.25;
        const testX = player.pos.x + stepX;
        if (!isColliding(testX, player.pos.y, player.pos.z)) player.pos.x = testX;
        else break;
      }
    }
    // Z move
    const newZ = player.pos.z + worldZ;
    if (!isColliding(player.pos.x, player.pos.y, newZ)) {
      player.pos.z = newZ;
    } else {
      for (let s = 0; s < 4; s++) {
        const stepZ = worldZ * 0.25;
        const testZ = player.pos.z + stepZ;
        if (!isColliding(player.pos.x, player.pos.y, testZ)) player.pos.z = testZ;
        else break;
      }
    }
  }

  // gravity + jump
  const onGround = isColliding(player.pos.x, player.pos.y - 0.02, player.pos.z);
  player.onGround = onGround;

  if (onGround && player.vel.y <= 0) {
    player.vel.y = 0;
    if (keys['Space']) {
      player.vel.y = JUMP_FORCE;
      player.onGround = false;
    }
  } else {
    // apply gravity
    player.vel.y -= GRAVITY * dt;
  }

  // clamp fall speed
  if (player.vel.y < -30) player.vel.y = -30;

  // vertical movement with collision
  let vy = player.vel.y * dt;
  const steps = 4;
  const stepY = vy / steps;
  for (let i = 0; i < steps; i++) {
    const testY = player.pos.y + stepY;
    if (!isColliding(player.pos.x, testY, player.pos.z)) {
      player.pos.y = testY;
    } else {
      if (stepY < 0) {
        // hit ground
        player.vel.y = 0;
        player.onGround = true;
        // snap to just above ground? Find ground height
        // Search for ground block below
        // we are colliding at testY, so we are just above ground; keep current
      } else {
        // hit ceiling
        player.vel.y = 0;
      }
      break;
    }
  }

  // prevent falling through world forever - reset if below -20
  if (player.pos.y < -15) {
    findSpawn();
  }

  // world bounds clamp
  const half = WORLD_SIZE / 2 - 0.5;
  if (player.pos.x < -half) player.pos.x = -half;
  if (player.pos.x > half) player.pos.x = half;
  if (player.pos.z < -half) player.pos.z = -half;
  if (player.pos.z > half) player.pos.z = half;
}

// ---------- HUD ----------
function updateHudBlocks() {
  document.getElementById('hud-blocks').textContent = world.size.toString();
}
function updateHudPos() {
  const x = player.pos.x.toFixed(1), y = (player.pos.y - PLAYER_EYE_HEIGHT).toFixed(1), z = player.pos.z.toFixed(1);
  document.getElementById('hud-pos').textContent = `${x}, ${y}, ${z}`;
}

// ---------- MENU ----------
let menuVisible = true;
const menuEl = document.getElementById('menu');
const playBtn = document.getElementById('playBtn');
playBtn.addEventListener('click', startGame);
function startGame() {
  menuVisible = false;
  menuEl.classList.add('hidden');
  renderer.domElement.requestPointerLock();
  // re-find spawn to ensure not inside block after menu
  // findSpawn() already
}
 // also allow clicking menu background to start? no

// handle ESC to return to menu? Spec says pause - we show pause-msg, not menu. Menu only at start.
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && !menuVisible) {
    // If pointer locked, ESC will unlock automatically; we show pause message via pointerlockchange
    // If already unlocked and user presses ESC again, show menu? Keep hidden, just instruction
    // Optionally allow press ESC while unlocked to show menu again? We'll keep simple: if not locked, do nothing
  }
});

// ---------- RESIZE ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- ANIMATION LOOP ----------
const clock = new THREE.Clock();
let lastHudUpdate = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05); // cap

  if (!menuVisible) {
    breakCooldown = Math.max(0, breakCooldown - dt);
    placeCooldown = Math.max(0, placeCooldown - dt);
    if (isPointerLocked) moveAndCollide(dt);

    // Update camera/ray first so held actions always use the block under the current crosshair.
    camera.position.copy(player.pos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    updateRaycast();

    // Hold-to-repeat for desktop; touch controls call tryBreak/tryPlace on tap.
    if (isPointerLocked && mouseDownLeft && breakCooldown <= 0) tryBreak();
    if (isPointerLocked && mouseDownRight && placeCooldown <= 0) tryPlace();

    // subtle cloud drift
    clouds.position.x += dt * 0.6;
    clouds.position.z += dt * 0.15;
    if (clouds.position.x > 60) clouds.position.x = -60;
  } else {
    // menu camera orbit preview
    const t = clock.elapsedTime * 0.15;
    camera.position.set(Math.sin(t) * 32, 18 + Math.sin(t*0.5)*2, Math.cos(t) * 32);
    camera.lookAt(0, 4, 0);
    updateRaycast(); // not needed but okay
  }

  updateParticles(dt);

  // HUD throttled
  lastHudUpdate += dt;
  if (lastHudUpdate > 0.1) {
    updateHudPos();
    lastHudUpdate = 0;
  }

  renderer.render(scene, camera);
}
animate();

// ---------- INITIAL HUD ----------
updateHudBlocks();
updateHudPos();

// ---------- TOUCH FALLBACK (mobile) ----------
let touchLookActive = false;
let lastTouchX = 0, lastTouchY = 0;
renderer.domElement.addEventListener('touchstart', e => {
  if (menuVisible) return;
  touchLookActive = true;
  lastTouchX = e.touches[0].clientX;
  lastTouchY = e.touches[0].clientY;
}, {passive:false});
renderer.domElement.addEventListener('touchmove', e => {
  if (!touchLookActive) return;
  const dx = e.touches[0].clientX - lastTouchX;
  const dy = e.touches[0].clientY - lastTouchY;
  player.yaw -= dx * 0.005;
  player.pitch -= dy * 0.005;
  player.pitch = Math.max(-1.4, Math.min(1.4, player.pitch));
  lastTouchX = e.touches[0].clientX;
  lastTouchY = e.touches[0].clientY;
  e.preventDefault();
}, {passive:false});
renderer.domElement.addEventListener('touchend', ()=> touchLookActive=false);

// Simple on-screen joystick overlay for mobile movement (create buttons)
function createMobileControls() {
  const style = document.createElement('style');
  style.textContent = `
    .mobile-ctrl { position:absolute; bottom:110px; left:14px; z-index:15; display:none; gap:8px; flex-direction:column; }
    .mobile-ctrl .row { display:flex; gap:8px; }
    .mbtn { width:54px; height:54px; background:rgba(0,0,0,0.45); border:2px solid #000; color:#fff; font-size:20px; display:flex; align-items:center; justify-content:center; border-radius:8px; user-select:none; }
    .mbtn:active { background:rgba(255,255,255,0.25); }
    .m-side { position:absolute; bottom:110px; right:14px; z-index:15; display:none; flex-direction:column; gap:8px; }
    @media (pointer:coarse) { .mobile-ctrl, .m-side { display:flex; } }
  `;
  document.head.appendChild(style);
  const left = document.createElement('div');
  left.className = 'mobile-ctrl';
  left.innerHTML = `
    <div class="row" style="justify-content:center"><div class="mbtn" data-key="KeyW">▲</div></div>
    <div class="row"><div class="mbtn" data-key="KeyA">◀</div><div class="mbtn" data-key="KeyS">▼</div><div class="mbtn" data-key="KeyD">▶</div></div>
    <div class="row" style="justify-content:center; gap:12px"><div class="mbtn" data-key="Space" style="width:70px">⤒</div><div class="mbtn" data-key="ShiftLeft" style="width:70px">⚡</div></div>
  `;
  container.appendChild(left);
  const right = document.createElement('div');
  right.className = 'm-side';
  right.innerHTML = `
    <div class="mbtn" id="m-break" style="background:#8b4513; border-color:#000;">⛏</div>
    <div class="mbtn" id="m-place" style="background:#3a7bff;">▣</div>
  `;
  container.appendChild(right);
  left.querySelectorAll('.mbtn').forEach(b=>{
    const code = b.dataset.key;
    if(!code) return;
    const down = (e)=>{ e.preventDefault(); keys[code]=true; };
    const up = (e)=>{ e.preventDefault(); keys[code]=false; };
    b.addEventListener('touchstart', down, {passive:false});
    b.addEventListener('touchend', up, {passive:false});
    b.addEventListener('mousedown', down);
    b.addEventListener('mouseup', up);
  });
  document.getElementById('m-break')?.addEventListener('touchstart', (e)=>{ e.preventDefault(); tryBreak(); });
  document.getElementById('m-place')?.addEventListener('touchstart', (e)=>{ e.preventDefault(); tryPlace(); });
  document.getElementById('m-break')?.addEventListener('click', tryBreak);
  document.getElementById('m-place')?.addEventListener('click', tryPlace);
}
createMobileControls();

console.log('Minecraft HTML ready. World size', WORLD_SIZE);
