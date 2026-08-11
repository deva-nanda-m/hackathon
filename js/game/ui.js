/* ==========================================================================
   AFTER THE COLLAPSE — UI & Modal Controller
   Manages Structural Integrity meter, environmental hazard HUD, modal cards, and hotkeys.
   ========================================================================== */

import { soundEngine } from './audio.js';

export class UIController {
  constructor(stateMachine) {
    this.sm = stateMachine;

    // DOM Elements
    this.woodBudgetVal = document.getElementById('wood-budget-val');
    this.steelBudgetVal = document.getElementById('steel-budget-val');
    this.totalCostVal = document.getElementById('total-cost-val');
    this.hudMissionBadge = document.getElementById('hud-mission-badge');
    this.hudMissionTitle = document.getElementById('hud-mission-title');
    this.objectiveText = document.getElementById('objective-text');

    // Structural Integrity Meter
    this.integrityStatusText = document.getElementById('integrity-status-text');
    this.integrityFill = document.getElementById('integrity-fill');
    this.integrityVal = document.getElementById('integrity-val');

    // Hazard & Restricted Overlays
    this.hazardBanner = document.getElementById('hazard-banner');
    this.hazardIcon = document.getElementById('hazard-icon');
    this.hazardText = document.getElementById('hazard-text');
    this.restrictedWarning = document.getElementById('restricted-warning');

    // Tool & Action Buttons
    this.toolButtons = document.querySelectorAll('.tool-btn');
    this.btnTest = document.getElementById('btn-test');
    this.btnTestText = document.getElementById('btn-test-text');
    this.btnUndo = document.getElementById('btn-undo');
    this.btnReset = document.getElementById('btn-reset');
    this.btnAutoSolve = document.getElementById('btn-auto-solve');
    this.btnAudioToggle = document.getElementById('btn-audio-toggle');
    this.btnHelp = document.getElementById('btn-help');

    // Canvas Overlays
    this.testStatusBanner = document.getElementById('test-status-banner');
    this.testStatusText = document.getElementById('test-status-text');
    this.testTimer = document.getElementById('test-timer');

    // Modals
    this.modalBriefing = document.getElementById('modal-briefing');
    this.modalFailure = document.getElementById('modal-failure');
    this.modalSuccess = document.getElementById('modal-success');
    this.modalFlashcard = document.getElementById('modal-flashcard');
    this.modalVictory = document.getElementById('modal-victory');

    // Modal Content
    this.briefingMissionTitle = document.getElementById('briefing-mission-title');
    this.briefingStoryText = document.getElementById('briefing-story-text');
    this.briefingGapVal = document.getElementById('briefing-gap-val');
    this.briefingLoadVal = document.getElementById('briefing-load-val');
    this.briefingBudgetVal = document.getElementById('briefing-budget-val');
    this.briefingHazardVal = document.getElementById('briefing-hazard-val');

    this.failCauseTitle = document.getElementById('fail-cause-title');
    this.failCauseDesc = document.getElementById('fail-cause-desc');
    this.failAdviceText = document.getElementById('fail-advice-text');

    this.statEfficiency = document.getElementById('stat-efficiency');
    this.statMaxStrain = document.getElementById('stat-max-strain');
    this.statTotalCost = document.getElementById('stat-total-cost');

    // Flashcard Content
    this.fcTitle = document.getElementById('fc-title');
    this.fcIcon = document.getElementById('fc-icon');
    this.fcConceptName = document.getElementById('fc-concept-name');
    this.fcConceptDesc = document.getElementById('fc-concept-desc');
    this.fcFormulaText = document.getElementById('fc-formula-text');
    this.fcPhysicsDesc = document.getElementById('fc-physics-desc');
    this.fcTakeawayText = document.getElementById('fc-takeaway-text');
    this.btnContinueFlashcard = document.getElementById('btn-continue-flashcard');

    this.initEventListeners();
  }

