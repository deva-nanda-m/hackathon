/* ==========================================================================
   AFTER THE COLLAPSE — State Machine & Game Coordinator
   Manages game state flow: BRIEFING -> BUILD -> TESTING -> SUCCESS / FAILURE
   ========================================================================== */

import { MISSIONS } from './missions.js';
import { SupplyCrate, ParticleSystem } from '../engine/loads.js';
import { soundEngine } from './audio.js';

export class StateMachine {
  constructor(physics, renderer) {
    this.physics = physics;
    this.renderer = renderer;
    this.editor = null;
    this.ui = null;

    this.currentMissionIndex = 0;
    this.currentMission = MISSIONS[0];
    this.state = 'BRIEFING'; // 'BRIEFING', 'BUILD', 'TESTING', 'SUCCESS', 'FAILURE'

    this.testElapsedTime = 0;
    this.crate = null;
    this.particles = new ParticleSystem();

    this.survivorHoldTimer = 0;
  }

  init(editor, ui) {
    this.editor = editor;
    this.ui = ui;

    // Attach callbacks
    this.editor.onBudgetChange = (budgetData) => {
      this.ui.updateHUD(this.currentMission, budgetData);
    };

    this.physics.onBeamBreak = (beam) => {
      soundEngine.playSnap();
      this.particles.createSparks((beam.nodeA.x + beam.nodeB.x) / 2, (beam.nodeA.y + beam.nodeB.y) / 2, beam.material.color, 25);
    };

    this.startCampaign();
  }

  startCampaign() {
    this.currentMissionIndex = 0;
    this.loadMission(MISSIONS[0]);
  }

  nextMission() {
    this.currentMissionIndex++;
    if (this.currentMissionIndex < MISSIONS.length) {
      this.loadMission(MISSIONS[this.currentMissionIndex]);
    } else {
      this.setState('VICTORY');
    }
  }

  loadMission(mission) {
    this.currentMission = mission;
    this.physics.reset();
    this.particles.reset();

    // Create fixed mission anchors
    mission.anchors.forEach(a => {
      this.physics.addNode(a.x, a.y, true, true, a.id);
    });

    // Create crate vehicle if needed
    if (mission.hasCrate) {
      this.crate = new SupplyCrate(
        mission.terrain.leftCliffX,
        mission.terrain.rightCliffX,
        mission.terrain.deckY,
        mission.crateWeight,
        mission.crateSpeed
      );
    } else {
      this.crate = null;
    }

    this.editor.setMission(mission);
    this.ui.updateHUD(mission, {
      wood: mission.budget.wood,
      steel: mission.budget.steel,
      totalCost: 0
    });

    this.setState('BRIEFING');
  }

  setState(newState) {
    this.state = newState;

    if (newState === 'BRIEFING') {
      this.physics.isSimulating = false;
      this.ui.showBriefingModal(this.currentMission);
    } else if (newState === 'BUILD') {
      this.physics.isSimulating = false;
      this.ui.updateTestUI(false, 0, this.currentMission.testDuration);
    } else if (newState === 'TESTING') {
      this.physics.isSimulating = true;
      this.testElapsedTime = 0;
      this.survivorHoldTimer = 0;
      this.physics.failedBeamInfo = null;

      if (this.crate) {
        this.crate.start();
      }

      this.ui.updateTestUI(true, 0, this.currentMission.testDuration);
    } else if (newState === 'SUCCESS') {
      this.physics.isSimulating = false;
      this.ui.updateTestUI(false, 0, this.currentMission.testDuration);

      const maxStrain = Math.round(this.physics.getMaxStress() * 100);
      const usedWood = this.editor.initialBudget.wood - this.editor.budget.wood;
      const usedSteel = this.editor.initialBudget.steel - this.editor.budget.steel;
      const totalCost = (usedWood * 1) + (usedSteel * 3);
      const totalAllowed = (this.editor.initialBudget.wood * 1) + (this.editor.initialBudget.steel * 3);
      const efficiency = Math.round(((totalAllowed - totalCost) / totalAllowed) * 100);

      this.ui.showSuccessModal({
        efficiency: Math.max(10, efficiency),
        maxStrain: Math.min(100, maxStrain),
        totalCost: totalCost
      });
    } else if (newState === 'FAILURE') {
      this.physics.isSimulating = false;
      this.ui.updateTestUI(false, 0, this.currentMission.testDuration);
      this.ui.showFailureModal(this.physics.failedBeamInfo);
    } else if (newState === 'VICTORY') {
      this.physics.isSimulating = false;
      this.ui.showVictoryModal();
    }
  }

