/* ==========================================================================
   AFTER THE COLLAPSE — Construction & Editor Controller
   Handles node/beam placement, snapping, deletion, undo stack, and material budget.
   ========================================================================== */

import { MATERIAL_SPECS } from './missions.js';
import { soundEngine } from './audio.js';

export class Editor {
  constructor(physics, renderer) {
    this.physics = physics;
    this.renderer = renderer;

    this.activeTool = 'node'; // 'node', 'wood', 'steel', 'delete'
    this.budget = { wood: 15, steel: 5 };
    this.initialBudget = { wood: 15, steel: 5 };
    this.usedBudget = { wood: 0, steel: 0 };

    this.startNode = null;
    this.hoverNode = null;
    this.hoverBeam = null;
    this.mousePos = { x: 0, y: 0 };
    this.snapPos = { x: 0, y: 0 };
    this.isDraggingBeam = false;

    this.undoStack = [];
    this.onBudgetChange = null;
  }

  setMission(mission) {
    this.budget = { ...mission.budget };
    this.initialBudget = { ...mission.budget };
    this.usedBudget = { wood: 0, steel: 0 };
    this.undoStack = [];
    this.startNode = null;
    this.isDraggingBeam = false;
    this.updateBudgetUI();
  }

  setTool(toolName) {
    this.activeTool = toolName;
    this.startNode = null;
    this.isDraggingBeam = false;
  }

  getSnapPosition(x, y) {
    const grid = this.renderer.gridSize;
    const snapX = Math.round(x / grid) * grid;
    const snapY = Math.round(y / grid) * grid;
    return { x: snapX, y: snapY };
  }

  handleMouseMove(x, y) {
    this.mousePos = { x, y };

    // Check if hovering near an existing node
    this.hoverNode = this.physics.findNodeNear(x, y, 18);

    if (this.hoverNode) {
      this.snapPos = { x: this.hoverNode.x, y: this.hoverNode.y };
      this.hoverBeam = null;
    } else {
      this.snapPos = this.getSnapPosition(x, y);
      this.hoverBeam = this.physics.findBeamNear(x, y, 12);
    }
  }

  handleMouseDown(x, y) {
    this.handleMouseMove(x, y);

    if (this.activeTool === 'node') {
      if (!this.hoverNode) {
        const newNode = this.physics.addNode(this.snapPos.x, this.snapPos.y, false, false);
        this.undoStack.push({ type: 'addNode', node: newNode });
        soundEngine.playNodePlace();
      }
    } else if (this.activeTool === 'wood' || this.activeTool === 'steel') {
      // Start drag beam creation
      let fromNode = this.hoverNode;
      let createdStartNode = false;

      if (!fromNode) {
        // Create new node at snap position
        fromNode = this.physics.addNode(this.snapPos.x, this.snapPos.y, false, false);
        createdStartNode = true;
      }

      this.startNode = fromNode;
      this.isDraggingBeam = true;
      if (createdStartNode) {
        this.undoStack.push({ type: 'addNode', node: fromNode });
      }
    } else if (this.activeTool === 'delete') {
      if (this.hoverNode && !this.hoverNode.isAnchor) {
        this.deleteNode(this.hoverNode);
        soundEngine.playDelete();
      } else if (this.hoverBeam) {
        this.deleteBeam(this.hoverBeam);
        soundEngine.playDelete();
      }
    }
  }

  handleMouseUp(x, y) {
    if (!this.isDraggingBeam || !this.startNode) {
      this.isDraggingBeam = false;
      this.startNode = null;
      return;
    }

    this.handleMouseMove(x, y);

    let toNode = this.hoverNode;
    let createdEndNode = false;

    if (!toNode) {
      toNode = this.physics.addNode(this.snapPos.x, this.snapPos.y, false, false);
      createdEndNode = true;
    }

    if (toNode !== this.startNode) {
      const matKey = this.activeTool;
      const mat = MATERIAL_SPECS[matKey];

      const dx = toNode.x - this.startNode.x;
      const dy = toNode.y - this.startNode.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      // Check constraints: max length & material budget
      if (len <= mat.maxLength && this.budget[matKey] > 0) {
        const beam = this.physics.addBeam(this.startNode, toNode, matKey);
        if (beam) {
          this.budget[matKey]--;
          this.usedBudget[matKey]++;
          this.undoStack.push({
            type: 'addBeam',
            beam: beam,
            materialKey: matKey,
            createdEndNode: createdEndNode ? toNode : null
          });
          soundEngine.playBeamPlace(matKey === 'steel');
          this.updateBudgetUI();
        } else if (createdEndNode) {
          // Cleanup unused node
          this.physics.removeNode(toNode);
        }
      } else if (createdEndNode) {
        // Exceeds max length or budget, remove temporary end node
        this.physics.removeNode(toNode);
      }
    } else if (createdEndNode) {
      this.physics.removeNode(toNode);
    }

    this.isDraggingBeam = false;
    this.startNode = null;
  }

