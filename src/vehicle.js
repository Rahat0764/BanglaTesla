/**
 * Bangla Tesla vehicle – battery, thruster, realistic-ish physics, air flips
 */
import * as THREE from 'three';

export class Vehicle {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.battery = 100;
    this.mode = 'battery'; // battery | paddle | hover
    this.nearCharger = false;
    this.lastImpact = 0;
    this._damageQueue = 0;

    this.position = new THREE.Vector3(0, 0.6, 0);
    this.velocity = new THREE.Vector3();
    this.angular = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.speed = 0;
    this.thrusterOn = false;
    this.hoverHeight = 0;
    this.onGround = true;

    this.mesh = this._buildMesh();
    scene.add(this.mesh);

    // thruster lights (visual)
    this.thrusters = [];
    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(0x00e5ff, 0, 6);
      this.mesh.add(light);
      this.thrusters.push(light);
    }
    this.thrusters[0].position.set(0, -0.2, 1.1);   // front
    this.thrusters[1].position.set(-0.7, -0.2, -0.9); // rear left
    this.thrusters[2].position.set(0.7, -0.2, -0.9);  // rear right
  }

  _buildMesh() {
    const g = new THREE.Group();

    // body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a2332, metalness: 0.6, roughness: 0.35 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.4), bodyMat);
    body.position.y = 0.45;
    body.castShadow = true;
    g.add(body);

    // yellow hood accent (rickshaw style)
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.08, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.3, roughness: 0.5 })
    );
    hood.position.set(0, 0.75, 0.6);
    g.add(hood);

    // canopy
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.05, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xff2d95, metalness: 0.1, roughness: 0.7 })
    );
    canopy.position.set(0, 1.35, -0.2);
    g.add(canopy);

    // poles
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    [[-0.7, 0.6], [0.7, 0.6], [-0.7, -0.9], [0.7, -0.9]].forEach(([x, z]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9), poleMat);
      p.position.set(x, 0.95, z);
      g.add(p);
    });

    // wheels (3)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.18, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    this.wheels = [];
    const positions = [[0, 0.32, 1.0], [-0.75, 0.32, -0.95], [0.75, 0.32, -0.95]];
    positions.forEach(([x, y, z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(x, y, z);
      w.castShadow = true;
      g.add(w);
      this.wheels.push(w);
    });

    // LED strip
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.04, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.5 })
    );
    led.position.set(0, 0.7, 1.22);
    g.add(led);

    return g;
  }

  update(dt, input) {
    const st = input.state;
    this.thrusterOn = st.thruster;
    this.mode = this.battery <= 0 ? 'paddle' : (this.thrusterOn ? 'hover' : 'battery');

    // battery drain
    if (this.mode === 'battery' || this.mode === 'hover') {
      let drain = 1.8 * dt;
      if (st.gas > 0.1) drain += 3.5 * st.gas * dt;
      if (this.thrusterOn) drain += 12 * dt;
      if (st.boost) drain += 8 * dt;
      this.battery = Math.max(0, this.battery - drain);
    }

    // charging
    this.nearCharger = this.world.isNearCharger(this.position);
    if (this.nearCharger && st.charge) {
      this.battery = Math.min(100, this.battery + 35 * dt);
    }

    // forces
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);

    let maxSpeed = this.mode === 'paddle' ? 4 : (st.boost ? 22 : 14);
    if (this.thrusterOn) maxSpeed = 18;

    // acceleration
    const accel = (this.mode === 'paddle' ? 4 : 18) * st.gas;
    const brakeForce = 28 * st.brake;

    this.speed += (accel - brakeForce * Math.sign(this.speed || 1) - this.speed * 1.2) * dt;
    this.speed = THREE.MathUtils.clamp(this.speed, -maxSpeed * 0.4, maxSpeed);

    // steering (rickshaw style – slower response)
    const steerAngle = st.steer * 1.6 * (this.thrusterOn ? 0.7 : 1);
    this.euler.y -= steerAngle * Math.min(Math.abs(this.speed) * 0.12, 1.8) * dt;
    this.quaternion.setFromEuler(this.euler);

    // thruster hover + flip
    if (this.thrusterOn && this.battery > 0) {
      this.hoverHeight = THREE.MathUtils.lerp(this.hoverHeight, 1.8 + Math.sin(performance.now() * 0.004) * 0.15, 1 - Math.pow(0.01, dt));
      this.onGround = false;

      // right stick flips – apply torque
      const flipPower = 2.8;
      this.euler.z = THREE.MathUtils.lerp(this.euler.z, -st.flipX * 0.7, 1 - Math.pow(0.05, dt));
      this.euler.x = THREE.MathUtils.lerp(this.euler.x, st.flipY * 0.55, 1 - Math.pow(0.05, dt));
      this.quaternion.setFromEuler(this.euler);

      // thruster visual intensity based on which ones are “on”
      const frontOn = st.flipY < 0.4;
      const leftOn = st.flipX > -0.4;
      const rightOn = st.flipX < 0.4;
      this.thrusters[0].intensity = frontOn ? 4 : 0.3;
      this.thrusters[1].intensity = leftOn ? 3.5 : 0.2;
      this.thrusters[2].intensity = rightOn ? 3.5 : 0.2;
    } else {
      this.hoverHeight = THREE.MathUtils.lerp(this.hoverHeight, 0, 1 - Math.pow(0.02, dt));
      this.euler.x = THREE.MathUtils.lerp(this.euler.x, 0, 1 - Math.pow(0.08, dt));
      this.euler.z = THREE.MathUtils.lerp(this.euler.z, 0, 1 - Math.pow(0.08, dt));
      this.quaternion.setFromEuler(this.euler);
      this.thrusters.forEach(t => t.intensity = 0);
      this.onGround = this.hoverHeight < 0.15;
    }

    // integrate position
    this.velocity.copy(forward).multiplyScalar(this.speed);
    this.position.addScaledVector(this.velocity, dt);
    this.position.y = 0.55 + this.hoverHeight;

    // simple world bounds & collision feedback
    const impact = this.world.resolveCollision(this.position, this.velocity, 1.2);
    if (impact > 0) {
      this.lastImpact = impact;
      this._damageQueue += impact * 8;
      this.speed *= 0.4;
    }

    // wheel spin
    const spin = this.speed * dt * 3;
    this.wheels.forEach(w => { w.rotation.x += spin; });

    // apply to mesh
    this.mesh.position.copy(this.position);
    this.mesh.quaternion.copy(this.quaternion);
  }

  consumeDamage() {
    const d = this._damageQueue;
    this._damageQueue = 0;
    return d;
  }
}
