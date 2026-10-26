/**
 * Bangla Tesla – Proper Bangladeshi battery rickshaw look + thruster + get-off
 */
import * as THREE from 'three';

export class Vehicle {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.battery = 100;
    this.mode = 'battery';
    this.nearCharger = false;
    this.lastImpact = 0;
    this._damageQueue = 0;
    this.exited = false;          // mama namche
    this.exitTimer = 0;
    this.maxExitTime = 60;        // 1 minute
    this.exitRadius = 45;

    this.position = new THREE.Vector3(0, 0.55, 0);
    this.velocity = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.speed = 0;
    this.thrusterOn = false;
    this.hoverHeight = 0;
    this.onGround = true;
    this.driverMesh = null;

    this.mesh = this._buildRickshaw();
    scene.add(this.mesh);

    // 3 thruster lights under wheels
    this.thrusters = [];
    const positions = [[0, -0.15, 1.15], [-0.72, -0.15, -0.95], [0.72, -0.15, -0.95]];
    positions.forEach((p, i) => {
      const l = new THREE.PointLight(0x00e5ff, 0, 5);
      l.position.set(...p);
      this.mesh.add(l);
      this.thrusters.push(l);
    });
  }

  /** Colorful Bangladeshi battery-rickshaw style (hood, fringe, decorations) */
  _buildRickshaw() {
    const g = new THREE.Group();

    // Main chassis (yellow-orange classic)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffc107, metalness: 0.25, roughness: 0.55 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 2.15), bodyMat);
    body.position.y = 0.48;
    body.castShadow = true;
    g.add(body);

    // Front nose / battery box
    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.35, 0.55),
      new THREE.MeshStandardMaterial({ color: 0xe65100, metalness: 0.3, roughness: 0.5 })
    );
    nose.position.set(0, 0.45, 1.15);
    nose.castShadow = true;
    g.add(nose);

    // Colorful canopy (hood) – classic red/pink with pattern feel
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xe91e63, metalness: 0.1, roughness: 0.65 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 1.55), canopyMat);
    canopy.position.set(0, 1.55, -0.15);
    g.add(canopy);

    // Canopy side curtains
    const curtainMat = new THREE.MeshStandardMaterial({ color: 0xff80ab, transparent: true, opacity: 0.85 });
    [-0.72, 0.72].forEach(x => {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), curtainMat);
      c.position.set(x, 1.15, -0.15);
      c.rotation.y = x > 0 ? -0.15 : 0.15;
      g.add(c);
    });

    // Support poles (4)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x37474f });
    [[-0.65, 0.55], [0.65, 0.55], [-0.65, -0.85], [0.65, -0.85]].forEach(([x, z]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.05), poleMat);
      p.position.set(x, 1.0, z);
      g.add(p);
    });

    // Decorative fringe under canopy (simple colorful boxes)
    const fringeColors = [0xff1744, 0x00e5ff, 0xffea00, 0x76ff03];
    for (let i = 0; i < 10; i++) {
      const f = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.18, 0.04),
        new THREE.MeshStandardMaterial({ color: fringeColors[i % 4], emissive: fringeColors[i % 4], emissiveIntensity: 0.15 })
      );
      f.position.set(-0.65 + i * 0.145, 1.42, 0.55);
      g.add(f);
    }

    // Back board with “Bangla Tesla” style panel
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.55, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x1a237e, metalness: 0.2, roughness: 0.6 })
    );
    board.position.set(0, 0.85, -1.05);
    g.add(board);

    // LED strip front
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2 })
    );
    led.position.set(0, 0.62, 1.42);
    g.add(led);

    // 3 wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });
    const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.16, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    this.wheels = [];
    [[0, 0.34, 1.05], [-0.72, 0.34, -0.95], [0.72, 0.34, -0.95]].forEach(([x, y, z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(x, y, z);
      w.castShadow = true;
      g.add(w);
      this.wheels.push(w);
    });

    // Driver (simple low-poly mama)
    const driver = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), skin);
    head.position.y = 1.35;
    driver.add(head);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.22), shirt);
    torso.position.y = 1.05;
    driver.add(torso);
    driver.position.set(0, 0.15, 0.15);
    this.driverMesh = driver;
    g.add(driver);

    // Handle bar
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x263238 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.95, 0.7);
    g.add(bar);

    return g;
  }

  update(dt, input) {
    const st = input.state;

    // Triangle / exit key → mama nambe
    if (st.exit && !this.exited) {
      this.exited = true;
      this.exitTimer = this.maxExitTime;
      if (this.driverMesh) this.driverMesh.visible = false;
    }
    if (this.exited) {
      this.exitTimer -= dt;
      // force return if time up or too far
      const dist = this.position.distanceTo(this.mesh.position);
      if (this.exitTimer <= 0 || dist > this.exitRadius) {
        this.exited = false;
        if (this.driverMesh) this.driverMesh.visible = true;
      }
      // while exited, vehicle stays put (simple for now)
      this.speed = 0;
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      return;
    }

    this.thrusterOn = !!st.thruster;
    this.mode = this.battery <= 0 ? 'paddle' : (this.thrusterOn ? 'hover' : 'battery');

    // Battery: ONLY drain when accelerating or thruster/boost. Idle = 0 drain
    if (this.mode !== 'paddle') {
      let drain = 0;
      if (st.gas > 0.05) drain += 2.2 * st.gas * dt;      // ~15+ min normal driving
      if (this.thrusterOn) drain += 6 * dt;
      if (st.boost) drain += 5 * dt;
      this.battery = Math.max(0, this.battery - drain);
    }

    // Charging
    this.nearCharger = this.world.isNearCharger(this.position);
    if (this.nearCharger && st.charge) {
      this.battery = Math.min(100, this.battery + 28 * dt);
    }

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);

    // Speed & reverse (L2 / brake negative)
    let maxSpeed = this.mode === 'paddle' ? 3.5 : (st.boost ? 20 : 13);
    if (this.thrusterOn) maxSpeed = 16;

    const accel = (this.mode === 'paddle' ? 3.5 : 16) * st.gas;
    // brake can also mean reverse when speed near 0
    let targetSpeed = this.speed;
    if (st.gas > 0.05) {
      targetSpeed += accel * dt;
    } else if (st.brake > 0.05) {
      if (this.speed > 0.5) {
        targetSpeed -= 22 * st.brake * dt; // braking
      } else {
        targetSpeed = -maxSpeed * 0.35 * st.brake; // reverse
      }
    } else {
      targetSpeed *= (1 - 2.5 * dt); // coast
    }
    this.speed = THREE.MathUtils.clamp(targetSpeed, -maxSpeed * 0.4, maxSpeed);

    // Rickshaw-style steering (slower, more inertia)
    const steerFactor = Math.min(Math.abs(this.speed) * 0.14, 1.6);
    this.euler.y -= st.steer * 1.5 * steerFactor * dt;
    this.quaternion.setFromEuler(this.euler);

    // Thruster hover + flip
    if (this.thrusterOn && this.battery > 0) {
      this.hoverHeight = THREE.MathUtils.lerp(this.hoverHeight, 1.6 + Math.sin(performance.now() * 0.005) * 0.12, 1 - Math.pow(0.02, dt));
      this.onGround = false;
      this.euler.z = THREE.MathUtils.lerp(this.euler.z, -st.flipX * 0.65, 1 - Math.pow(0.06, dt));
      this.euler.x = THREE.MathUtils.lerp(this.euler.x, st.flipY * 0.5, 1 - Math.pow(0.06, dt));
      this.quaternion.setFromEuler(this.euler);

      const frontOn = st.flipY < 0.35;
      const leftOn = st.flipX > -0.35;
      const rightOn = st.flipX < 0.35;
      this.thrusters[0].intensity = frontOn ? 3.5 : 0.2;
      this.thrusters[1].intensity = leftOn ? 3 : 0.15;
      this.thrusters[2].intensity = rightOn ? 3 : 0.15;
    } else {
      this.hoverHeight = THREE.MathUtils.lerp(this.hoverHeight, 0, 1 - Math.pow(0.03, dt));
      this.euler.x = THREE.MathUtils.lerp(this.euler.x, 0, 1 - Math.pow(0.1, dt));
      this.euler.z = THREE.MathUtils.lerp(this.euler.z, 0, 1 - Math.pow(0.1, dt));
      this.quaternion.setFromEuler(this.euler);
      this.thrusters.forEach(t => (t.intensity = 0));
      this.onGround = this.hoverHeight < 0.12;
    }

    this.velocity.copy(forward).multiplyScalar(this.speed);
    this.position.addScaledVector(this.velocity, dt);
    this.position.y = 0.55 + this.hoverHeight;

    // Soft world bounds – road is long, wrap-ish
    const impact = this.world.resolveCollision(this.position, this.velocity, 1.1);
    if (impact > 0) {
      this.lastImpact = impact;
      this._damageQueue += impact * 10;
      this.speed *= 0.35;
    }

    // Wheel spin
    const spin = this.speed * dt * 2.8;
    this.wheels.forEach(w => (w.rotation.x += spin));

    this.mesh.position.copy(this.position);
    this.mesh.quaternion.copy(this.quaternion);
  }

  consumeDamage() {
    const d = this._damageQueue;
    this._damageQueue = 0;
    return d;
  }
}
