/* ==========================================================================
   AFTER THE COLLAPSE — Expanded 2D Structural Physics Engine
   Integrated relaxation solver, fire degradation, earthquake tremors,
   and Structural Integrity calculation.
   ========================================================================== */

import { MATERIAL_SPECS } from '../game/missions.js';

export class PhysicsEngine {
  constructor() {
    this.nodes = [];
    this.beams = [];
    this.gravity = 350; // px/s^2
    this.subSteps = 16;
    this.damping = 0.98;
    this.failedBeamInfo = null;
    this.failedBeamObject = null; // Pointer to broken beam for canvas highlighting
    this.isSimulating = false;

    // Callbacks
    this.onBeamBreak = null;
    this.onCollapse = null;
  }

  reset() {
    this.nodes = [];
    this.beams = [];
    this.failedBeamInfo = null;
    this.failedBeamObject = null;
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
      stress: 0,
      stressType: 'normal',
      broken: false,
      inFire: false
    };

    nodeA.connectedBeams.add(beam.id);
    nodeB.connectedBeams.add(beam.id);
    this.beams.push(beam);
    return beam;
  }

  removeNode(node) {
    const beamsToRemove = this.beams.filter(b => b.nodeA === node || b.nodeB === node);
    beamsToRemove.forEach(b => this.removeBeam(b));
    const idx = this.nodes.indexOf(node);
    if (idx !== -1) this.nodes.splice(idx, 1);
  }

  removeBeam(beam) {
    if (beam.nodeA) beam.nodeA.connectedBeams.delete(beam.id);
    if (beam.nodeB) beam.nodeB.connectedBeams.delete(beam.id);
    const idx = this.beams.indexOf(beam);
    if (idx !== -1) this.beams.splice(idx, 1);
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

  updateNodeMasses() {
    for (const node of this.nodes) node.mass = 1.0;
    for (const beam of this.beams) {
      if (beam.broken) continue;
      const beamMass = beam.restLength * 0.01 * beam.material.weight;
      beam.nodeA.mass += beamMass * 0.5;
      beam.nodeB.mass += beamMass * 0.5;
    }
  }

  // Calculate overall Structural Integrity percentage [0% - 100%]
  getStructuralIntegrity() {
    if (this.beams.length === 0) return 100;

    let unbrokenCount = 0;
    let totalStressSum = 0;

    for (const b of this.beams) {
      if (b.broken) continue;
      unbrokenCount++;
      totalStressSum += Math.min(1.0, b.stress);
    }

    if (this.beams.length === 0 || unbrokenCount === 0) return 0;

    const brokenRatio = unbrokenCount / this.beams.length;
    const avgStress = totalStressSum / unbrokenCount;
    const health = Math.max(0, Math.min(100, Math.round((brokenRatio * (1.0 - avgStress * 0.6)) * 100)));
    return health;
  }

  // Main simulation update loop
  update(dt, windStrength = 0, crateLoad = null, missionObj = null, simTime = 0) {
    if (!this.isSimulating) return;

    this.updateNodeMasses();

    // 0. Handle Earthquake Tremor (oscillation of anchors)
    if (missionObj && missionObj.hasEarthquake) {
      const quakeOffset = Math.sin(simTime * 15) * 4.5;
      for (const node of this.nodes) {
        if (node.fixed) {
          node.x = node.anchorX + quakeOffset;
        }
      }
    }

    const dtSub = dt / this.subSteps;

    for (let step = 0; step < this.subSteps; step++) {
      // 1. Force accumulation
      for (const node of this.nodes) {
        if (node.fixed) continue;
        node.fx = 0;
        node.fy = node.mass * this.gravity;

        if (windStrength !== 0) {
          const gust = 1.0 + Math.sin(simTime * 5 + node.x * 0.01) * 0.35;
          node.fx += windStrength * 2.5 * gust;
        }
      }

      if (crateLoad && crateLoad.active) {
        crateLoad.applyForceToDeck(this.nodes);
      }

      // 2. Integration step
      for (const node of this.nodes) {
        if (node.fixed) continue;

        const ax = node.fx / node.mass;
        const ay = node.fy / node.mass;

        node.vx = (node.vx + ax * dtSub) * this.damping;
        node.vy = (node.vy + ay * dtSub) * this.damping;

        node.x += node.vx * dtSub;
        node.y += node.vy * dtSub;
      }

      // 3. Relaxation solver with Fire Degradation
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

        // Check if beam is inside Fire Zone
        let effectiveMaxStrength = beam.material.maxStrength;
        if (missionObj && missionObj.hasFireZone && missionObj.fireZone) {
          const fz = missionObj.fireZone;
          const midX = (nodeA.x + nodeB.x) / 2;
          const midY = (nodeA.y + nodeB.y) / 2;
          if (midX >= fz.x1 && midX <= fz.x2 && midY >= fz.y1 && midY <= fz.y2) {
            beam.inFire = true;
            effectiveMaxStrength *= fz.fireModifier; // Reduce strength in fire!
          } else {
            beam.inFire = false;
          }
        }

        const stressLevel = strain / effectiveMaxStrength;
        beam.stress = stressLevel;
        beam.stressType = currentDist < beam.restLength ? 'compression' : 'tension';

        // Check beam snapping
        if (stressLevel > 1.0 && this.isSimulating) {
          beam.broken = true;
          if (!this.failedBeamInfo) {
            this.failedBeamObject = beam;
            this.failedBeamInfo = {
              beamId: beam.id,
              materialName: beam.material.name,
              cause: beam.inFire ? 'Fire Degradation & Compression' :
                     (beam.stressType === 'compression' ? 'Excessive Compression' : 'Excessive Tension'),
              stressVal: Math.round(stressLevel * 100),
              strengthVal: Math.round(effectiveMaxStrength * 100)
            };
          }
          if (this.onBeamBreak) this.onBeamBreak(beam);
          continue;
        }

        // Distance correction
        const diff = (currentDist - beam.restLength) / currentDist;
        const correctionX = dx * diff * 0.5;
        const correctionY = dy * diff * 0.5;

        if (!nodeA.fixed && !nodeB.fixed) {
          nodeA.x += correctionX; nodeA.y += correctionY;
          nodeB.x -= correctionX; nodeB.y -= correctionY;
        } else if (!nodeA.fixed && nodeB.fixed) {
          nodeA.x += correctionX * 2; nodeA.y += correctionY * 2;
        } else if (nodeA.fixed && !nodeB.fixed) {
          nodeB.x -= correctionX * 2; nodeB.y -= correctionY * 2;
        }
      }

      // Re-enforce fixed anchors
      for (const node of this.nodes) {
        if (node.fixed && (!missionObj || !missionObj.hasEarthquake)) {
          node.x = node.anchorX;
          node.y = node.anchorY;
        }
      }
    }
  }

  getMaxStress() {
    let max = 0;
    for (const b of this.beams) {
      if (!b.broken && b.stress > max) max = b.stress;
    }
    return max;
  }

  isStructureCollapsed(waterY = 560) {
    for (const node of this.nodes) {
      if (!node.fixed && node.y > waterY - 20) return true;
    }
    return false;
  }
}
