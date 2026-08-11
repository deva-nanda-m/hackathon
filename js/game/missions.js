/* ==========================================================================
   AFTER THE COLLAPSE — 7-Mission Rescue Campaign & Solutions
   ========================================================================== */

export const MATERIAL_SPECS = {
  wood: {
    name: 'Wood Beam',
    cost: 1,
    weight: 1.0,
    maxStrength: 0.14, // Max strain threshold before snapping
    maxLength: 160,    // Maximum beam placement length (px)
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)'
  },
  steel: {
    name: 'Steel Beam',
    cost: 3,
    weight: 2.2,
    maxStrength: 0.35, // Higher max strain threshold
    maxLength: 220,
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)'
  }
};

export const MISSIONS = [
  // MISSION 1: BRIDGE (GRAVITY)
  {
    id: 1,
    title: 'Mission 1 — Cross the Ravine',
    shortTitle: 'Cross the Ravine',
    type: 'Bridge',
    story: 'The main supply bridge was destroyed in the collapse. Settlement Alpha across the ravine is isolated without food or water. Build a sturdy temporary bridge connecting both cliffs.',
    objective: 'Build a bridge connecting the left and right cliffs that holds its own structural weight for 5 seconds.',
    gapText: '350 meters span',
    loadText: 'Self-Weight Gravity',
    hazardText: 'None',
    budget: { wood: 15, steel: 5 },
    testDuration: 5.0,
    hasCrate: false,
    hasSurvivor: false,
    windStrength: 0,
    anchors: [
      { x: 220, y: 380, id: 'a1', label: 'Left Deck Anchor' },
      { x: 200, y: 460, id: 'a2', label: 'Left Support Anchor' },
      { x: 580, y: 380, id: 'a3', label: 'Right Deck Anchor' },
      { x: 600, y: 460, id: 'a4', label: 'Right Support Anchor' }
    ],
    terrain: {
      leftCliffX: 220,
      rightCliffX: 580,
      deckY: 380,
      waterY: 560
    },
    flashcard: {
      title: 'Mission 1 — Triangular Truss & Axial Mechanics',
      icon: '🌉',
      conceptName: 'Triangular Deck Truss Structure',
      conceptDesc: 'Triangular trusses convert downward vertical loads into axial tension and compression forces along straight beams, eliminating bending moments.',
      formulaText: 'Stress σ = F / A  |  Strain ε = |ΔL| / L0',
      physicsDesc: 'Gravity exerts downward force F_g = m · g. Top chords experience push (compression) while bottom chords experience pull (tension).',
      takeaway: 'Form closed triangles with beams to stabilize structural joints against rotational displacement.'
    },
    solution: {
      nodes: [
        { id: 'n1', x: 340, y: 380 },
        { id: 'n2', x: 460, y: 380 },
        { id: 'n3', x: 400, y: 460 }
      ],
      beams: [
        { from: 'a1', to: 'n1', mat: 'wood' },
        { from: 'n1', to: 'n2', mat: 'wood' },
        { from: 'n2', to: 'a3', mat: 'wood' },
        { from: 'a2', to: 'n1', mat: 'steel' },
        { from: 'n1', to: 'n3', mat: 'wood' },
        { from: 'n3', to: 'n2', mat: 'wood' },
        { from: 'n2', to: 'a4', mat: 'steel' },
        { from: 'a2', to: 'n3', mat: 'steel' },
        { from: 'a4', to: 'n3', mat: 'steel' },
        { from: 'a1', to: 'n3', mat: 'wood' },
        { from: 'a3', to: 'n3', mat: 'wood' }
      ]
    }
  },

  // MISSION 2: MOVING LOAD (SUPPLY RUN)
  {
    id: 2,
    title: 'Mission 2 — Supply Run',
    shortTitle: 'Supply Run',
    type: 'Bridge + Moving Load',
    story: 'Settlement Alpha urgently requires heavy medical crates and water purifiers. Strengthen your bridge so a heavy 500kg supply crate can travel safely across the deck.',
    objective: 'Construct a bridge deck that allows the heavy supply crate to roll across safely from left to right.',
    gapText: '400 meters span',
    loadText: '500kg Moving Crate',
    hazardText: 'Dynamic Deck Weight',
    budget: { wood: 18, steel: 8 },
    testDuration: 8.0,
    hasCrate: true,
    crateWeight: 4.5,
    crateSpeed: 45,
    hasSurvivor: false,
    windStrength: 0,
    anchors: [
      { x: 180, y: 380, id: 'a1', label: 'Left Deck Anchor' },
      { x: 160, y: 460, id: 'a2', label: 'Left Rock Anchor' },
      { x: 620, y: 380, id: 'a3', label: 'Right Deck Anchor' },
      { x: 640, y: 460, id: 'a4', label: 'Right Rock Anchor' }
    ],
    terrain: {
      leftCliffX: 180,
      rightCliffX: 620,
      deckY: 380,
      waterY: 560
    },
    flashcard: {
      title: 'Mission 2 — Dynamic Moving Loads & Bending Moments',
      icon: '🚚',
      conceptName: 'Moving Deck Loads & Point Stress',
      conceptDesc: 'Moving heavy vehicles create shifting point loads (F_crate) across bridge joints, causing localized stress spikes at mid-span.',
      formulaText: 'Bending Moment M_max = (F · L) / 4  |  Shear V = F / 2',
      physicsDesc: 'As the crate travels, beam strain peaks dynamically directly beneath the vehicle contact point.',
      takeaway: 'Reinforce center deck joints with diagonal cross-braces to distribute localized wheel loads.'
    },
    solution: {
      nodes: [
        { id: 'n1', x: 290, y: 380 },
        { id: 'n2', x: 400, y: 380 },
        { id: 'n3', x: 510, y: 380 },
        { id: 'n4', x: 290, y: 460 },
        { id: 'n5', x: 400, y: 460 },
        { id: 'n6', x: 510, y: 460 }
      ],
      beams: [
        { from: 'a1', to: 'n1', mat: 'steel' },
        { from: 'n1', to: 'n2', mat: 'steel' },
        { from: 'n2', to: 'n3', mat: 'steel' },
        { from: 'n3', to: 'a3', mat: 'steel' },
        { from: 'a2', to: 'n4', mat: 'steel' },
        { from: 'n4', to: 'n5', mat: 'wood' },
        { from: 'n5', to: 'n6', mat: 'wood' },
        { from: 'n6', to: 'a4', mat: 'steel' },
        { from: 'a1', to: 'n4', mat: 'wood' },
        { from: 'n1', to: 'n4', mat: 'wood' },
        { from: 'n1', to: 'n5', mat: 'wood' },
        { from: 'n2', to: 'n5', mat: 'wood' },
        { from: 'n2', to: 'n6', mat: 'wood' },
        { from: 'n3', to: 'n6', mat: 'wood' },
        { from: 'n3', to: 'a4', mat: 'wood' }
      ]
    }
  },

  // MISSION 3: CANTILEVER PLATFORM / RAMP
  {
    id: 3,
    title: 'Mission 3 — Collapsed Building',
    shortTitle: 'Collapsed Building',
    type: 'Cantilever Platform',
    story: 'A structural survivor is trapped on a ruined ledge inside the processing tower over a deep precipice. Build a cantilever platform/ramp extending right from the wall anchors to reach them.',
    objective: 'Build a cantilever platform extending 300m right to connect with the survivor node and hold for 5 seconds.',
    gapText: '300m Cantilever Overhang',
    loadText: 'Trapped Survivor',
    hazardText: 'Unbalanced Cantilever Load',
    budget: { wood: 16, steel: 10 },
    testDuration: 5.0,
    hasCrate: false,
    hasSurvivor: true,
    survivorPos: { x: 540, y: 340 },
    windStrength: 0,
    anchors: [
      { x: 220, y: 280, id: 'a1', label: 'Upper Wall Anchor' },
      { x: 220, y: 380, id: 'a2', label: 'Mid Wall Anchor' },
      { x: 220, y: 480, id: 'a3', label: 'Base Wall Anchor' }
    ],
    terrain: {
      leftCliffX: 220,
      rightCliffX: 800,
      deckY: 380,
      waterY: 560
    },
    flashcard: {
      title: 'Mission 3 — Cantilever Overhangs & Rotational Moments',
      icon: '🏗️',
      conceptName: 'Cantilever Structures & Torque Moments',
      conceptDesc: 'Cantilever platforms project outwards with anchor support at only one end, generating intense rotational shear stress at wall mounts.',
      formulaText: 'Torque Moment τ = F · d  |  Shear Stress τ_s = V / A',
      physicsDesc: 'The longer the overhang distance d, the greater the rotational moment τ at wall anchors. Upper chords pull in high tension.',
      takeaway: 'Anchor upper cantilever chords with high-tensile Steel ties to absorb rotational moments.'
    },
    solution: {
      nodes: [
        { id: 'n1', x: 320, y: 340 },
        { id: 'n2', x: 430, y: 340 },
        { id: 'n3', x: 540, y: 340 },
        { id: 'n4', x: 320, y: 440 },
        { id: 'n5', x: 430, y: 440 }
      ],
      beams: [
        { from: 'a1', to: 'n1', mat: 'steel' },
        { from: 'n1', to: 'n2', mat: 'steel' },
        { from: 'n2', to: 'n3', mat: 'steel' },
        { from: 'a2', to: 'n1', mat: 'steel' },
        { from: 'a3', to: 'n4', mat: 'steel' },
        { from: 'n4', to: 'n5', mat: 'steel' },
        { from: 'n5', to: 'n3', mat: 'steel' },
        { from: 'a1', to: 'n4', mat: 'wood' },
        { from: 'n1', to: 'n4', mat: 'wood' },
        { from: 'n1', to: 'n5', mat: 'wood' },
        { from: 'n2', to: 'n5', mat: 'wood' },
        { from: 'a2', to: 'n4', mat: 'wood' }
      ]
    }
  },

  // MISSION 4: RESCUE TOWER (VERTICAL)
  {
    id: 4,
    title: 'Mission 4 — Rescue Tower',
    shortTitle: 'Rescue Tower',
    type: 'Vertical Tower',
    story: 'Ground evacuation is blocked by rubble. Construct a tall vertical rescue tower extending upwards from base anchors to reach an elevated helicopter evacuation pad (Y <= 220).',
    objective: 'Build a stable vertical tower structure that reaches the elevated helicopter pad node at height Y=200 and holds for 5 seconds.',
    gapText: '220m Vertical Ascent',
    loadText: 'Helicopter Pad Load',
    hazardText: 'Vertical Buckling Force',
    budget: { wood: 18, steel: 12 },
    testDuration: 5.0,
    isTowerMission: true,
    targetHeightY: 200,
    hasCrate: false,
    hasSurvivor: false,
    windStrength: 0,
    anchors: [
      { x: 340, y: 480, id: 'a1', label: 'Left Base Anchor' },
      { x: 460, y: 480, id: 'a2', label: 'Right Base Anchor' },
      { x: 400, y: 520, id: 'a3', label: 'Center Bedrock Anchor' }
    ],
    terrain: {
      leftCliffX: 280,
      rightCliffX: 520,
      deckY: 480,
      waterY: 560
    },
    flashcard: {
      title: 'Mission 4 — Vertical Columns & Euler Buckling',
      icon: '🗼',
      conceptName: 'Vertical Tower & Column Buckling',
      conceptDesc: 'Tall vertical towers carrying downward loads are vulnerable to sudden sideways elastic instability called Euler column buckling.',
      formulaText: 'Critical Buckling Load P_cr = (π² · E · I) / L_eff²',
      physicsDesc: 'Axial compression causes tall unbraced columns of length L to snap laterally before reaching material crushing strength.',
      takeaway: 'Add horizontal and diagonal X-bracing to shorten effective unbraced column length L_eff.'
    },
    solution: {
      nodes: [
        { id: 'n1', x: 340, y: 350 },
        { id: 'n2', x: 460, y: 350 },
        { id: 'n3', x: 340, y: 220 },
        { id: 'n4', x: 460, y: 220 },
        { id: 'n5', x: 400, y: 190 }
      ],
      beams: [
        { from: 'a1', to: 'n1', mat: 'steel' },
        { from: 'a2', to: 'n2', mat: 'steel' },
        { from: 'a3', to: 'n1', mat: 'wood' },
        { from: 'a3', to: 'n2', mat: 'wood' },
        { from: 'n1', to: 'n2', mat: 'steel' },
        { from: 'a1', to: 'n2', mat: 'wood' },
        { from: 'a2', to: 'n1', mat: 'wood' },
        { from: 'n1', to: 'n3', mat: 'steel' },
        { from: 'n2', to: 'n4', mat: 'steel' },
        { from: 'n3', to: 'n4', mat: 'steel' },
        { from: 'n1', to: 'n4', mat: 'wood' },
        { from: 'n2', to: 'n3', mat: 'wood' },
        { from: 'n3', to: 'n5', mat: 'steel' },
        { from: 'n4', to: 'n5', mat: 'steel' }
      ]
    }
  },

  // MISSION 5: FLOODED SETTLEMENT (RISING WATER)
  {
    id: 5,
    title: 'Mission 5 — Flooded Settlement',
    shortTitle: 'Flooded Settlement',
    type: 'Elevated Walkway',
    story: 'A dam burst upstream. Flood water is rapidly rising in the ravine. Build an elevated walkway bridge high above the rising flood water to carry a supply crate before the water level peaks.',
    objective: 'Build an elevated walkway that survives a +35px rising flood level while a supply crate crosses.',
    gapText: '420 meters span',
    loadText: 'Moving Supply Crate',
    hazardText: 'Rising Flood Water (+35px Rise)',
    budget: { wood: 22, steel: 12 },
    testDuration: 8.0,
    hasCrate: true,
    crateWeight: 3.8,
    crateSpeed: 45,
    hasSurvivor: false,
    risingWater: true,
    waterRiseSpeed: 3.5,
    windStrength: 0,
    anchors: [
      { x: 170, y: 350, id: 'a1', label: 'Left High Anchor' },
      { x: 150, y: 440, id: 'a2', label: 'Left Base Anchor' },
      { x: 630, y: 350, id: 'a3', label: 'Right High Anchor' },
      { x: 650, y: 440, id: 'a4', label: 'Right Base Anchor' }
    ],
    terrain: {
      leftCliffX: 170,
      rightCliffX: 630,
      deckY: 350,
      waterY: 540
    },
    flashcard: {
      title: 'Mission 5 — Overhead Arches & Hydrodynamic Clearance',
      icon: '🌊',
      conceptName: 'Overhead Arch Suspension & Flood Clearance',
      conceptDesc: 'Overhead arch bridges transfer deck weight laterally through curved thrust paths while keeping structural elements above high water levels.',
      formulaText: 'Arch Thrust H = (w · L²) / (8 · h)',
      physicsDesc: 'Vertical deck loads are suspended from overhead steel arches, preventing water drag and structural submersion during floods.',
      takeaway: 'Elevate structural members above maximum flood peak height to avoid hydrodynamic collapse.'
    },
    solution: {
      nodes: [
        { id: 'n1', x: 285, y: 350 },
        { id: 'n2', x: 400, y: 350 },
        { id: 'n3', x: 515, y: 350 },
        { id: 'n4', x: 285, y: 410 },
        { id: 'n5', x: 400, y: 410 },
        { id: 'n6', x: 515, y: 410 },
        { id: 'n7', x: 400, y: 280 }
      ],
      beams: [
        { from: 'a1', to: 'n1', mat: 'steel' },
        { from: 'n1', to: 'n2', mat: 'steel' },
        { from: 'n2', to: 'n3', mat: 'steel' },
        { from: 'n3', to: 'a3', mat: 'steel' },
        { from: 'a2', to: 'n4', mat: 'steel' },
        { from: 'n4', to: 'n5', mat: 'wood' },
        { from: 'n5', to: 'n6', mat: 'wood' },
        { from: 'n6', to: 'a4', mat: 'steel' },
        { from: 'a1', to: 'n7', mat: 'steel' },
        { from: 'a3', to: 'n7', mat: 'steel' },
        { from: 'n1', to: 'n7', mat: 'wood' },
        { from: 'n2', to: 'n7', mat: 'wood' },
        { from: 'n3', to: 'n7', mat: 'wood' },
        { from: 'n1', to: 'n4', mat: 'steel' },
        { from: 'n2', to: 'n5', mat: 'steel' },
        { from: 'n3', to: 'n6', mat: 'steel' },
        { from: 'n1', to: 'n5', mat: 'wood' },
        { from: 'n3', to: 'n5', mat: 'wood' }
      ]
    }
  },

  // MISSION 6: STORM RESCUE (WIND + FALLING DEBRIS)
  {
    id: 6,
    title: 'Mission 6 — Storm Rescue',
    shortTitle: 'Storm Rescue',
    type: 'Storm-Resistant Structure',
    story: 'Extreme gale winds (55 km/h) are battering the canyon while falling structural debris drops from above. Build a heavy cross-braced bridge to carry the rescue team across.',
    objective: 'Reinforce your structure against extreme lateral wind (55 km/h) and falling debris impacts.',
    gapText: '420 meters span',
    loadText: 'Moving Crate + Storm',
    hazardText: 'Extreme Wind (55 km/h) + Falling Debris',
    budget: { wood: 22, steel: 14 },
    testDuration: 8.0,
    hasCrate: true,
    crateWeight: 3.8,
    crateSpeed: 45,
    windStrength: 45,
    hasDebris: true,
    debrisInterval: 2.5,
    hasSurvivor: false,
    anchors: [
      { x: 170, y: 380, id: 'a1', label: 'Left Deck Anchor' },
      { x: 150, y: 470, id: 'a2', label: 'Left Deep Anchor' },
      { x: 630, y: 380, id: 'a3', label: 'Right Deck Anchor' },
      { x: 650, y: 470, id: 'a4', label: 'Right Deep Anchor' }
    ],
    terrain: {
      leftCliffX: 170,
      rightCliffX: 630,
      deckY: 380,
      waterY: 560
    },
    flashcard: {
      title: 'Mission 6 — Aerodynamic Drag & Impact Impulse',
      icon: '🌪️',
      conceptName: 'Aerodynamic Drag & Dynamic Impact Forces',
      conceptDesc: 'High winds apply lateral drag pressure while falling debris blocks deliver sudden impulse momentum impacts to structural beams.',
      formulaText: 'Wind Drag F_d = ½ · ρ · v² · A · C_d  |  Impulse J = F · Δt',
      physicsDesc: 'Lateral wind increases beam strain by square of wind velocity v². Falling debris strikes convert kinetic energy into peak impact stress spikes.',
      takeaway: 'Use steel diagonal cross-ties to create a multi-directional space frame that resists lateral gale forces.'
    },
    solution: {
      nodes: [
        { id: 'n1', x: 285, y: 380 },
        { id: 'n2', x: 400, y: 380 },
        { id: 'n3', x: 515, y: 380 },
        { id: 'n4', x: 285, y: 470 },
        { id: 'n5', x: 400, y: 470 },
        { id: 'n6', x: 515, y: 470 },
        { id: 'n7', x: 400, y: 300 }
      ],
      beams: [
        { from: 'a1', to: 'n1', mat: 'steel' },
        { from: 'n1', to: 'n2', mat: 'steel' },
        { from: 'n2', to: 'n3', mat: 'steel' },
        { from: 'n3', to: 'a3', mat: 'steel' },
        { from: 'a2', to: 'n4', mat: 'steel' },
        { from: 'n4', to: 'n5', mat: 'steel' },
        { from: 'n5', to: 'n6', mat: 'steel' },
        { from: 'n6', to: 'a4', mat: 'steel' },
        { from: 'a1', to: 'n7', mat: 'steel' },
        { from: 'a3', to: 'n7', mat: 'steel' },
        { from: 'n1', to: 'n7', mat: 'steel' },
        { from: 'n2', to: 'n7', mat: 'steel' },
        { from: 'n3', to: 'n7', mat: 'steel' },
        { from: 'a1', to: 'n4', mat: 'steel' },
        { from: 'n1', to: 'n4', mat: 'wood' },
        { from: 'n1', to: 'n5', mat: 'wood' },
        { from: 'n2', to: 'n4', mat: 'wood' },
        { from: 'n2', to: 'n5', mat: 'wood' },
        { from: 'n2', to: 'n6', mat: 'wood' },
        { from: 'n3', to: 'n5', mat: 'wood' },
        { from: 'n3', to: 'n6', mat: 'wood' },
        { from: 'a3', to: 'n6', mat: 'steel' }
      ]
    }
  },

  // MISSION 7: FINAL EVACUATION (MULTI-HAZARD MASTER CHALLENGE)
  {
    id: 7,
    title: 'Mission 7 — Final Evacuation',
    shortTitle: 'Final Evacuation',
    type: 'Multi-Hazard Master Structure',
    story: 'Hundreds of refugees are waiting for evacuation. Construct a massive long-span bridge through a burning industrial sector, rising flood water, earthquake tremors, and storm wind.',
    objective: 'Build a grand evacuation bridge combining span length, moving convoy load, fire hazard strength loss, rising flood, and storm wind.',
    gapText: '520 meters wide span',
    loadText: 'Heavy Evacuation Convoy',
    hazardText: 'Fire Zone + Rising Flood + Storm + Tremors',
    budget: { wood: 24, steel: 16 },
    testDuration: 10.0,
    hasCrate: true,
    crateWeight: 4.5,
    crateSpeed: 40,
    windStrength: 30,
    risingWater: true,
    waterRiseSpeed: 3.0,
    hasDebris: true,
    debrisInterval: 4.0,
    hasEarthquake: true,
    hasFireZone: true,
    fireZone: { x1: 340, y1: 410, x2: 460, y2: 520, fireModifier: 0.7 },
    restrictedZones: [
      { x: 340, y: 410, width: 120, height: 110, label: '🔥 ACTIVE FIRE ZONE' }
    ],
    anchors: [
      { x: 140, y: 380, id: 'a1', label: 'West Cliff Deck' },
      { x: 120, y: 480, id: 'a2', label: 'West Cliff Base' },
      { x: 660, y: 380, id: 'a3', label: 'East Cliff Deck' },
      { x: 680, y: 480, id: 'a4', label: 'East Cliff Base' }
    ],
    terrain: {
      leftCliffX: 140,
      rightCliffX: 660,
      deckY: 380,
      waterY: 540
    },
    flashcard: {
      title: 'Mission 7 — Thermal Degradation & Multi-Hazard Redundancy',
      icon: '🔥',
      conceptName: 'Thermal Degradation & Structural Redundancy',
      conceptDesc: 'Extreme heat reduces structural material yield strength, while combined wind, flood, and seismic hazards require redundant load paths.',
      formulaText: 'Degraded Strength σ_eff = σ_max · Fire_Modifier',
      physicsDesc: 'Fire degrades Young’s modulus E and yield strength σ_eff. Redundant structural truss paths re-route forces if key members degrade.',
      takeaway: 'Reroute critical load paths above fire zones and build redundant parallel trusses for disaster survival.'
    },
    solution: {
      nodes: [
        { id: 'n1', x: 270, y: 380 },
        { id: 'n2', x: 400, y: 380 },
        { id: 'n3', x: 530, y: 380 },
        { id: 'n4', x: 270, y: 280 }, // Overhead Arch Nodes!
        { id: 'n5', x: 400, y: 280 },
        { id: 'n6', x: 530, y: 280 },
        { id: 'n7', x: 200, y: 470 }, // Bedrock support nodes
        { id: 'n8', x: 600, y: 470 }
      ],
      beams: [
        { from: 'a1', to: 'n1', mat: 'steel' },
        { from: 'n1', to: 'n2', mat: 'steel' },
        { from: 'n2', to: 'n3', mat: 'steel' },
        { from: 'n3', to: 'a3', mat: 'steel' },
        { from: 'a1', to: 'n4', mat: 'steel' },
        { from: 'n4', to: 'n5', mat: 'steel' },
        { from: 'n5', to: 'n6', mat: 'steel' },
        { from: 'n6', to: 'a3', mat: 'steel' },
        { from: 'n1', to: 'n4', mat: 'steel' },
        { from: 'n2', to: 'n5', mat: 'steel' },
        { from: 'n3', to: 'n6', mat: 'steel' },
        { from: 'n1', to: 'n5', mat: 'wood' },
        { from: 'n2', to: 'n4', mat: 'wood' },
        { from: 'n2', to: 'n6', mat: 'wood' },
        { from: 'n3', to: 'n5', mat: 'wood' },
        { from: 'a2', to: 'n7', mat: 'steel' },
        { from: 'n7', to: 'n1', mat: 'steel' },
        { from: 'a4', to: 'n8', mat: 'steel' },
        { from: 'n8', to: 'n3', mat: 'steel' }
      ]
    }
  }
];
