/**
 * UI – menu, settings, orientation, battery display, charge prompt
 */
export class UI {
  constructor(input, vehicle, audio) {
    this.input = input;
    this.vehicle = vehicle;
    this.audio = audio;
    this.input.loadSaved();

    document.getElementById('btnControls').addEventListener('click', () => this.openSettings());
    document.getElementById('btnSettings').addEventListener('click', () => this.openSettings());
    document.getElementById('btnCloseSettings').addEventListener('click', () => this.closeSettings());
    document.getElementById('btnFullscreen').addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('btnFSMenu').addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('btnMenu').addEventListener('click', () => {
      document.getElementById('menu').classList.remove('hidden');
      document.getElementById('topBar').classList.remove('show');
    });

    // tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderMapTab(tab.dataset.tab);
      });
    });

    document.addEventListener('remap-done', () => {
      const active = document.querySelector('.tab.active');
      if (active) this.renderMapTab(active.dataset.tab);
    });

    this.checkOrientation();
  }

  setDamage(v) {
    document.getElementById('damageVal').textContent = Math.floor(v).toLocaleString('bn-BD');
  }

  setBattery(pct, mode) {
    document.getElementById('battVal').textContent = Math.round(pct) + '%';
    document.getElementById('batteryFill').style.width = pct + '%';
    const tag = document.getElementById('modeTag');
    tag.className = '';
    if (mode === 'paddle') {
      tag.textContent = 'প্যাডেল';
      tag.classList.add('paddle');
    } else if (mode === 'hover') {
      tag.textContent = 'থ্রাস্টার';
      tag.classList.add('hover');
    }
  }

  setChargePrompt(near, device) {
    const prompt = document.getElementById('chargePrompt');
    const btn = document.getElementById('tCharge');
    if (near) {
      prompt.classList.add('show');
      prompt.textContent = device === 'gamepad' ? 'R1 চাপুন চার্জ করতে' : (device === 'keyboard' ? 'E চাপুন চার্জ করতে' : 'চার্জ বাটন চাপুন');
      btn.classList.add('show');
    } else {
      prompt.classList.remove('show');
      btn.classList.remove('show');
    }
  }

  checkOrientation() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const orient = document.getElementById('orient');
    if (isMobile && window.innerHeight > window.innerWidth) {
      orient.classList.add('show');
    } else {
      orient.classList.remove('show');
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.() ||
      document.documentElement.webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
  }

  openSettings() {
    document.getElementById('settings').classList.add('show');
    this.renderMapTab('onscreen');
  }

  closeSettings() {
    document.getElementById('settings').classList.remove('show');
  }

  renderMapTab(tab) {
    const box = document.getElementById('mapContent');
    if (tab === 'onscreen') {
      box.innerHTML = `
        <p style="opacity:0.8;margin-bottom:12px">অন-স্ক্রিন কন্ট্রোলার টেনে নিজের সুবিধামতো সরাতে পারবেন (পরবর্তী আপডেটে পজিশন সেভ যোগ হবে)।</p>
        <div class="map-row"><span>বাম জয়স্টিক</span><span>স্টিয়ার</span></div>
        <div class="map-row"><span>গ্যাস বাটন</span><span>সামনে</span></div>
        <div class="map-row"><span>ব্রেক বাটন</span><span>পেছনে / থামা</span></div>
        <div class="map-row"><span>THRUST</span><span>থ্রাস্টার অন/অফ</span></div>
        <div class="map-row"><span>চার্জ</span><span>চার্জিং পয়েন্টে</span></div>
      `;
    } else if (tab === 'gamepad') {
      box.innerHTML = `
        <div class="map-row"><span>R2</span><span>গ্যাস / সামনে</span></div>
        <div class="map-row"><span>L2</span><span>ব্রেক / পেছনে</span></div>
        <div class="map-row"><span>Left Stick</span><span>স্টিয়ার</span></div>
        <div class="map-row"><span>✕ Cross / A</span><span>থ্রাস্টার</span></div>
        <div class="map-row"><span>□ Square / X</span><span>বুস্ট</span></div>
        <div class="map-row"><span>L1</span><span>হর্ন</span></div>
        <div class="map-row"><span>R1</span><span>চার্জ</span></div>
        <div class="map-row"><span>Right Stick</span><span>এয়ার ফ্লিপ (থ্রাস্টার অন)</span></div>
        <p style="margin-top:12px;opacity:0.7;font-size:13px">রিম্যাপ: পরবর্তী ভার্সনে “Press a key” পপআপ যোগ করা হবে।</p>
      `;
    } else {
      const k = this.input.keys;
      const rows = [
        ['gas', 'গ্যাস'], ['brake', 'ব্রেক'], ['left', 'বামে'], ['right', 'ডানে'],
        ['thruster', 'থ্রাস্টার'], ['boost', 'বুস্ট'], ['horn', 'হর্ন'], ['charge', 'চার্জ']
      ];
      box.innerHTML = rows.map(([act, label]) => `
        <div class="map-row">
          <span>${label}</span>
          <button data-act="${act}">${k[act]?.replace('Key','') || k[act]}</button>
        </div>
      `).join('') + `<p style="margin-top:12px;opacity:0.7;font-size:13px">বাটনে ক্লিক করে নতুন কি চাপুন (রিম্যাপ)।</p>`;

      box.querySelectorAll('button[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.textContent = 'চাপুন...';
          this.input.startRemap(btn.dataset.act, 'keyboard');
        });
      });
    }
  }
}