  startTest() {
    // Basic verification: structure must have at least 1 user beam
    if (this.physics.beams.length === 0) {
      alert('Construct at least one beam connecting anchors before testing!');
      return;
    }
    this.setState('TESTING');
  }

  stopTest(reason = 'EDIT') {
    if (reason === 'FAIL') {
      this.setState('FAILURE');
    } else if (reason === 'WIN') {
      this.setState('SUCCESS');
    } else {
      this.setState('BUILD');
    }
  }

  update(dt, time) {
    // Always update visual particles
    if (this.currentMission.windStrength > 0) {
      this.particles.createWindParticles(this.renderer.canvas.width / this.renderer.dpr, this.renderer.canvas.height / this.renderer.dpr);
    }
    this.particles.update(dt);

    if (this.state !== 'TESTING') return;

    this.testElapsedTime += dt;
    this.ui.updateTestUI(true, this.testElapsedTime, this.currentMission.testDuration);

    // 1. Run physics step
    this.physics.update(dt, this.currentMission.windStrength, this.crate);

    // Play strain groan sounds occasionally under high stress
    if (Math.random() < 0.05 && this.physics.getMaxStress() > 0.6) {
      soundEngine.playGroan(this.physics.getMaxStress());
    }

    // 2. Update supply crate vehicle if present
    if (this.crate) {
      this.crate.update(dt, this.physics.nodes, this.physics.beams, this.currentMission.terrain.waterY);

      if (this.crate.state === 'falling') {
        this.stopTest('FAIL');
        return;
      }
    }

    // 3. Check failure condition (structure collapse into ravine)
    if (this.physics.isStructureCollapsed(this.currentMission.terrain.waterY)) {
      this.stopTest('FAIL');
      return;
    }

    // 4. Check Mission Specific Win Conditions
    const m = this.currentMission;

    if (m.hasSurvivor) {
      // Mission 3: platform must reach survivor position (within 35px) and hold position
      const survivorPos = m.survivorPos;
      let reached = false;
      for (const node of this.physics.nodes) {
        const dx = node.x - survivorPos.x;
        const dy = node.y - survivorPos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 35) {
          reached = true;
          break;
        }
      }

      if (reached) {
        this.survivorHoldTimer += dt;
        if (this.survivorHoldTimer >= m.testDuration) {
          this.stopTest('WIN');
          return;
        }
      } else if (this.testElapsedTime >= m.testDuration + 2.0) {
        // Did not reach survivor in time
        this.stopTest('FAIL');
        return;
      }
    } else if (m.hasCrate) {
      // Mission 2, 4, 5: Crate must safely cross to right cliff
      if (this.crate && this.crate.state === 'goal') {
        this.stopTest('WIN');
        return;
      }
    } else {
      // Mission 1: Hold self weight for full testDuration
      if (this.testElapsedTime >= m.testDuration) {
        this.stopTest('WIN');
        return;
      }
    }
  }

  draw(width, height, time) {
    // 1. Draw Terrain & Environment
    this.renderer.drawTerrain(this.currentMission, width, height, time);

    // 2. Draw Construction Grid (only during BUILD)
    if (this.state === 'BUILD') {
      this.renderer.drawGrid(width, height);
    }

    // 3. Draw Beams & Stress Heatmaps
    const isTesting = this.state === 'TESTING' || this.state === 'FAILURE';
    this.renderer.drawBeams(this.physics.beams, isTesting);

    // 4. Draw Joint Nodes
    const activeNode = this.state === 'BUILD' ? this.editor.hoverNode : null;
    this.renderer.drawNodes(this.physics.nodes, activeNode);

    // 5. Draw Crate / Survivor
    if (this.currentMission.hasSurvivor) {
      this.renderer.drawSurvivor(this.currentMission.survivorPos, time);
    }
    if (this.crate) {
      this.renderer.drawCrate(this.crate);
    }

    // 6. Draw Construction Line Preview
    if (this.state === 'BUILD') {
      this.editor.drawPreview();
    }

    // 7. Draw Visual Particles & Sparks
    this.particles.draw(this.renderer.ctx);
  }
}
