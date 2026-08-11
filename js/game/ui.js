/* ==========================================================================
   AFTER THE COLLAPSE — UI & Modal Controller
   Manages DOM interactions, HUD budget counters, diagnostic popups, and keyboard shortcuts.
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

    this.toolButtons = document.querySelectorAll('.tool-btn');
    this.btnTest = document.getElementById('btn-test');
    this.btnTestText = document.getElementById('btn-test-text');
    this.btnUndo = document.getElementById('btn-undo');
    this.btnReset = document.getElementById('btn-reset');
    this.btnAudioToggle = document.getElementById('btn-audio-toggle');
    this.btnHelp = document.getElementById('btn-help');

    // Overlays
    this.windIndicator = document.getElementById('wind-indicator');
    this.windSpeedText = document.getElementById('wind-speed-text');
    this.windBarFill = document.getElementById('wind-bar-fill');
    this.testStatusBanner = document.getElementById('test-status-banner');
    this.testStatusText = document.getElementById('test-status-text');
    this.testTimer = document.getElementById('test-timer');

    // Modals
    this.modalBriefing = document.getElementById('modal-briefing');
    this.modalFailure = document.getElementById('modal-failure');
    this.modalSuccess = document.getElementById('modal-success');
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

    this.initEventListeners();
  }

  initEventListeners() {
    // Tool Selection
    this.toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        this.selectTool(tool);
        soundEngine.playClick();
      });
    });

    // Test Button
    this.btnTest.addEventListener('click', () => {
      soundEngine.playClick();
      if (this.sm.state === 'BUILD') {
        this.sm.startTest();
      } else if (this.sm.state === 'TESTING') {
        this.sm.stopTest('EDIT');
      }
    });

    // Undo & Reset
    this.btnUndo.addEventListener('click', () => {
      if (this.sm.state === 'BUILD') {
        this.sm.editor.undo();
      }
    });

    this.btnReset.addEventListener('click', () => {
      soundEngine.playClick();
      if (this.sm.state === 'BUILD') {
        this.sm.editor.resetStructure();
      }
    });

    this.btnAutoSolve = document.getElementById('btn-auto-solve');
    this.btnAutoSolve.addEventListener('click', () => {
      soundEngine.playClick();
      if (this.sm.state === 'BUILD') {
        this.sm.editor.autoSolve(this.sm.currentMission.solution);
      }
    });

    // Audio toggle
    this.btnAudioToggle.addEventListener('click', () => {
      const enabled = soundEngine.toggle();
      this.btnAudioToggle.textContent = enabled ? '🔊' : '🔇';
    });

    // Help / Briefing button
    this.btnHelp.addEventListener('click', () => {
      soundEngine.playClick();
      this.showBriefingModal();
    });

    // Modal Action Buttons
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
      this.hideAllModals();
      this.sm.nextMission();
    });

    document.getElementById('btn-restart-game').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideAllModals();
      this.sm.startCampaign();
    });

    // Keyboard Shortcuts [1, 2, 3, 4, Space, Z, R]
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

    if (mission.windStrength > 0) {
      this.windIndicator.classList.remove('hidden');
      this.windSpeedText.textContent = `WIND: ${mission.windStrength} KM/H`;
      this.windBarFill.style.width = `${Math.min(100, mission.windStrength * 2)}%`;
    } else {
      this.windIndicator.classList.add('hidden');
    }
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
      this.failCauseTitle.textContent = `${failedInfo.materialName} Failed Under Stress`;
      this.failCauseDesc.textContent = `Beam experienced ${failedInfo.cause.toLowerCase()} at ${failedInfo.stressVal}% of its material breaking limit, triggering structural collapse.`;
    } else {
      this.failCauseTitle.textContent = 'Structure Collapsed Into Ravine';
      this.failCauseDesc.textContent = 'The bridge could not withstand structural loads and dropped below safety height.';
    }

    // Dynamic engineering advice
    if (failedInfo && failedInfo.cause.includes('Compression')) {
      this.failAdviceText.textContent = 'Compression failure! Add triangular cross-bracing to distribute weight or upgrade high-compression members to Steel.';
    } else if (failedInfo && failedInfo.cause.includes('Tension')) {
      this.failAdviceText.textContent = 'Tension snap! Anchor upper tension chords with Steel beams or shorten beam spans.';
    } else {
      this.failAdviceText.textContent = 'Add diagonal support beams from bottom cliff anchors up to the center of the deck.';
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

  showVictoryModal() {
    this.hideAllModals();
    soundEngine.playSuccess();
    this.modalVictory.classList.remove('hidden');
  }

  hideAllModals() {
    this.modalBriefing.classList.add('hidden');
    this.modalFailure.classList.add('hidden');
    this.modalSuccess.classList.add('hidden');
    this.modalVictory.classList.add('hidden');
  }
}
