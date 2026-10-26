/**
 * World – long Dhaka-style road, buildings, banners, chargers, day/night
 * Road is long and loops so it never “ends”
 */
import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.chargers = [];
    this.time = 0.3;
    this.roadLength = 600;

    this._buildLights();
    this._buildGround();
    this._buildRoad();
    this._buildBuildings();
    this._buildChargers();
    this._buildDecor();
    this._buildTraffic();
  }

  _buildLights() {
    this.sun = new THREE.DirectionalLight(0xfff0dd, 1.35);
    this.sun.position.set(50, 70, 30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -60;
    this.sun.shadow.camera.right = 60;
    this.sun.shadow.camera.top = 60;
    this.sun.shadow.camera.bottom = -60;
    this.sun.shadow.camera.far = 180;
    this.scene.add(this.sun);

    this.hemi = new THREE.HemisphereLight(0x87b8e8, 0x3a2a18, 0.5);
    this.scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight(0x455a70, 0.28);
    this.scene.add(this.ambient);
  }

  _buildGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(500, this.roadLength + 80),
      new THREE.MeshStandardMaterial({ color: 0x2e3b2e, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  _buildRoad() {
    const L = this.roadLength;
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.88 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(15, L), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 0);
    road.receiveShadow = true;
    this.scene.add(road);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffc107 });
    for (let z = -L / 2; z < L / 2; z += 9) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 4), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.035, z);
      this.scene.add(line);
    }

    const sideMat = new THREE.MeshStandardMaterial({ color: 0x5c5c62, roughness: 0.9 });
    [-9.5, 9.5].forEach(x => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(4.5, L), sideMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(x, 0.04, 0);
      s.receiveShadow = true;
      this.scene.add(s);
    });

    const curbMat = new THREE.MeshStandardMaterial({ color: 0xf5c518 });
    for (let z = -L / 2; z < L / 2; z += 3) {
      [-7.6, 7.6].forEach(x => {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 1.4), curbMat);
        c.position.set(x, 0.1, z);
        this.scene.add(c);
      });
    }
  }

  _buildBuildings() {
    const L = this.roadLength;
    const colors = [0x4a5568, 0x2d3748, 0x718096, 0x3d4a5c, 0x5c6b7a, 0x455a64];
    const bannerColors = [0xc62828, 0x1565c0, 0x2e7d32, 0x6a1b9a, 0xef6c00];

    for (let i = 0; i < 70; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = (i / 70) * L - L / 2 + (Math.random() - 0.5) * 6;
      const h = 5 + Math.random() * 16;
      const w = 3.2 + Math.random() * 4.5;
      const d = 3.5 + Math.random() * 5;
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.72,
        metalness: 0.08
      });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(side * (16 + w / 2), h / 2, z);
      b.castShadow = true;
      b.receiveShadow = true;
      this.scene.add(b);

      if (Math.random() > 0.35) {
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(w * 0.75, 0.7),
          new THREE.MeshStandardMaterial({
            color: bannerColors[i % bannerColors.length],
            emissive: bannerColors[i % bannerColors.length],
            emissiveIntensity: 0.25
          })
        );
        sign.position.set(side * 16.05, 2.4 + Math.random() * 2, z);
        sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.scene.add(sign);
      }
    }

    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.55 });
    for (let z = -200; z < 200; z += 140) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(24, 0.45, 6), bridgeMat);
      deck.position.set(0, 5.8, z);
      deck.castShadow = true;
      this.scene.add(deck);
      [-10, 10].forEach(x => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 5.8, 1.0), bridgeMat);
        pillar.position.set(x, 2.9, z);
        pillar.castShadow = true;
        this.scene.add(pillar);
        const graf = new THREE.Mesh(
          new THREE.PlaneGeometry(1.8, 2.4),
          new THREE.MeshStandardMaterial({ color: 0xc62828, emissive: 0x3e0000, emissiveIntensity: 0.15 })
        );
        graf.position.set(x + (x > 0 ? -0.52 : 0.52), 2.6, z);
        graf.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.scene.add(graf);
      });
    }
  }

  _buildChargers() {
    const L = this.roadLength;
    const spots = [];
    for (let z = -L / 2 + 40; z < L / 2; z += 90) {
      spots.push(new THREE.Vector3(-11.5, 0, z));
      spots.push(new THREE.Vector3(11.5, 0, z + 40));
    }
    spots.forEach(p => {
      const group = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.14, 4.8),
        new THREE.MeshStandardMaterial({ color: 0x37474f })
      );
      pole.position.y = 2.4;
      pole.castShadow = true;
      group.add(pole);
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.65, 0.28),
        new THREE.MeshStandardMaterial({ color: 0x1b5e20, emissive: 0x0a3a14, emissiveIntensity: 0.6 })
      );
      box.position.set(0.35, 1.5, 0);
      group.add(box);
      const glow = new THREE.PointLight(0x4caf50, 1.1, 9);
      glow.position.set(0.35, 1.5, 0);
      group.add(glow);
      group.position.copy(p);
      this.scene.add(group);
      this.chargers.push(p.clone());
    });
  }

  _buildDecor() {
    const L = this.roadLength;
    for (let i = 0; i < 50; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const z = (Math.random() - 0.5) * L;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x5d4037 })
      );
      trunk.position.set(side * (13 + Math.random() * 5), 1.1, z);
      trunk.castShadow = true;
      this.scene.add(trunk);
      const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 7, 5),
        new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
      );
      leaves.position.set(trunk.position.x, 2.9, z);
      leaves.castShadow = true;
      this.scene.add(leaves);
    }
    const wireMat = new THREE.LineBasicMaterial({ color: 0x263238 });
    for (let z = -L / 2; z < L / 2; z += 25) {
      const pts = [
        new THREE.Vector3(-12, 5.5, z),
        new THREE.Vector3(0, 4.2, z + 3),
        new THREE.Vector3(12, 5.5, z)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.scene.add(new THREE.Line(geo, wireMat));
    }
  }

  _buildTraffic() {
    const L = this.roadLength;
    for (let i = 0; i < 18; i++) {
      const z = (Math.random() - 0.5) * L * 0.9;
      const x = (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random() * 2);
      const col = [0x1565c0, 0xc62828, 0x2e7d32, 0xff8f00, 0x6a1b9a][i % 5];
      const car = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.9, 3.2),
        new THREE.MeshStandardMaterial({ color: col, metalness: 0.3, roughness: 0.5 })
      );
      car.position.set(x, 0.5, z);
      car.castShadow = true;
      this.scene.add(car);
    }
  }

  isNearCharger(pos, radius = 5) {
    return this.chargers.some(c => c.distanceTo(pos) < radius);
  }

  resolveCollision(pos, vel, radius) {
    let impact = 0;
    if (Math.abs(pos.x) > 11.5) {
      impact = Math.abs(vel.x) * 0.6 + 0.25;
      pos.x = Math.sign(pos.x) * 11.5;
      vel.x *= -0.25;
    }
    const half = this.roadLength / 2 - 5;
    if (pos.z > half) pos.z = -half + 10;
    else if (pos.z < -half) pos.z = half - 10;
    return impact;
  }

  update(dt) {
    this.time = (this.time + dt * 0.006) % 1;
    const day = Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5;
    this.sun.intensity = 0.25 + day * 1.15;
    this.hemi.intensity = 0.18 + day * 0.38;
    const col = new THREE.Color().setHSL(0.58, 0.32, 0.22 + day * 0.42);
    this.scene.background.copy(col);
    if (this.scene.fog) this.scene.fog.color.copy(col);
  }
}
