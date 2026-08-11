/* ==========================================================================
   AFTER THE COLLAPSE — 2D Structural Physics Engine
   Uses Verlet integration with distance constraint relaxation and
   material stress/strain limit detection.
   ========================================================================== */

import { MATERIAL_SPECS } from '../game/missions.js';

export class PhysicsEngine {
  constructor() {
    this.nodes = [];
    this.beams = [];
    this.gravity = 350; // px/s^2
    this.subSteps = 16;  // Constraint solver iterations per frame
    this.damping = 0.98; // Motion damping
    this.failedBeamInfo = null;
    this.isSimulating = false;

    // Callbacks
    this.onBeamBreak = null;
    this.onCollapse = null;
  }

  reset() {
    this.nodes = [];
    this.beams = [];
    this.failedBeamInfo = null;
    this.isSimulating = false;
  }

  addNode(x, y, fixed = false, isAnchor = false, id = null) {
    const node = {
      id: id || 'node_' + Math.random().toString(36).substr(2, 9),
      x: x,
      y: y,
      px: x,
      py: y,
      anchorX: x,
      anchorY: y,
      vx: 0,
      vy: 0,
      fx: 0,
      fy: 0,
      mass: 1.0,
      fixed: fixed,
      isAnchor: isAnchor,
      connectedBeams: new Set()
    };
    this.nodes.push(node);
    return node;
  }

  addBeam(nodeA, nodeB, materialKey = 'wood') {
    // Check if beam already exists between these nodes
    const existing = this.beams.find(b =>
      !b.broken &&
      ((b.nodeA === nodeA && b.nodeB === nodeB) || (b.nodeA === nodeB && b.nodeB === nodeA))
    );
    if (existing) return null;

    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const restLength = Math.sqrt(dx * dx + dy * dy);
    const mat = MATERIAL_SPECS[materialKey];

    const beam = {
      id: 'beam_' + Math.random().toString(36).substr(2, 9),
      nodeA: nodeA,
      nodeB: nodeB,
      materialKey: materialKey,
      material: mat,
      restLength: restLength,
      currentLength: restLength,
      stress: 0, // 0.0 to 1.0+
      stressType: 'normal', // 'compression' or 'tension'
      broken: false,
      breakProgress: 0 // for break animation spark
    };

    nodeA.connectedBeams.add(beam.id);
    nodeB.connectedBeams.add(beam.id);
    this.beams.push(beam);
    return beam;
  }

  removeNode(node) {
    // Remove all connected beams
    const beamsToRemove = this.beams.filter(b => b.nodeA === node || b.nodeB === node);
    beamsToRemove.forEach(b => this.removeBeam(b));

    const idx = this.nodes.indexOf(node);
    if (idx !== -1) {
      this.nodes.splice(idx, 1);
    }
  }

  removeBeam(beam) {
    if (beam.nodeA) beam.nodeA.connectedBeams.delete(beam.id);
    if (beam.nodeB) beam.nodeB.connectedBeams.delete(beam.id);
    const idx = this.beams.indexOf(beam);
    if (idx !== -1) {
      this.beams.splice(idx, 1);
    }
  }

