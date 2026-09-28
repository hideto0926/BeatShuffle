// BeatShuffle hero scene (three.js)
// ロゴのシャッフル矢印を 3D のリボンとして描き、ビートに合わせて脈打たせる。
// 周りをレコード盤（テーマの7色）とパーティクルが漂い、スクロールとマウスに反応する。
import * as THREE from 'three';

const canvas = document.getElementById('scene');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
camera.position.set(0, 0, 22);

// ------------------------------------------------------------------ 色
const C = {
  cyan: new THREE.Color('#0BB8FF'), blue: new THREE.Color('#3D6BFF'), purple: new THREE.Color('#9B4DF5'),
  pink: new THREE.Color('#FF3D9A'), orange: new THREE.Color('#FFB23A'),
};
const THEME = ['#E8424D', '#F2801F', '#DBA305', '#2EAD66', '#2185F2', '#595EE0', '#9E5CE6'].map(h => new THREE.Color(h));
const accent = new THREE.Color('#9E5CE6');

// ------------------------------------------------------------------ 共通の陰影
// 塗り色（グラデーション or 単色）に、柔らかい拡散光・スペキュラ・リムを足すだけの軽いシェーダ
const shadeGLSL = /* glsl */`
  vec3 shade(vec3 base, vec3 N, vec3 V, float beat){
    vec3 L = normalize(vec3(0.35, 0.8, 1.0));
    float diff = 0.62 + 0.38 * max(dot(N, L), 0.0);
    float spec = pow(max(dot(reflect(-L, N), V), 0.0), 28.0);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.4);
    return base * diff + vec3(1.0) * (spec * 0.45 + rim * 0.18) + base * beat * 0.18;
  }`;

const vert = /* glsl */`
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

function ribbonMaterial(stops) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uProgress: { value: 0 }, uBeat: { value: 0 }, uOpacity: { value: 1 },
      uC0: { value: stops[0] }, uC1: { value: stops[1] }, uC2: { value: stops[2] }, uC3: { value: stops[3] },
    },
    vertexShader: vert,
    fragmentShader: /* glsl */`
      uniform float uProgress, uBeat, uOpacity; uniform vec3 uC0, uC1, uC2, uC3;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      ${shadeGLSL}
      void main(){
        if (vUv.x > uProgress) discard;               // 描かれていくアニメーション
        float t = vUv.x;
        vec3 c = t < 0.33 ? mix(uC0, uC1, t / 0.33) : t < 0.66 ? mix(uC1, uC2, (t - 0.33) / 0.33) : mix(uC2, uC3, (t - 0.66) / 0.34);
        gl_FragColor = vec4(shade(c, normalize(vN), normalize(vV), uBeat), uOpacity);
      }`,
  });
}

function solidMaterial(color) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uColor: { value: color }, uBeat: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: vert,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uBeat, uOpacity;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      ${shadeGLSL}
      void main(){ gl_FragColor = vec4(shade(uColor, normalize(vN), normalize(vV), uBeat), uOpacity); }`,
  });
}

// ------------------------------------------------------------------ ロゴ（シャッフル矢印）
// 座標はロゴ画像の矢印部分（846×556 px）。中心を原点に、100px = 1 ユニット。
const toW = (x, y, z = 0) => new THREE.Vector3((x - 423) / 100, -(y - 272) / 100, z);

function arrowCurve(y0, y1, depth) {
  const path = new THREE.CurvePath();
  path.add(new THREE.LineCurve3(toW(56, y0), toW(170, y0)));
  // 交差部で奥行きをずらし、上向きの矢印が手前を通るようにする
  path.add(new THREE.CubicBezierCurve3(toW(170, y0), toW(390, y0, depth), toW(400, y1, depth), toW(600, y1)));
  path.add(new THREE.LineCurve3(toW(600, y1), toW(690, y1)));
  return path;
}

const logo = new THREE.Group();
scene.add(logo);
const R = 0.56; // 線の太さ（ロゴの 112px の半分）

const matA = ribbonMaterial([C.cyan, C.blue, C.pink, C.orange]);   // 左上 → 右下
const matB = ribbonMaterial([C.cyan, C.purple, C.pink, C.pink]);   // 左下 → 右上
const tubeA = new THREE.Mesh(new THREE.TubeGeometry(arrowCurve(121, 424, -0.7), 260, R, 36), matA);
const tubeB = new THREE.Mesh(new THREE.TubeGeometry(arrowCurve(424, 121, 0.7), 260, R, 36), matB);
logo.add(tubeA, tubeB);

// 始点の丸いキャップ
const capGeo = new THREE.SphereGeometry(R, 32, 16);
const capA = new THREE.Mesh(capGeo, solidMaterial(C.cyan));
const capB = new THREE.Mesh(capGeo, solidMaterial(C.cyan));
capA.position.copy(toW(56, 121)); capB.position.copy(toW(56, 424));
logo.add(capA, capB);

