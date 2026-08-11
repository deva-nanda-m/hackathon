/* ==========================================================================
   AFTER THE COLLAPSE — HTML5 Canvas Renderer
   Handles high-DPI canvas rendering, terrain graphics, stress heatmaps,
   construction previews, nodes, beams, and vehicle loads.
   ========================================================================== */

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.gridSize = 25; // Grid spacing in px
    this.showGrid = true;
  }

  resize(width, height) {
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  clear(width, height) {
    this.ctx.clearRect(0, 0, width, height);
  }

  drawTerrain(mission, width, height, time) {
    const ctx = this.ctx;
    const t = mission.terrain;

    // 1. Post-apocalyptic Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0a0e1a');
    skyGrad.addColorStop(0.6, '#111827');
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Distant ruined city silhouette
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, height - 120);
    ctx.lineTo(80, height - 120); ctx.lineTo(80, height - 220); ctx.lineTo(130, height - 220); ctx.lineTo(130, height - 120);
    ctx.lineTo(240, height - 120); ctx.lineTo(240, height - 180); ctx.lineTo(290, height - 180); ctx.lineTo(290, height - 120);
    ctx.lineTo(500, height - 120); ctx.lineTo(500, height - 250); ctx.lineTo(540, height - 250); ctx.lineTo(540, height - 120);
    ctx.lineTo(width, height - 120);
    ctx.lineTo(width, height); ctx.lineTo(0, height);
    ctx.fill();

    // 2. Left Cliff Solid Rock
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, t.deckY);
    ctx.lineTo(t.leftCliffX, t.deckY);
    ctx.lineTo(t.leftCliffX - 25, t.waterY);
    ctx.lineTo(0, t.waterY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left Cliff concrete foundation caps
    ctx.fillStyle = '#334155';
    ctx.fillRect(t.leftCliffX - 60, t.deckY, 60, 20);

    // 3. Right Cliff Solid Rock (if present)
    if (t.rightCliffX < width) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(t.rightCliffX, t.deckY);
      ctx.lineTo(width, t.deckY);
      ctx.lineTo(width, t.waterY);
      ctx.lineTo(t.rightCliffX + 25, t.waterY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Cliff concrete foundation cap
      ctx.fillStyle = '#334155';
      ctx.fillRect(t.rightCliffX, t.deckY, 60, 20);
    }

    // 4. Toxic Water / Deep Ravine Abyss
    const waterGrad = ctx.createLinearGradient(0, t.waterY - 10, 0, height);
    waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
    waterGrad.addColorStop(0.3, '#083344');
    waterGrad.addColorStop(1, '#02131d');
    ctx.fillStyle = waterGrad;

    // Animated water wave
    ctx.beginPath();
    ctx.moveTo(0, t.waterY);
    for (let x = 0; x <= width; x += 20) {
      const waveY = t.waterY + Math.sin(x * 0.02 + time * 0.003) * 4;
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();
  }

  drawGrid(width, height) {
    if (!this.showGrid) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';

    for (let x = 0; x < width; x += this.gridSize) {
      for (let y = 0; y < height; y += this.gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawBeams(beams, isTesting = false) {
    const ctx = this.ctx;

    for (const beam of beams) {
      if (beam.broken) continue;

      const p1 = beam.nodeA;
      const p2 = beam.nodeB;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      // Determine Beam Color & Style
      let strokeColor = beam.material.color;
      let lineWidth = beam.materialKey === 'steel' ? 5 : 4;

      if (isTesting) {
        // Stress Color Map: Green -> Yellow -> Orange -> Red
        const stress = Math.min(1.0, beam.stress || 0);
        if (stress < 0.35) {
          strokeColor = '#22c55e'; // Green
        } else if (stress < 0.65) {
          strokeColor = '#eab308'; // Yellow
        } else if (stress < 0.85) {
          strokeColor = '#f97316'; // Orange
        } else {
          strokeColor = '#ef4444'; // Critical Red
          lineWidth += 2;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
        }
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw rivets / end pins
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 2.5, 0, Math.PI * 2);
      ctx.arc(p2.x, p2.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawNodes(nodes, activeNode = null) {
    const ctx = this.ctx;

    for (const node of nodes) {
      ctx.save();

      if (node.fixed) {
        // Fixed Anchor Pad
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // User Construction Node
        const isHovered = activeNode === node;
        ctx.fillStyle = isHovered ? '#06b6d4' : '#cbd5e1';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;

        if (isHovered) {
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  drawCrate(crate) {
    if (!crate || !crate.active) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(crate.x, crate.y);

    // Crate Body
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.fillRect(-crate.width / 2, -crate.height / 2, crate.width, crate.height);
    ctx.strokeRect(-crate.width / 2, -crate.height / 2, crate.width, crate.height);

    // Emergency Rescue Cross Icon on crate
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-4, -8, 8, 16);
    ctx.fillRect(-8, -4, 16, 8);

    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-8, crate.height / 2, 4, 0, Math.PI * 2);
    ctx.arc(8, crate.height / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawSurvivor(survivorPos, time) {
    if (!survivorPos) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(survivorPos.x, survivorPos.y);

    // Glowing target ring
    const pulse = 10 + Math.sin(time * 0.006) * 4;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, pulse + 10, 0, Math.PI * 2);
    ctx.stroke();

    // Survivor platform ruin
    ctx.fillStyle = '#334155';
    ctx.fillRect(-25, 10, 50, 15);

    // Survivor figure
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -6, 6, 0, Math.PI * 2); // head
    ctx.fill();
    ctx.fillRect(-5, 0, 10, 12); // torso

    // Waving arm icon
    ctx.fillStyle = '#fef08a';
    ctx.font = '16px sans-serif';
    ctx.fillText('🙋‍♂️', -10, -12);

    ctx.restore();
  }

  drawBuildPreview(startNode, currentPos, materialKey, isValid, length) {
    if (!startNode || !currentPos) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startNode.x, startNode.y);
    ctx.lineTo(currentPos.x, currentPos.y);

    ctx.strokeStyle = isValid ? (materialKey === 'wood' ? '#f59e0b' : '#38bdf8') : '#ef4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    // Draw distance text badge
    const midX = (startNode.x + currentPos.x) / 2;
    const midY = (startNode.y + currentPos.y) / 2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(midX - 25, midY - 12, 50, 20);
    ctx.strokeStyle = isValid ? '#06b6d4' : '#ef4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(midX - 25, midY - 12, 50, 20);

    ctx.fillStyle = isValid ? '#f8fafc' : '#fca5a5';
    ctx.font = '11px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(length)}px`, midX, midY);

    ctx.restore();
  }
}
