/* ==========================================================================
   AFTER THE COLLAPSE — Dynamic Loads, Environmental Hazards & Debris Engine
   ========================================================================== */

export class SupplyCrate {
  constructor(startCliffX, endCliffX, deckY, weight = 4.5, speed = 45) {
    this.startX = startCliffX;
    this.endX = endCliffX;
    this.deckY = deckY;
    this.x = startCliffX;
    this.y = deckY - 14;
    this.vy = 0;
    this.weight = weight;
    this.speed = speed;
    this.active = false;
    this.state = 'idle'; // 'idle', 'moving', 'goal', 'falling'
    this.width = 28;
    this.height = 20;
  }

  reset() {
    this.x = this.startX;
    this.y = this.deckY - 14;
    this.vy = 0;
    this.active = false;
    this.state = 'idle';
  }

  start() {
    this.reset();
    this.active = true;
    this.state = 'moving';
  }

  update(dt, nodes, beams, waterY = 560) {
    if (!this.active) return;

    if (this.state === 'moving') {
      this.x += this.speed * dt;

      // Reached goal cliff
      if (this.x >= this.endX) {
        this.x = this.endX;
        this.state = 'goal';
        return;
      }

      // Find nearest deck beam or node underneath crate
      let supported = false;
      let targetY = this.deckY - 14;

      for (const beam of beams) {
        if (beam.broken) continue;
        const p1 = beam.nodeA;
        const p2 = beam.nodeB;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);

        if (this.x >= minX - 5 && this.x <= maxX + 5) {
          const t = (this.x - minX) / (maxX - minX || 1);
          const beamY = p1.x < p2.x ? p1.y + t * (p2.y - p1.y) : p2.y + t * (p1.y - p2.y);
          targetY = beamY - 14;
          supported = true;
          break;
        }
      }

      if (supported) {
        this.y += (targetY - this.y) * 0.3;
      } else {
        this.state = 'falling';
      }
    } else if (this.state === 'falling') {
      this.vy += 400 * dt;
      this.y += this.vy * dt;
      this.x += this.speed * 0.3 * dt;

      if (this.y > waterY) {
        this.active = false;
      }
    }
  }

  applyForceToDeck(nodes) {
    if (this.state !== 'moving') return;

    for (const node of nodes) {
      if (node.fixed) continue;
      const dx = Math.abs(node.x - this.x);
      if (dx < 60) {
        const factor = 1.0 - (dx / 60);
        node.fy += this.weight * 120 * factor;
      }
    }
  }
}

// FALLING DEBRIS MANAGER
export class FallingDebrisManager {
  constructor() {
    this.items = [];
    this.timer = 0;
  }

  reset() {
    this.items = [];
    this.timer = 0;
  }

  update(dt, interval, nodes, beams, particles) {
    this.timer += dt;
    if (this.timer >= interval) {
      this.timer = 0;
      // Spawn new falling debris block from top
      const spawnX = 220 + Math.random() * 400;
      this.items.push({
        x: spawnX,
        y: -30,
        width: 18,
        height: 18,
        vy: 180 + Math.random() * 80,
        impacted: false
      });
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const d = this.items[i];
      d.y += d.vy * dt;

      // Check collision with nodes and beams
      if (!d.impacted) {
        for (const node of nodes) {
          if (node.fixed) continue;
          const dx = node.x - d.x;
          const dy = node.y - d.y;
          if (Math.sqrt(dx * dx + dy * dy) < 22) {
            // Strike node! Apply downward impact impulse
            node.vy += 160;
            d.impacted = true;
            if (particles) particles.createSparks(d.x, d.y, '#f97316', 12);
            break;
          }
        }
      }

      if (d.y > 600 || d.impacted) {
        this.items.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const d of this.items) {
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.fillRect(d.x - d.width / 2, d.y - d.height / 2, d.width, d.height);
      ctx.strokeRect(d.x - d.width / 2, d.y - d.height / 2, d.width, d.height);
    }
    ctx.restore();
  }
}

// PARTICLE SYSTEM
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  reset() {
    this.particles = [];
  }

  createSparks(x, y, color = '#f59e0b', count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        radius: 1.5 + Math.random() * 2,
        life: 1.0,
        decay: 1.5 + Math.random() * 2.0
      });
    }
  }

  createWindParticles(width, height, count = 25) {
    if (this.particles.filter(p => p.isWind).length < count) {
      this.particles.push({
        x: -20,
        y: Math.random() * (height - 100),
        vx: 200 + Math.random() * 150,
        vy: (Math.random() - 0.5) * 20,
        color: 'rgba(6, 182, 212, 0.4)',
        radius: 1.2,
        length: 20 + Math.random() * 30,
        life: 1.0,
        decay: 0.3,
        isWind: true
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;

      if (!p.isWind) {
        p.vy += 200 * dt;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.isWind) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.length, p.y);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
