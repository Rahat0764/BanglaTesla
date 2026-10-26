/**
 * Bangla Tesla – Main entry
 * Developer: Rahat Ahmed (facebook.com/HarbingerX | github.com/Rahat0764)
 */
import * as THREE from 'three';
import { InputManager } from './input.js';
import { Vehicle } from './vehicle.js';
import { World } from './world.js';
import { UI } from './ui.js';
import { AudioManager } from './audio.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b5e0);
scene.fog = new THREE.Fog(0x87b5e0, 40, 180);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 8, 14);

// Core systems
const input = new InputManager();
const audio = new AudioManager();
const world = new World(scene);
const vehicle = new Vehicle(scene, world);
const ui = new UI(input, vehicle, audio);

let running = false;
let lastTime = performance.now();
let damage = 0;

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  ui.checkOrientation();
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
onResize();

// Start button
document.getElementById('btnPlay').addEventListener('click', () => {
  running = true;
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('topBar').classList.add('show');
  input.unlock();
  audio.resume();
  // force landscape hint on mobile
  ui.checkOrientation();
});

function update(dt) {
  if (!running) return;

  input.update();
  vehicle.update(dt, input);
  world.update(dt, vehicle);

  // camera follow
  const target = vehicle.position.clone();
  target.y += 5;
  const behind = new THREE.Vector3(0, 4, 12).applyQuaternion(vehicle.quaternion);
  camera.position.lerp(vehicle.position.clone().add(behind).add(new THREE.Vector3(0, 3, 0)), 1 - Math.pow(0.001, dt));
  camera.lookAt(target);

  // scoring & battery UI
  damage += vehicle.consumeDamage();
  ui.setDamage(damage);
  ui.setBattery(vehicle.battery, vehicle.mode);
  ui.setChargePrompt(vehicle.nearCharger, input.activeDevice);

  // vibration on impact
  if (vehicle.lastImpact > 0.4) {
    input.vibrate(40 + vehicle.lastImpact * 60, vehicle.lastImpact > 1.2 ? 0.9 : 0.4);
    vehicle.lastImpact = 0;
  }
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// expose for debug
window.BanglaTesla = { scene, vehicle, input, world, ui };
