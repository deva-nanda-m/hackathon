/* ==========================================================================
   AFTER THE COLLAPSE — Mission Configurations
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
  {
    id: 1,
    title: 'Mission 1 — Cross the Ravine',
    shortTitle: 'Cross the Ravine',
    story: 'The old suspension bridge is gone. Settlement Alpha on the far cliff is completely isolated without water or shelter. Build a temporary bridge connecting both cliffs that can support its own structural weight.',
    objective: 'Build a bridge connecting the left and right cliffs. Press TEST STRUCTURE to verify it holds self-weight for 5 seconds.',
    gapText: '350 meters span',
    loadText: 'Self-Weight',
    hazardText: 'None',
    budget: { wood: 15, steel: 5 },
    testDuration: 5.0, // seconds
    hasCrate: false,
    hasSurvivor: false,
    windStrength: 0,
    anchors: [
      // Left cliff top & bottom supports
      { x: 220, y: 380, id: 'a1', label: 'Left Deck Anchor' },
      { x: 200, y: 460, id: 'a2', label: 'Left Support Anchor' },
      // Right cliff top & bottom supports
      { x: 580, y: 380, id: 'a3', label: 'Right Deck Anchor' },
      { x: 600, y: 460, id: 'a4', label: 'Right Support Anchor' }
    ],
    terrain: {
      leftCliffX: 220,
      rightCliffX: 580,
      deckY: 380,
      waterY: 560
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

  {
    id: 2,
    title: 'Mission 2 — Move the Supply Crate',
    shortTitle: 'Move the Supply Crate',
    story: 'Settlement Alpha urgently requires heavy medical crates and water purifiers. Strengthen your bridge design so it can carry a 500kg supply crate rolling across the deck.',
    objective: 'Construct a bridge that allows the heavy supply crate to roll across safely from left to right platform.',
    gapText: '400 meters span',
    loadText: '500kg Heavy Crate',
    hazardText: 'Dynamic Deck Load',
    budget: { wood: 18, steel: 8 },
    testDuration: 8.0,
    hasCrate: true,
    crateWeight: 4.5,
    crateSpeed: 45, // px per second
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

  {
    id: 3,
    title: 'Mission 3 — Rescue the Survivor',
    shortTitle: 'Rescue the Survivor',
    story: 'A structural survivor is trapped on a ledge inside the ruined processing tower over a deep precipice. Build a cantilever platform extending out from the left tower to reach and support them.',
    objective: 'Build a cantilever platform extending 300m right to connect with the survivor node and hold position for 5 seconds.',
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
      // Left vertical wall anchors (cantilever mount)
      { x: 220, y: 280, id: 'a1', label: 'Upper Wall Anchor' },
      { x: 220, y: 380, id: 'a2', label: 'Mid Wall Anchor' },
      { x: 220, y: 480, id: 'a3', label: 'Base Wall Anchor' }
    ],
    terrain: {
      leftCliffX: 220,
      rightCliffX: 800, // No right cliff! Open abyss
      deckY: 380,
      waterY: 560
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

  {
    id: 4,
    title: 'Mission 4 — Survive the Storm',
    shortTitle: 'Survive the Storm',
    story: 'A violent gale storm is blowing through the ravine. Build a reinforced wind-resistant structure that can withstand lateral wind forces while a supply crate crosses.',
    objective: 'Reinforce your bridge with diagonal cross-bracing to survive 40 km/h horizontal storm winds.',
    gapText: '420 meters span',
    loadText: 'Supply Crate + Storm',
    hazardText: 'Strong Lateral Wind (40 km/h)',
    budget: { wood: 20, steel: 12 },
    testDuration: 8.0,
    hasCrate: true,
    crateWeight: 3.5,
    crateSpeed: 50,
    hasSurvivor: false,
    windStrength: 38, // Lateral wind force
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
    solution: {
      nodes: [
        { id: 'n1', x: 285, y: 380 },
        { id: 'n2', x: 400, y: 380 },
        { id: 'n3', x: 515, y: 380 },
        { id: 'n4', x: 285, y: 470 },
        { id: 'n5', x: 400, y: 470 },
        { id: 'n6', x: 515, y: 470 }
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

  {
    id: 5,
    title: 'Mission 5 — Final Evacuation',
    shortTitle: 'Final Evacuation',
    story: 'The final evacuation convoy of hundreds of refugees is waiting. Construct a massive long-span bridge across the widest ravine section capable of carrying heavy evacuation transport in fierce storm conditions.',
    objective: 'Build a grand evacuation bridge combining span length, heavy load carrying, and storm wind resistance with limited resources.',
    gapText: '500 meters wide span',
    loadText: 'Heavy Evacuation Convoy',
    hazardText: 'Severe Storm + Heavy Convoy',
    budget: { wood: 22, steel: 14 },
    testDuration: 10.0,
    hasCrate: true,
    crateWeight: 5.5,
    crateSpeed: 40,
    hasSurvivor: false,
    windStrength: 45,
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
      waterY: 560
    },
    solution: {
      nodes: [
        { id: 'n1', x: 270, y: 380 },
        { id: 'n2', x: 400, y: 380 },
        { id: 'n3', x: 530, y: 380 },
        { id: 'n4', x: 270, y: 480 },
        { id: 'n5', x: 400, y: 480 },
        { id: 'n6', x: 530, y: 480 }
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
  }
];
