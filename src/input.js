/**
 * InputManager – Keyboard + Gamepad + On-screen
 * Auto-hide on-screen when gamepad/keyboard used
 * Remapping support + Vibration
 */

const DEFAULT_KEYBOARD = {
  gas: 'KeyW',
  brake: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  thruster: 'Space',
  boost: 'ShiftLeft',
  horn: 'KeyH',
  charge: 'KeyE',
  exit: 'KeyF'
};

const DEFAULT_GAMEPAD = {
  gas: 'r2',
  brake: 'l2',
  thruster: 'cross',        // ✕ / A
  boost: 'square',          // □ / X
  horn: 'l1',
  charge: 'r1',
  // left stick = steer, right stick = thruster flip
};

export class InputManager {
  constructor() {
    this.keys = { ...DEFAULT_KEYBOARD };
    this.gamepadMap = { ...DEFAULT_GAMEPAD };
    this.state = {
      gas: 0, brake: 0, steer: 0, thruster: false, boost: false,
      horn: false, charge: false, exit: false,
      flipX: 0, flipY: 0   // right stick while thruster on
    };
    this.activeDevice = 'touch'; // touch | keyboard | gamepad
    this.locked = true;
    this.gamepadIndex = null;
    this.remapTarget = null;

    this._bindKeyboard();
    this._bindTouch();
    this._bindGamepad();
    this._bindUI();
  }

  unlock() { this.locked = false; }

  update() {
    this._pollGamepad();
  }

  // ---------- Keyboard ----------
  _bindKeyboard() {
    const down = new Set();
    window.addEventListener('keydown', (e) => {
      if (this.locked && !e.target.closest('#settings')) return;
      if (this.remapTarget) {
        this._finishRemap(e.code);
        e.preventDefault();
        return;
      }
      down.add(e.code);
      this._setFromKeyboard(down);
      this._switchDevice('keyboard');
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      down.delete(e.code);
      this._setFromKeyboard(down);
    });
  }

  _setFromKeyboard(down) {
    const k = this.keys;
    this.state.gas = down.has(k.gas) ? 1 : 0;
    this.state.brake = down.has(k.brake) ? 1 : 0;
    this.state.steer = (down.has(k.left) ? -1 : 0) + (down.has(k.right) ? 1 : 0);
    this.state.thruster = down.has(k.thruster);
    this.state.boost = down.has(k.boost);
    this.state.horn = down.has(k.horn);
    this.state.charge = down.has(k.charge);
    this.state.exit = down.has(k.exit);
    this.state.flipX = 0;
    this.state.flipY = 0;
  }

  // ---------- Touch / On-screen ----------
  _bindTouch() {
    const zone = document.getElementById('stickZone');
    const stick = document.getElementById('stick');
    let active = false, cx, cy, rid = null;

    const setStick = (x, y) => {
      const max = 38;
      const len = Math.hypot(x, y) || 1;
      const nx = (x / len) * Math.min(len, max);
      const ny = (y / len) * Math.min(len, max);
      stick.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
      this.state.steer = nx / max;
      // forward/back from vertical if desired – we keep separate gas/brake
    };

    const start = (e) => {
      if (this.locked) return;
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const r = zone.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      active = true;
      rid = t.identifier ?? 'mouse';
      this._switchDevice('touch');
      setStick(t.clientX - cx, t.clientY - cy);
    };
    const move = (e) => {
      if (!active) return;
      const touches = e.changedTouches || [e];
      for (const t of touches) {
        if ((t.identifier ?? 'mouse') !== rid) continue;
        setStick(t.clientX - cx, t.clientY - cy);
      }
    };
    const end = (e) => {
      if (!active) return;
      active = false;
      stick.style.transform = 'translate(-50%,-50%)';
      this.state.steer = 0;
    };

    zone.addEventListener('touchstart', start, { passive: false });
    zone.addEventListener('touchmove', move, { passive: false });
    zone.addEventListener('touchend', end);
    zone.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    // buttons
    const bindBtn = (id, key, isToggle = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      const on = (e) => {
        e.preventDefault();
        this._switchDevice('touch');
        if (isToggle) this.state[key] = !this.state[key];
        else this.state[key] = true;
        el.classList.add('active');
      };
      const off = () => {
        if (!isToggle) this.state[key] = false;
        el.classList.remove('active');
      };
      el.addEventListener('touchstart', on, { passive: false });
      el.addEventListener('touchend', off);
      el.addEventListener('mousedown', on);
      el.addEventListener('mouseup', off);
      el.addEventListener('mouseleave', off);
    };
    bindBtn('tGas', 'gas');
    bindBtn('tBrake', 'brake');
    bindBtn('tThruster', 'thruster', true);
    bindBtn('tCharge', 'charge');
  }