  initEventListeners() {
    this.toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        this.selectTool(tool);
        soundEngine.playClick();
      });
    });

    this.btnTest.addEventListener('click', () => {
      soundEngine.playClick();
      if (this.sm.state === 'BUILD') {
        this.sm.startTest();
      } else if (this.sm.state === 'TESTING') {
        this.sm.stopTest('EDIT');
      }
    });

    this.btnUndo.addEventListener('click', () => {
      if (this.sm.state === 'BUILD') this.sm.editor.undo();
    });

    this.btnReset.addEventListener('click', () => {
      soundEngine.playClick();
      if (this.sm.state === 'BUILD') this.sm.editor.resetStructure();
    });

    this.btnAutoSolve.addEventListener('click', () => {
      soundEngine.playClick();
      if (this.sm.state === 'BUILD') {
        this.sm.editor.autoSolve(this.sm.currentMission.solution);
      }
    });

    this.btnAudioToggle.addEventListener('click', () => {
      const enabled = soundEngine.toggle();
      this.btnAudioToggle.textContent = enabled ? '🔊' : '🔇';
    });

    this.btnHelp.addEventListener('click', () => {
      soundEngine.playClick();
      this.showBriefingModal();
    });

    // Modal Actions
    document.getElementById('btn-start-mission').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideAllModals();
      this.sm.setState('BUILD');
    });

    document.getElementById('btn-retry-mission').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideAllModals();
      this.sm.editor.resetStructure();
      this.sm.setState('BUILD');
    });

    document.getElementById('btn-edit-structure').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideAllModals();
      this.sm.setState('BUILD');
    });

    document.getElementById('btn-next-mission').addEventListener('click', () => {
      soundEngine.playClick();
      this.showFlashcardModal(this.sm.currentMission);
    });

    if (this.btnContinueFlashcard) {
      this.btnContinueFlashcard.addEventListener('click', () => {
        soundEngine.playClick();
        this.hideAllModals();
        this.sm.nextMission();
      });
    }

    document.getElementById('btn-restart-game').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideAllModals();
      this.sm.startCampaign();
    });

    // Keyboard Shortcuts [1, 2, 3, 4, Space, Z, R, A]
    window.addEventListener('keydown', (e) => {
      if (e.key === '1') this.selectTool('node');
      else if (e.key === '2') this.selectTool('wood');
      else if (e.key === '3') this.selectTool('steel');
      else if (e.key === '4') this.selectTool('delete');
      else if (e.code === 'Space') {
        e.preventDefault();
        this.btnTest.click();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this.sm.editor.undo();
      } else if (e.key.toLowerCase() === 'r' && this.sm.state === 'BUILD') {
        this.sm.editor.resetStructure();
      } else if (e.key.toLowerCase() === 'a' && this.sm.state === 'BUILD') {
        this.btnAutoSolve.click();
      }
    });
  }

  selectTool(toolName) {
    this.toolButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolName);
    });
    this.sm.editor.setTool(toolName);
  }

  updateHUD(mission, budgetData) {
    this.hudMissionBadge.textContent = `MISSION ${mission.id}`;
    this.hudMissionTitle.textContent = mission.shortTitle;
    this.objectiveText.textContent = mission.objective;

    if (budgetData) {
      this.woodBudgetVal.textContent = budgetData.wood;
      this.steelBudgetVal.textContent = budgetData.steel;
      this.totalCostVal.textContent = `$${budgetData.totalCost}`;
    }

    // Hazard HUD Banner
    if (mission.windStrength > 0 || mission.hasFireZone || mission.risingWater || mission.hasDebris) {
      this.hazardBanner.classList.remove('hidden');
      let hazardStr = mission.hazardText;
      let iconStr = '⚠️';
      if (mission.windStrength > 0) iconStr = '💨';
      else if (mission.hasFireZone) iconStr = '🔥';
      else if (mission.risingWater) iconStr = '🌊';
      else if (mission.hasDebris) iconStr = '☄️';

      this.hazardIcon.textContent = iconStr;
      this.hazardText.textContent = hazardStr;
    } else {
      this.hazardBanner.classList.add('hidden');
    }

    this.updateIntegrityMeter(100);
  }

  updateIntegrityMeter(healthPercent) {
    const hp = Math.max(0, Math.min(100, Math.round(healthPercent)));
    this.integrityVal.textContent = `${hp}%`;
    this.integrityFill.style.width = `${hp}%`;

    let stateClass = 'stable';
    let stateText = 'STABLE';

    if (hp >= 70) {
      stateClass = 'stable'; stateText = 'STABLE';
    } else if (hp >= 40) {
      stateClass = 'warning'; stateText = 'WARNING';
    } else if (hp >= 15) {
      stateClass = 'critical'; stateText = 'CRITICAL';
    } else {
      stateClass = 'collapse'; stateText = 'COLLAPSE';
    }

    this.integrityStatusText.textContent = stateText;
    this.integrityStatusText.className = `integrity-status-badge ${stateClass}`;
    this.integrityFill.className = `integrity-fill ${stateClass}`;
  }

  showRestrictedWarning(visible = true) {
    if (visible) this.restrictedWarning.classList.remove('hidden');
    else this.restrictedWarning.classList.add('hidden');
  }

  updateTestUI(isTesting, elapsed, maxTime) {
    if (isTesting) {
      this.testStatusBanner.classList.remove('hidden');
      this.btnTest.classList.add('btn-secondary');
      this.btnTest.classList.remove('btn-primary');
      this.btnTestText.textContent = 'STOP TEST';

      const remaining = Math.max(0, maxTime - elapsed).toFixed(1);
      this.testTimer.textContent = `${remaining}s`;
    } else {
      this.testStatusBanner.classList.add('hidden');
      this.btnTest.classList.add('btn-primary');
      this.btnTest.classList.remove('btn-secondary');
      this.btnTestText.textContent = 'TEST STRUCTURE';
    }
  }

  showBriefingModal(mission) {
    const m = mission || this.sm.currentMission;
    this.briefingMissionTitle.textContent = m.title;
    this.briefingStoryText.textContent = m.story;
    this.briefingGapVal.textContent = m.gapText;
    this.briefingLoadVal.textContent = m.loadText;
    this.briefingBudgetVal.textContent = `${m.budget.wood} Wood, ${m.budget.steel} Steel`;
    this.briefingHazardVal.textContent = m.hazardText;

    this.hideAllModals();
    this.modalBriefing.classList.remove('hidden');
  }

  showFailureModal(failedInfo) {
    this.hideAllModals();
    if (failedInfo) {
      this.failCauseTitle.textContent = `${failedInfo.materialName} Failed Under ${failedInfo.cause}`;
      this.failCauseDesc.textContent = `Beam experienced ${failedInfo.stressVal}% strain stress (Material limit: ${failedInfo.strengthVal || 100}%), triggering structural collapse.`;
    } else {
      this.failCauseTitle.textContent = 'Structure Collapsed Into Ravine / Flood';
      this.failCauseDesc.textContent = 'The bridge/platform dropped below safety height due to excessive displacement or flood water.';
    }

    if (failedInfo && failedInfo.cause.includes('Compression')) {
      this.failAdviceText.textContent = 'Compression failure! Add triangular cross-bracing to distribute weight or upgrade high-compression members to Steel.';
    } else if (failedInfo && failedInfo.cause.includes('Tension')) {
      this.failAdviceText.textContent = 'Tension snap! Anchor upper chords with Steel beams or shorten single-beam spans.';
    } else if (failedInfo && failedInfo.cause.includes('Fire')) {
      this.failAdviceText.textContent = 'Fire degradation! Build structure higher to pass above active fire zones or use Steel.';
    } else {
      this.failAdviceText.textContent = 'Add diagonal support beams from bedrock anchors up to the deck nodes.';
    }

    soundEngine.playFail();
    this.modalFailure.classList.remove('hidden');
  }

  showSuccessModal(stats) {
    this.hideAllModals();
    this.statEfficiency.textContent = `${stats.efficiency}%`;
    this.statMaxStrain.textContent = `${stats.maxStrain}%`;
    this.statTotalCost.textContent = `$${stats.totalCost}`;

    soundEngine.playSuccess();
    this.modalSuccess.classList.remove('hidden');
  }

  showFlashcardModal(mission) {
    const fc = mission ? mission.flashcard : null;
    if (!fc) {
      this.hideAllModals();
      this.sm.nextMission();
      return;
    }

    this.hideAllModals();
    this.fcTitle.textContent = fc.title;
    this.fcIcon.textContent = fc.icon || '🌉';
    this.fcConceptName.textContent = fc.conceptName;
    this.fcConceptDesc.textContent = fc.conceptDesc;
    this.fcFormulaText.textContent = fc.formulaText;
    this.fcPhysicsDesc.textContent = fc.physicsDesc;
    this.fcTakeawayText.textContent = fc.takeaway;

    this.modalFlashcard.classList.remove('hidden');
  }

  showVictoryModal() {
    this.hideAllModals();
    soundEngine.playSuccess();
    this.modalVictory.classList.remove('hidden');
  }

  hideAllModals() {
    this.modalBriefing.classList.add('hidden');
    this.modalFailure.classList.add('hidden');
    this.modalSuccess.classList.add('hidden');
    this.modalFlashcard.classList.add('hidden');
    this.modalVictory.classList.add('hidden');
  }
}