  findNodeNear(x, y, radius = 20) {
    let closestNode = null;
    let minDistSq = radius * radius;
    for (const node of this.nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestNode = node;
      }
    }
    return closestNode;
  }

  findBeamNear(x, y, maxDist = 15) {
    let closestBeam = null;
    let minDistSq = maxDist * maxDist;

    for (const beam of this.beams) {
      if (beam.broken) continue;
      const p1 = beam.nodeA;
      const p2 = beam.nodeB;

      // Distance from point (x,y) to line segment p1-p2
      const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
      if (l2 === 0) continue;

      let t = ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / l2;
      t = Math.max(0, Math.min(1, t));

      const projX = p1.x + t * (p2.x - p1.x);
      const projY = p1.y + t * (p2.y - p1.y);

      const distSq = (x - projX) ** 2 + (y - projY) ** 2;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestBeam = beam;
      }
    }
    return closestBeam;
  }

  // Pre-calculate node masses based on connected beam materials & load
  updateNodeMasses() {
    for (const node of this.nodes) {
      node.mass = 1.0; // Base node mass
    }
    for (const beam of this.beams) {
      if (beam.broken) continue;
      const beamMass = beam.restLength * 0.01 * beam.material.weight;
      beam.nodeA.mass += beamMass * 0.5;
      beam.nodeB.mass += beamMass * 0.5;
    }
  }

  // Primary physics simulation step
  update(dt, windStrength = 0, crateLoad = null) {
    if (!this.isSimulating) return;

    this.updateNodeMasses();

    const dtSub = dt / this.subSteps;

    for (let step = 0; step < this.subSteps; step++) {
      // 1. Reset forces & apply gravity + wind
      for (const node of this.nodes) {
        if (node.fixed) continue;
        node.fx = 0;
        node.fy = node.mass * this.gravity;

        // Apply wind force
        if (windStrength !== 0) {
          const gust = 1.0 + Math.sin(Date.now() * 0.005 + node.x * 0.01) * 0.3;
          node.fx += windStrength * 2.5 * gust;
        }
      }

      // Apply crate load weight to deck nodes if crate is active
      if (crateLoad && crateLoad.active) {
        crateLoad.applyForceToDeck(this.nodes, this.beams);
      }

      // 2. Verlet integration step
      for (const node of this.nodes) {
        if (node.fixed) {
          node.x = node.anchorX;
          node.y = node.anchorY;
          node.vx = 0;
          node.vy = 0;
          continue;
        }

        const ax = node.fx / node.mass;
        const ay = node.fy / node.mass;

        // Velocity Verlet
        node.vx = (node.vx + ax * dtSub) * this.damping;
        node.vy = (node.vy + ay * dtSub) * this.damping;

        node.x += node.vx * dtSub;
        node.y += node.vy * dtSub;
      }

      // 3. Distance constraint relaxation pass
      for (const beam of this.beams) {
        if (beam.broken) continue;

        const nodeA = beam.nodeA;
        const nodeB = beam.nodeB;

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const currentDist = Math.sqrt(dx * dx + dy * dy);

        if (currentDist === 0) continue;

        beam.currentLength = currentDist;
        const strain = Math.abs(currentDist - beam.restLength) / beam.restLength;
        const stressLevel = strain / beam.material.maxStrength;

        beam.stress = stressLevel;
        beam.stressType = currentDist < beam.restLength ? 'compression' : 'tension';

        // Check structural failure limit
        if (stressLevel > 1.0 && this.isSimulating) {
          beam.broken = true;
          if (!this.failedBeamInfo) {
            this.failedBeamInfo = {
              beamId: beam.id,
              materialName: beam.material.name,
              cause: beam.stressType === 'compression' ? 'Excessive Compression' : 'Excessive Tension',
              stressVal: Math.round(stressLevel * 100)
            };
          }
          if (this.onBeamBreak) {
            this.onBeamBreak(beam);
          }
          continue;
        }

        // Constraint distance correction
        const diff = (currentDist - beam.restLength) / currentDist;
        const correctionX = dx * diff * 0.5;
        const correctionY = dy * diff * 0.5;

        if (!nodeA.fixed && !nodeB.fixed) {
          nodeA.x += correctionX;
          nodeA.y += correctionY;
          nodeB.x -= correctionX;
          nodeB.y -= correctionY;
        } else if (!nodeA.fixed && nodeB.fixed) {
          nodeA.x += correctionX * 2;
          nodeA.y += correctionY * 2;
        } else if (nodeA.fixed && !nodeB.fixed) {
          nodeB.x -= correctionX * 2;
          nodeB.y -= correctionY * 2;
        }
      }

      // Re-enforce fixed anchors
      for (const node of this.nodes) {
        if (node.fixed) {
          node.x = node.anchorX;
          node.y = node.anchorY;
        }
      }
    }
  }

  getMaxStress() {
    let max = 0;
    for (const b of this.beams) {
      if (!b.broken && b.stress > max) {
        max = b.stress;
      }
    }
    return max;
  }

  isStructureCollapsed(waterY = 560) {
    // Check if any non-fixed node dropped into abyss or water
    for (const node of this.nodes) {
      if (!node.fixed && node.y > waterY - 20) {
        return true;
      }
    }
    return false;
  }
}
