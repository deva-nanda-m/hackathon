/* ==========================================================================
   AFTER THE COLLAPSE — Expanded State Machine & Campaign Coordinator
   Manages 7-mission flow, dynamic test phase events, rising flood water,
   falling debris, structural integrity checks, and mission objectives.
   ========================================================================== */

import { MISSIONS } from './missions.js';
import { SupplyCrate, FallingDebrisManager, ParticleSystem } from '../engine/loads.js';
import { soundEngine } from './audio.js';

export class StateMachine {
  constructor(physics, renderer) {
    this.physics = physics;
    this.renderer = renderer;
    this.editor = null;
    this.ui = null;

    this.currentMissionIndex = 0;
    this.currentMission = MISSIONS[0];
    this.state = 'BRIEFING';

    this.testElapsedTime = 0;
    this.crate = null;
    this.debrisManager = new FallingDebrisManager();
    this.particles = new ParticleSystem();

    this.currentWaterY = 560;
    this.survivorHoldTimer = 0;
    this.towerHoldTimer = 0;
  }

  init(editor, ui) {
    this.editor = editor;
    this.ui = ui;

    this.editor.onBudgetChange = (budgetData) => {
      this.ui.updateHUD(this.currentMission, budgetData);
    };

    this.editor.onRestrictedWarning = (visible) => {
      this.ui.showRestrictedWarning(visible);
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
    this.debrisManager.reset();
    this.currentWaterY = mission.terrain.waterY;

    // Create fixed anchors
    mission.anchors.forEach(a => {
      this.physics.addNode(a.x, a.y, true, true, a.id);
    });

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
      this.currentWaterY = this.currentMission.terrain.waterY;
      this.ui.updateTestUI(false, 0, this.currentMission.testDuration);
      this.ui.updateIntegrityMeter(100);
    } else if (newState === 'TESTING') {
      this.physics.isSimulating = true;
      this.testElapsedTime = 0;
      this.survivorHoldTimer = 0;
      this.towerHoldTimer = 0;
      this.currentWaterY = this.currentMission.terrain.waterY;
      this.physics.failedBeamInfo = null;

      if (this.crate) this.crate.start();
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
    if (this.physics.beams.length === 0) {
      alert('Construct at least one beam connecting anchors before testing!');
      return;
    }
    this.setState('TESTING');
  }

  stopTest(reason = 'EDIT') {
    if (reason === 'FAIL') this.setState('FAILURE');
    else if (reason === 'WIN') this.setState('SUCCESS');
    else this.setState('BUILD');
  }

  update(dt, time) {
    const m = this.currentMission;

    // Environmental wind particles
    if (m.windStrength > 0) {
      this.particles.createWindParticles(this.renderer.canvas.width / this.renderer.dpr, this.renderer.canvas.height / this.renderer.dpr);
    }
    this.particles.update(dt);

    if (this.state !== 'TESTING') return;

    this.testElapsedTime += dt;
    this.ui.updateTestUI(true, this.testElapsedTime, m.testDuration);

    // 1. Handle Rising Water Level Hazard
    if (m.risingWater) {
      this.currentWaterY -= (m.waterRiseSpeed || 5.0) * dt;
    }

    // 2. Handle Falling Debris Hazard
    if (m.hasDebris) {
      this.debrisManager.update(dt, m.debrisInterval || 2.5, this.physics.nodes, this.physics.beams, this.particles);
    }

    // 3. Update Physics engine with Fire, Earthquake & Wind
    this.physics.update(dt, m.windStrength, this.crate, m, this.testElapsedTime);

    // 4. Update Structural Integrity Meter
    const integrity = this.physics.getStructuralIntegrity();
    this.ui.updateIntegrityMeter(integrity);

    if (integrity <= 14) {
      this.stopTest('FAIL');
      return;
    }

    // Play groan sounds on high stress
    if (Math.random() < 0.05 && this.physics.getMaxStress() > 0.6) {
      soundEngine.playGroan(this.physics.getMaxStress());
    }

    // 5. Update Supply Crate vehicle if present
    if (this.crate) {
      this.crate.update(dt, this.physics.nodes, this.physics.beams, this.currentWaterY);
      if (this.crate.state === 'falling') {
        this.stopTest('FAIL');
        return;
      }
    }

    // 6. Check structural collapse into water
    if (this.physics.isStructureCollapsed(this.currentWaterY)) {
      this.stopTest('FAIL');
      return;
    }

    // 7. Check Mission Specific Win Conditions
    if (m.isTowerMission) {
      // Mission 4: Vertical Rescue Tower reaches Y <= targetHeightY (200)
      const targetY = m.targetHeightY || 200;
      let reachedHeight = false;
      for (const node of this.physics.nodes) {
        if (!node.fixed && node.y <= targetY + 15) {
          reachedHeight = true;
          break;
        }
      }

      if (reachedHeight) {
        this.towerHoldTimer += dt;
        if (this.towerHoldTimer >= m.testDuration) {
          this.stopTest('WIN');
          return;
        }
      } else if (this.testElapsedTime >= m.testDuration + 2.0) {
        this.stopTest('FAIL');
        return;
      }
    } else if (m.hasSurvivor) {
      // Mission 3: Cantilever reaches survivor position
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
        this.stopTest('FAIL');
        return;
      }
    } else if (m.hasCrate) {
      // Missions 2, 5, 6, 7: Crate reaches destination
      if (this.crate && this.crate.state === 'goal') {
        this.stopTest('WIN');
        return;
      }
    } else {
      // Mission 1: Hold self weight for full duration
      if (this.testElapsedTime >= m.testDuration) {
        this.stopTest('WIN');
        return;
      }
    }
  }

  draw(width, height, time) {
    const m = this.currentMission;

    // 1. Draw Terrain, Rising Water & Environment
    this.renderer.drawTerrain(m, width, height, time, this.currentWaterY);

    // 2. Draw Fire Zones & Restricted Building Areas
    this.renderer.drawHazardsAndRestrictedZones(m, time);

    // 3. Draw Helicopter Pad Target (Mission 4 Rescue Tower)
    if (m.isTowerMission) {
      this.renderer.drawTowerTarget(m, time);
    }

    // 4. Draw Grid
    if (this.state === 'BUILD') {
      this.renderer.drawGrid(width, height);
    }

    // 5. Draw Beams & Stress Heatmaps & Failed Beam Callout
    const isTesting = this.state === 'TESTING' || this.state === 'FAILURE';
    const failedBeam = this.state === 'FAILURE' ? this.physics.failedBeamObject : null;
    this.renderer.drawBeams(this.physics.beams, isTesting, failedBeam);

    // 6. Draw Joint Nodes
    const activeNode = this.state === 'BUILD' ? this.editor.hoverNode : null;
    this.renderer.drawNodes(this.physics.nodes, activeNode);

    // 7. Draw Crate / Survivor / Falling Debris
    if (m.hasSurvivor) {
      this.renderer.drawSurvivor(m.survivorPos, time);
    }
    if (this.crate) {
      this.renderer.drawCrate(this.crate);
    }
    if (m.hasDebris && this.state === 'TESTING') {
      this.debrisManager.draw(this.renderer.ctx);
    }

    // 8. Draw Construction Line Preview
    if (this.state === 'BUILD') {
      this.editor.drawPreview();
    }

    // 9. Draw Particles & Sparks
    this.particles.draw(this.renderer.ctx);
  }
}
