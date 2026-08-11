/* ==========================================================================
   AFTER THE COLLAPSE — Main Entry Point
   Initializes Canvas, Physics Engine, Editor, UI Controller & Ticker Loop.
   ========================================================================== */

import { PhysicsEngine } from './engine/physics.js';
import { Renderer } from './engine/renderer.js';
import { Editor } from './game/editor.js';
import { UIController } from './game/ui.js';
import { StateMachine } from './game/stateMachine.js';

class GameApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.container = document.getElementById('canvas-container');

    this.physics = new PhysicsEngine();
    this.renderer = new Renderer(this.canvas);
    this.editor = new Editor(this.physics, this.renderer);
    this.stateMachine = new StateMachine(this.physics, this.renderer);
    this.ui = new UIController(this.stateMachine);

    this.lastTime = 0;
    this.init();
  }

  init() {
    // 1. Initialize State Machine & Editor
    this.stateMachine.init(this.editor, this.ui);

    // 2. Window Resize Listener
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();

    // 3. Canvas Mouse & Touch Event Handling
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('mouseleave', () => this.onPointerLeave());

    // Touch support for tablets & screens
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) this.onPointerMove(e.touches[0]);
    }, { passive: false });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) this.onPointerDown(e.touches[0]);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.onPointerUp(e.changedTouches[0] || e);
    }, { passive: false });

    // 4. Start Animation Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  handleResize() {
    const rect = this.container.getBoundingClientRect();
    this.renderer.resize(rect.width, rect.height);
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  onPointerMove(e) {
    if (this.stateMachine.state !== 'BUILD') return;
    const coords = this.getCanvasCoords(e);
    this.editor.handleMouseMove(coords.x, coords.y);
  }

  onPointerDown(e) {
    if (this.stateMachine.state !== 'BUILD') return;
    const coords = this.getCanvasCoords(e);
    this.editor.handleMouseDown(coords.x, coords.y);
  }

  onPointerUp(e) {
    if (this.stateMachine.state !== 'BUILD') return;
    const coords = this.getCanvasCoords(e);
    this.editor.handleMouseUp(coords.x, coords.y);
  }

  onPointerLeave() {
    if (this.stateMachine.state !== 'BUILD') return;
    this.editor.isDraggingBeam = false;
    this.editor.startNode = null;
  }

  loop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000); // cap max frame delta
    this.lastTime = currentTime;

    const width = this.canvas.width / this.renderer.dpr;
    const height = this.canvas.height / this.renderer.dpr;

    // 1. Update Game Logic & Physics
    this.stateMachine.update(dt, currentTime);

    // 2. Render Frame
    this.renderer.clear(width, height);
    this.stateMachine.draw(width, height, currentTime);

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Boot application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