  deleteNode(node) {
    if (node.isAnchor) return;

    const connectedBeams = this.physics.beams.filter(b => b.nodeA === node || b.nodeB === node);
    connectedBeams.forEach(b => this.refundBeam(b));

    this.undoStack.push({ type: 'deleteNode', node: node, connectedBeams: connectedBeams });
    this.physics.removeNode(node);
    this.updateBudgetUI();
  }

  deleteBeam(beam) {
    this.refundBeam(beam);
    this.undoStack.push({ type: 'deleteBeam', beam: beam });
    this.physics.removeBeam(beam);
    this.updateBudgetUI();
  }

  refundBeam(beam) {
    const matKey = beam.materialKey;
    if (matKey && this.usedBudget[matKey] > 0) {
      this.budget[matKey]++;
      this.usedBudget[matKey]--;
    }
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const last = this.undoStack.pop();

    if (last.type === 'addNode') {
      this.physics.removeNode(last.node);
    } else if (last.type === 'addBeam') {
      this.refundBeam(last.beam);
      this.physics.removeBeam(last.beam);
      if (last.createdEndNode) {
        this.physics.removeNode(last.createdEndNode);
      }
    }
    soundEngine.playDelete();
    this.updateBudgetUI();
  }

  resetStructure() {
    // Keep only mission anchors, delete all user structures
    const userNodes = this.physics.nodes.filter(n => !n.isAnchor);
    userNodes.forEach(n => this.physics.removeNode(n));

    this.physics.beams = [];
    this.budget = { ...this.initialBudget };
    this.usedBudget = { wood: 0, steel: 0 };
    this.undoStack = [];
    this.startNode = null;
    this.isDraggingBeam = false;
    this.updateBudgetUI();
  }

  autoSolve(solution) {
    if (!solution) return;
    this.resetStructure();

    const nodeMap = new Map();
    // Map mission anchor nodes
    this.physics.nodes.forEach(n => {
      if (n.isAnchor) {
        nodeMap.set(n.id, n);
      }
    });

    // Add solution nodes
    solution.nodes.forEach(sn => {
      const node = this.physics.addNode(sn.x, sn.y, false, false, sn.id);
      nodeMap.set(sn.id, node);
    });

    // Add solution beams
    solution.beams.forEach(sb => {
      const nodeA = nodeMap.get(sb.from);
      const nodeB = nodeMap.get(sb.to);
      const matKey = sb.mat || 'wood';

      if (nodeA && nodeB && this.budget[matKey] > 0) {
        const beam = this.physics.addBeam(nodeA, nodeB, matKey);
        if (beam) {
          this.budget[matKey]--;
          this.usedBudget[matKey]++;
        }
      }
    });

    soundEngine.playBeamPlace(true);
    this.updateBudgetUI();
  }

  updateBudgetUI() {
    if (this.onBudgetChange) {
      const totalCost = (this.usedBudget.wood * MATERIAL_SPECS.wood.cost) +
                        (this.usedBudget.steel * MATERIAL_SPECS.steel.cost);
      this.onBudgetChange({
        wood: this.budget.wood,
        steel: this.budget.steel,
        totalCost: totalCost
      });
    }
  }

  drawPreview() {
    if (!this.isDraggingBeam || !this.startNode) return;

    const matKey = this.activeTool;
    const mat = MATERIAL_SPECS[matKey];
    const dx = this.snapPos.x - this.startNode.x;
    const dy = this.snapPos.y - this.startNode.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    const isValid = len <= mat.maxLength && this.budget[matKey] > 0 && len > 5;
    this.renderer.drawBuildPreview(this.startNode, this.snapPos, matKey, isValid, len);
  }
}
