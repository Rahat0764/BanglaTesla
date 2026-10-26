/**
 * World – road, buildings, chargers, simple day/night, graffiti placeholders
 */
import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.chargers = [];
    this.time = 0.35; // 0-1 day cycle

    this._buildLights();
    this._buildGround();
    this._buildRoad();
    this._buildBuildings();
    this._buildChargers();
    this._buildDecor();
  }

  _buildLights() {
    this.sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
    this.sun.position.set(40, 60, 20);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 150;
    this.sun.shadow.camera.left = -50;
    this.sun.shadow.camera.right = 50;
    this.sun.shadow.camera.top = 50;
    this.sun.shadow.camera.bottom = -50;
    this.scene.add(this.sun);

    this.hemi = new THREE.HemisphereLight(0x87b5e0, 0x3a2a1a, 0.55);
    this.scene.add(this.hemi);

    this.ambient = new THREE.AmbientLight(0x404860, 0.3);
    this.scene.add(this.ambient);
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(400, 400);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2d3a2d, roughness: 0.95 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  _buildRoad() {
    // main road strip
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.85 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 300), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.02;
    road.receiveShadow = true;
    this.scene.add(road);

    // lane lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    for (let z = -140; z < 140; z += 8) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 3.5), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.03, z);
      this.scene.add(line);
    }

    // sidewalks
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x5a5a60, roughness: 0.9 });
    [-9, 9].forEach(x => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 300), sideMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(x, 0.04, 0);
      s.receiveShadow = true;
      this.scene.add(s);
    });
  }

  _buildBuildings() {
    const colors = [0x4a5568, 0x2d3748, 0x718096, 0x3d4a5c, 0x5c6b7a];
    for (let i = 0; i < 40; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = (i * 7.5) - 140;
      const h = 4 + Math.random() * 14;
      const w = 3 + Math.random() * 4;
      const d = 3 + Math.random() * 5;
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.7,
        metalness: 0.1
      });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(side * (14 + w / 2 + Math.random() * 3), h / 2, z);
      b.castShadow = true;
      b.receiveShadow = true;
      this.scene.add(b);

      // simple shop sign placeholder
      if (Math.random() > 0.5) {
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(w * 0.7, 0.6),
          new THREE.MeshStandardMaterial({ color: 0xff2d95, emissive: 0xff2d95, emissiveIntensity: 0.4 })
        );
        sign.position.set(side * (14 + 0.1), 2.2, z);
        sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.scene.add(sign);
      }
    }

    // simple overbridge
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x555560, roughness: 0.6 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 5), bridgeMat);
    deck.position.set(0, 5.5, 30);
    deck.castShadow = true;
    this.scene.add(deck);
    [-9, 9].forEach(x => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.5, 0.8), bridgeMat);
      pillar.position.set(x, 2.75, 30);
      pillar.castShadow = true;
      this.scene.add(pillar);
    });

    // graffiti plane on pillar (July movement placeholder)
    const graf = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xe0242b, emissive: 0x330000, emissiveIntensity: 0.2 })
    );
    graf.position.set(-9.42, 2.5, 30);
    graf.rotation.y = Math.PI / 2;
    this.scene.add(graf);
  }

  _buildChargers() {
    // roadside charging points (wire poles)
    const positions = [
      new THREE.Vector3(-11, 0, -40),
      new THREE.Vector3(11, 0, 20),
      new THREE.Vector3(-11, 0, 70),
      new THREE.Vector3(11, 0, -90)
    ];
    positions.forEach(p => {
      const group = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 4.5),
        new THREE.MeshStandardMaterial({ color: 0x333338 })
      );
      pole.position.y = 2.25;
      pole.castShadow = true;
      group.add(pole);

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.7, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x1a5c3a, emissive: 0x0a3a20, emissiveIntensity: 0.5 })
      );
      box.position.set(0.4, 1.4, 0);
      group.add(box);

      // glow
      const glow = new THREE.PointLight(0x4dff95, 1.2, 8);
      glow.position.set(0.4, 1.4, 0);
      group.add(glow);

      group.position.copy(p);
      this.scene.add(group);
      this.chargers.push(p.clone());
    });
  }

  _buildDecor() {
    // a few trees
    for (let i = 0; i < 25; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const z = -130 + Math.random() * 260;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 2),
        new THREE.MeshStandardMaterial({ color: 0x4a3020 })
      );
      trunk.position.set(side * (12 + Math.random() * 6), 1, z);
      trunk.castShadow = true;
      this.scene.add(trunk);
      const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(1.3, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x2d6a3e })
      );
      leaves.position.set(trunk.position.x, 2.8, z);
      leaves.castShadow = true;
      this.scene.add(leaves);
    }
  }

  isNearCharger(pos, radius = 4.5) {
    return this.chargers.some(c => c.distanceTo(pos) < radius);
  }

  resolveCollision(pos, vel, radius) {
    // very simple: keep on road-ish area, bounce from building line
    let impact = 0;
    if (Math.abs(pos.x) > 12) {
      impact = Math.abs(vel.x) * 0.5 + 0.3;
      pos.x = Math.sign(pos.x) * 12;
      vel.x *= -0.3;
    }
    // soft bounds on z
    if (Math.abs(pos.z) > 145) {
      pos.z = Math.sign(pos.z) * 145;
      vel.z *= -0.4;
      impact += 0.5;
    }
    return impact;
  }

  update(dt, vehicle) {
    this.time = (this.time + dt * 0.008) % 1;
    const day = Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5;
    this.sun.intensity = 0.3 + day * 1.2;
    this.hemi.intensity = 0.2 + day * 0.4;
    const col = new THREE.Color().setHSL(0.58, 0.35, 0.25 + day * 0.45);
    this.scene.background.copy(col);
    this.scene.fog.color.copy(col);
  }
}
