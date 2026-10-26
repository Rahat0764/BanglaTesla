# Bangla Tesla · বাংলা টেসলা

ঢাকার রাস্তায় থ্রাস্টারযুক্ত **বাংলা টেসলা** চালান। উড়ুন, ফ্লিপ করুন, ধাক্কা মারুন, চার্জ নিন।

Made by **Rahat Ahmed**  
Facebook: [facebook.com/HarbingerX](https://facebook.com/HarbingerX)  
LinkedIn: [linkedin.com/in/RahatAhmedX](https://linkedin.com/in/RahatAhmedX)  
GitHub: [github.com/Rahat0764](https://github.com/Rahat0764)

---

## Features (v1)

- **Three.js** 3D world (road, buildings, overbridge, trees, charging poles)
- **Thruster hover + air flip** (3 thrusters under the 3 wheels, right-stick controlled)
- **Battery system** → runs out → paddle mode (slow)
- **Charging points** beside the road (R1 / E / on-screen button)
- **Full input stack**:
  - On-screen controls (auto-hide when gamepad/keyboard used)
  - Gamepad (R2 gas, L2 brake, ✕ thruster, □ boost, L1 horn, R1 charge, sticks)
  - Keyboard (WASD + Space + Shift + H + E) with remapping UI
- **Vibration** on impacts (Gamepad + `navigator.vibrate`)
- **Fullscreen** button
- **Landscape** force hint on phones
- **Day/Night** cycle
- **Sound fallback** – drop files in `public/sounds/` later, game works without them
- **PWA-ready** manifest
- Developer credit everywhere

---

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Build for production (Vercel / GitHub Pages)

```bash
npm run build
```

Output is in `dist/`.  
Deploy `dist/` to **Vercel** (import the repo, framework preset Vite) or any static host.

---

## Controls (default)

| Action        | Keyboard     | Gamepad              | On-screen      |
|---------------|--------------|----------------------|----------------|
| Gas           | W            | R2                   | গ্যাস বাটন     |
| Brake         | S            | L2                   | ব্রেক          |
| Steer         | A / D        | Left Stick           | Virtual stick  |
| Thruster      | Space        | ✕ Cross / A          | THRUST         |
| Boost         | Shift        | □ Square / X         | —              |
| Horn          | H            | L1                   | —              |
| Charge        | E            | R1                   | চার্জ (near)   |
| Air flip      | —            | Right Stick (hover)  | —              |

While thruster is on:
- Right stick left/right → roll (turn off opposite rear thruster)
- Right stick up/down → pitch (front vs rear thrusters)

---

## Project structure

```
bangla-tesla/
├── index.html
├── package.json
├── public/
│   ├── icons/
│   ├── sounds/          ← put your mp3/ogg here later
│   └── manifest.webmanifest
├── src/
│   ├── main.js          ← entry, render loop
│   ├── input.js         ← keyboard + gamepad + touch + vibration + remap
│   ├── vehicle.js       ← Bangla Tesla physics + thrusters
│   ├── world.js         ← road, buildings, chargers, day/night
│   ├── ui.js            ← menu, HUD, settings, fullscreen
│   └── audio.js         ← fallback-friendly sound manager
└── README.md
```

---

## Next steps you can add

- Real GLB models (rickshaw / Tesla body)
- Pedestrians + traffic AI
- Get-off / walk / fight (GTA-style, 1 min + radius limit)
- More detailed shop names & July graffiti textures
- Better collision & particles
- Online leaderboard
- Actual sound files in `public/sounds/`

---

## License

MIT – free to modify and publish. Keep the credit if you redistribute.