  // ---------- Gamepad ----------
  _bindGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      this._switchDevice('gamepad');
      console.log('Gamepad connected:', e.gamepad.id);
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = null;
      if (this.activeDevice === 'gamepad') this._switchDevice('touch');
    });
  }

  _pollGamepad() {
    if (this.gamepadIndex == null) return;
    const gps = navigator.getGamepads();
    const gp = gps[this.gamepadIndex];
    if (!gp) return;

    // any button press → switch to gamepad + hide on-screen
    const anyPressed = gp.buttons.some(b => b.pressed || b.value > 0.1);
    if (anyPressed) this._switchDevice('gamepad');

    const btn = (i) => gp.buttons[i]?.value || 0;
    // Standard mapping (Xbox / most browsers)
    // 0=A/cross, 1=B/circle, 2=X/square, 3=Y/triangle
    // 4=LB/l1, 5=RB/r1, 6=LT/l2, 7=RT/r2
    this.state.gas = btn(7);          // R2
    this.state.brake = btn(6);        // L2
    this.state.thruster = btn(0) > 0.3; // Cross / A
    this.state.boost = btn(2) > 0.3;   // Square / X
    this.state.horn = btn(4) > 0.3;    // L1
    this.state.charge = btn(5) > 0.3;  // R1
    this.state.steer = gp.axes[0] || 0; // left stick X
    this.state.flipX = gp.axes[2] || 0; // right stick X
    this.state.flipY = gp.axes[3] || 0; // right stick Y
  }

  // ---------- Device switch + UI labels ----------
  _switchDevice(dev) {
    if (this.activeDevice === dev) return;
    this.activeDevice = dev;
    const touch = document.getElementById('touch');
    const labels = document.getElementById('inputLabels');
    if (dev === 'touch') {
      touch.classList.remove('hidden');
      labels.classList.remove('show');
    } else {
      touch.classList.add('hidden');
      labels.classList.add('show');
      this._renderLabels();
    }
  }

  _renderLabels() {
    const el = document.getElementById('inputLabels');
    if (this.activeDevice === 'gamepad') {
      el.innerHTML = `
        <b>R2</b> সামনে<br>
        <b>L2</b> পেছনে<br>
        <b>Left Stick</b> স্টিয়ার<br>
        <b>✕</b> থ্রাস্টার<br>
        <b>□</b> বুস্ট<br>
        <b>L1</b> হর্ন<br>
        <b>R1</b> চার্জ<br>
        <b>Right Stick</b> এয়ার ফ্লিপ
      `;
    } else {
      const k = this.keys;
      el.innerHTML = `
        <b>${k.gas.replace('Key','')}</b> গ্যাস<br>
        <b>${k.brake.replace('Key','')}</b> ব্রেক<br>
        <b>${k.left.replace('Key','')}/${k.right.replace('Key','')}</b> স্টিয়ার<br>
        <b>Space</b> থ্রাস্টার<br>
        <b>Shift</b> বুস্ট<br>
        <b>${k.horn.replace('Key','')}</b> হর্ন<br>
        <b>${k.charge.replace('Key','')}</b> চার্জ
      `;
    }
  }

  // ---------- Vibration ----------
  vibrate(duration = 50, strength = 0.6) {
    if (this.gamepadIndex != null) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp?.vibrationActuator) {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0, duration, weakMagnitude: strength * 0.5, strongMagnitude: strength
        }).catch(() => {});
      }
    }
    if (navigator.vibrate) navigator.vibrate(duration);
  }

  // ---------- Remapping UI helpers ----------
  _bindUI() {
    // settings tabs etc handled in ui.js, we just expose API
  }

  startRemap(action, device) {
    this.remapTarget = { action, device };
  }

  _finishRemap(codeOrButton) {
    if (!this.remapTarget) return;
    const { action, device } = this.remapTarget;
    if (device === 'keyboard') {
      this.keys[action] = codeOrButton;
      localStorage.setItem('bt.keys', JSON.stringify(this.keys));
    }
    this.remapTarget = null;
    // UI will refresh
    document.dispatchEvent(new CustomEvent('remap-done'));
  }

  loadSaved() {
    try {
      const k = localStorage.getItem('bt.keys');
      if (k) Object.assign(this.keys, JSON.parse(k));
    } catch (_) {}
  }
}