// 矢じり（角の丸い三角柱）
const tri = new THREE.Shape();
tri.moveTo(0, -1.0); tri.lineTo(1.46, 0); tri.lineTo(0, 1.0); tri.closePath();
const headGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.2, bevelSegments: 8, curveSegments: 4 });
headGeo.translate(0, 0, -0.275);
const headA = new THREE.Mesh(headGeo, solidMaterial(C.orange));
const headB = new THREE.Mesh(headGeo, solidMaterial(C.pink));
headA.position.copy(toW(672, 424)); headB.position.copy(toW(672, 121));
logo.add(headA, headB);

const logoMats = [matA, matB, capA.material, capB.material, headA.material, headB.material];
const CROSS = toW(395, 272); // 交差点。ビートの波紋はここから広がる

// ------------------------------------------------------------------ ビートの波紋
const rings = [];
const ringGeo = new THREE.RingGeometry(0.98, 1.0, 96);
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: C.purple, transparent: true, opacity: 0, depthWrite: false }));
  m.position.copy(CROSS); m.userData.t = 1;
  logo.add(m); rings.push(m);
}
let ringCursor = 0;
function emitRing(color) {
  const r = rings[ringCursor++ % rings.length];
  r.userData.t = 0; r.material.color.copy(color);
}

// ------------------------------------------------------------------ レコード盤
const recordGeo = new THREE.CircleGeometry(1.25, 96);
const recordMat = (label) => new THREE.ShaderMaterial({
  transparent: true,
  uniforms: { uLabel: { value: label }, uTime: { value: 0 }, uOpacity: { value: 1 } },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform vec3 uLabel; uniform float uTime, uOpacity; varying vec2 vUv;
    void main(){
      vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
      if (r > 1.0 || r < 0.035) discard;
      float edge = smoothstep(1.0, 0.985, r);
      vec3 vinyl = vec3(0.07, 0.07, 0.10) + 0.035 * sin(r * 230.0);
      // 盤面に斜めに走る光沢
      vinyl += vec3(0.30) * pow(abs(cos(a * 1.0 - 0.8)), 18.0) * smoothstep(0.3, 0.9, r);
      vec3 col = r < 0.36 ? mix(uLabel, vec3(1.0), 0.12 * sin(a * 2.0 + uTime)) : vinyl;
      if (r < 0.36 && r > 0.33) col *= 0.8;
      gl_FragColor = vec4(col, edge * uOpacity);
    }`,
});
const records = THEME.map((color, i) => {
  const holder = new THREE.Group();
  const disc = new THREE.Mesh(recordGeo, recordMat(color));
  holder.add(disc);
  holder.userData = { i, disc, phase: Math.random() * Math.PI * 2, spin: 0.6 + Math.random() * 0.8 };
  scene.add(holder);
  return holder;
});

// ------------------------------------------------------------------ パーティクル
const isSmall = Math.min(window.innerWidth, window.innerHeight) < 700;
const COUNT = isSmall ? 420 : 900;
const pGeo = new THREE.BufferGeometry();
const pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3), seed = new Float32Array(COUNT);
const palette = [C.cyan, C.blue, C.purple, C.pink, C.orange];
for (let i = 0; i < COUNT; i++) {
  pos[i * 3] = (Math.random() - 0.5) * 40;
  pos[i * 3 + 1] = (Math.random() - 0.5) * 26;
  pos[i * 3 + 2] = (Math.random() - 0.5) * 18 - 4;
  const c = palette[i % palette.length];
  col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  seed[i] = Math.random();
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
pGeo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
const pMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, vertexColors: true,
  uniforms: { uTime: { value: 0 }, uBeat: { value: 0 }, uScale: { value: 1 }, uAccent: { value: accent }, uScroll: { value: 0 } },
  vertexShader: /* glsl */`
    attribute float seed; uniform float uTime, uBeat, uScale, uScroll; uniform vec3 uAccent;
    varying vec3 vColor; varying float vAlpha;
    void main(){
      vec3 p = position;
      p.y = mod(p.y + uTime * (0.25 + seed * 0.5) + uScroll * 6.0 + 13.0, 26.0) - 13.0;   // ゆっくり上昇
      p.x += sin(uTime * 0.4 + seed * 20.0) * 0.6;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (2.0 + seed * 5.0) * (1.0 + uBeat * 0.6) * uScale * (22.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
      vColor = mix(color, uAccent, step(0.82, seed) * 0.9);
      vAlpha = 0.35 + seed * 0.45;
    }`,
  fragmentShader: /* glsl */`
    varying vec3 vColor; varying float vAlpha;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      gl_FragColor = vec4(vColor, vAlpha * smoothstep(0.5, 0.15, d));
    }`,
});
const points = new THREE.Points(pGeo, pMat);
scene.add(points);

// ------------------------------------------------------------------ 入力
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  pointer.tx = e.clientX / window.innerWidth - 0.5;
  pointer.ty = e.clientY / window.innerHeight - 0.5;
}, { passive: true });

let spinStart = -10; // テーマカラー変更でロゴがくるっと回る
window.addEventListener('bs-accent', (e) => {
  accent.set(e.detail);
  spinStart = clock.getElapsedTime();
  for (let i = 0; i < 3; i++) setTimeout(() => emitRing(accent), i * 140);
});

// ------------------------------------------------------------------ レイアウト
let wide = true;
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  wide = camera.aspect > 0.95;
  pMat.uniforms.uScale.value = renderer.getPixelRatio();
}
window.addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------ ループ
const clock = new THREE.Clock();
const BPM = 118;
let lastBeat = -1;
const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
const back = (t) => { t = Math.min(Math.max(t, 0), 1); const s = 1.9; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };

function frame() {
  const t = reduceMotion ? 3 : clock.getElapsedTime();
  const vh = window.innerHeight;
  const docH = Math.max(1, document.documentElement.scrollHeight - vh);
  const heroP = Math.min(window.scrollY / vh, 1.4);           // ヒーローを抜けるまで
  const pageP = window.scrollY / docH;                         // ページ全体

  // --- 描き込み（起動アニメと同じ流れ） ---
  const pA = ease((t - 0.3) / 0.9), pB = ease((t - 0.45) / 0.9);
  matA.uniforms.uProgress.value = pA * 1.001;
  matB.uniforms.uProgress.value = pB * 1.001;
  capA.visible = pA > 0.001; capB.visible = pB > 0.001;
  const hs = back((t - 1.25) / 0.45);
  headA.scale.setScalar(Math.max(hs, 0.001)); headB.scale.setScalar(Math.max(hs, 0.001));

  // --- ビート ---
  let beat = 0;
  if (!reduceMotion && t > 1.8) {
    const b = (t - 1.8) * BPM / 60;
    const n = Math.floor(b);
    beat = Math.exp(-(b - n) * 6);
    if (n !== lastBeat) { lastBeat = n; if (n % 2 === 0) emitRing(n % 4 === 0 ? C.purple : C.pink); }
  }
  for (const m of logoMats) m.uniforms.uBeat.value = beat;
  pMat.uniforms.uBeat.value = beat;

  // --- ロゴの位置: ヒーローでは主役、スクロールすると奥へ退いて背景になる ---
  pointer.x += (pointer.tx - pointer.x) * 0.06;
  pointer.y += (pointer.ty - pointer.y) * 0.06;
  const base = wide ? { x: 5.4, y: 0.2, s: 1.0 } : { x: 0, y: 3.3, s: 0.62 };
  const away = ease(heroP);
  logo.position.set(
    base.x + (wide ? 2.2 : 0) * away,
    base.y + (wide ? 1.6 : 4.5) * away + Math.sin(t * 0.8) * 0.12,
    -9 * away,
  );
  const spin = ease((t - spinStart) / 0.9) * Math.PI * 2 * (t - spinStart < 1.2 ? 1 : 0);
  logo.rotation.set(-pointer.y * 0.35 + 0.12 + spin, pointer.x * 0.5 - 0.18 - away * 0.6, Math.sin(t * 0.5) * 0.04);
  logo.scale.setScalar(base.s * (1 + beat * 0.04));
  const op = 1 - away * 0.55;
  for (const m of logoMats) m.uniforms.uOpacity.value = op;

  // --- 波紋 ---
  for (const r of rings) {
    if (r.userData.t >= 1) { r.material.opacity = 0; continue; }
    r.userData.t += 0.012;
    const k = r.userData.t;
    r.scale.setScalar(1.2 + k * 7);
    r.material.opacity = (1 - k) * 0.45 * op;
  }

  // --- レコード盤: ロゴの周りを周回。スクロールで回転が進む ---
  records.forEach((h) => {
    const { i, disc, phase, spin: sp } = h.userData;
    const ang = (i / records.length) * Math.PI * 2 + t * 0.06 + pageP * Math.PI * 2.2;
    // ヒーローではロゴの周りだけを回り、本文にかからないようにする。スクロール後は画面全体へ広がる
    const radX = wide ? 4.6 + away * 7 : 3.4 + away * 2.5;
    const radY = wide ? 3.6 + away * 2.5 : 2.2 + away * 5;
    h.position.set(
      (wide ? 5.4 : 0) * (1 - away * 0.6) + Math.cos(ang) * radX,
      (wide ? 0.2 : 3.3) * (1 - away) + Math.sin(ang) * radY + Math.sin(t * 0.7 + phase) * 0.35,
      -4 + Math.sin(ang) * 3.0 - away * 4,
    );
    disc.material.uniforms.uOpacity.value = 1 - away * 0.72;
    h.rotation.set(-0.5 + Math.sin(t * 0.3 + phase) * 0.2, 0.5 * Math.cos(ang), 0);
    disc.rotation.z -= reduceMotion ? 0 : 0.016 * sp * (1 + beat);
    disc.material.uniforms.uTime.value = t;
    h.scale.setScalar((wide ? 1 : 0.7) * (1 + beat * 0.05));
  });

  // --- パーティクル ---
  pMat.uniforms.uTime.value = t;
  pMat.uniforms.uScroll.value = pageP;
  points.rotation.y = pointer.x * 0.12;

  camera.position.x = pointer.x * 0.8;
  camera.position.y = -pointer.y * 0.5;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
