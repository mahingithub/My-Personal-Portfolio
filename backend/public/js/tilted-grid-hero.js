class TiltedGridHero extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Config
    this.SLICES = 16;
    this.CAMERA = 1.6;
    this.MAX_WIDTH = 55;
    
    this.speed = parseFloat(this.getAttribute('speed') || '4');
    this.tileHeight = parseFloat(this.getAttribute('tile-height') || '26');
    this.aspectRatio = parseFloat(this.getAttribute('aspect-ratio') || (16/9).toString());
    this.gap = parseFloat(this.getAttribute('gap') || '6');
    this.axis = parseFloat(this.getAttribute('axis') || '56');
    this.curve = parseFloat(this.getAttribute('curve') || '80');
    this.fade = parseFloat(this.getAttribute('fade') || '12');
    
    try {
      this.images = JSON.parse(this.getAttribute('images') || '[]');
      if (this.images.length === 0) throw new Error('Empty');
    } catch(e) {
      this.images = [
        { src: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=80', alt: 'Design' },
        { src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80', alt: 'Work' },
        { src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80', alt: 'Code' },
        { src: 'https://images.unsplash.com/photo-1555421689-d68471e189f2?w=800&q=80', alt: 'Software' },
        { src: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80', alt: 'Creative' },
        { src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', alt: 'Computer' },
        { src: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=800&q=80', alt: 'Design' },
        { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', alt: 'Data' }
      ];
    }

    this.shown = {};
    this.layout = null;
    
    this.renderContainer();
  }
  
  arc(bend) {
    return (this.CAMERA - 1 + Math.cos(bend)) / (2 * this.CAMERA * Math.sin(bend));
  }
  
  measure(width, height, tile, aspect, gap, bend) {
    const h = Math.min((tile / 100) * height, ((this.MAX_WIDTH / 100) * width) / aspect);
    const radius = width * this.arc(bend);
    if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0 };
    
    const deg = rad => (rad * 180) / Math.PI;
    const unit = deg(h / radius);
    const pitch = (aspect + gap / 100) * unit;
    const limit = deg(bend) + (aspect * unit) / 2;
    const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)));
    const round = n => +n.toFixed(4);
    const sweep = round((columns * pitch) / 2);
    
    return { columns, sweep, unit: round(unit), limit: round(Math.min(sweep, limit)) };
  }

  connectedCallback() {
    this.ro = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const bend = (Math.min(85, Math.max(5, this.curve)) * Math.PI) / 180;
        const next = this.measure(width, height, this.tileHeight, this.aspectRatio, this.gap, bend);
        
        if (!this.layout || this.layout.columns !== next.columns || this.layout.sweep !== next.sweep || this.layout.unit !== next.unit) {
          this.layout = next;
          this.updateRender();
        }
      }
    });
    this.ro.observe(this);
    
    // Preload images
    this.images.forEach(img => {
      if (img.src) new Image().src = img.src;
    });
  }

  disconnectedCallback() {
    if (this.ro) this.ro.disconnect();
  }

  renderContainer() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          overflow: hidden;
          container-type: size;
          width: 100%;
          height: 100%;
          background: transparent;
        }
        #mask {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transition: opacity 0.5s;
          opacity: 0;
        }
        .tile {
          position: absolute;
          transform-style: preserve-3d;
        }
        .slice {
          position: absolute;
          top: 0;
          overflow: hidden;
          background: var(--bg-muted, #1a1a1a);
        }
        .slice-first { border-top-left-radius: 0.75rem; border-bottom-left-radius: 0.75rem; }
        .slice-last { border-top-right-radius: 0.75rem; border-bottom-right-radius: 0.75rem; }
        .slice img {
          position: absolute;
          top: 0;
          max-width: none;
          object-fit: cover;
        }

        
      </style>
      <div id="dynamic-style"></div>
      <div id="mask" aria-hidden="true"></div>
      <slot></slot>
    `;
  }

  updateRender() {
    if (!this.layout) return;
    
    const bend = (Math.min(85, Math.max(5, this.curve)) * Math.PI) / 180;
    const { columns, sweep, unit, limit } = this.layout;
    
    const u = n => `calc(${+n.toFixed(4)} * min(${this.tileHeight}cqh, ${+(this.MAX_WIDTH / this.aspectRatio).toFixed(4)}cqw))`;
    const r = 100 * this.arc(bend);
    const radius = `${+r.toFixed(3)}cqw`;
    const turn = deg => `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`;
    
    const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
    const orbit = 'orbit-' + Math.random().toString(36).substr(2, 9);
    
    const css = `
      @keyframes ${orbit} {
        from { transform: ${turn(-sweep)} }
        to { transform: ${turn(sweep)} }
        0%, ${hide}%, ${100 - hide}%, 100% { visibility: hidden }
        ${hide + 0.001}%, ${100 - hide - 0.001}% { visibility: visible }
      }
      @media (prefers-reduced-motion: reduce) {
        .tile { animation-play-state: paused; }
      }
    `;
    
    this.shadowRoot.getElementById('dynamic-style').innerHTML = `<style>${css}</style>`;
    
    const mask = this.shadowRoot.getElementById('mask');
    const maskGrad = `linear-gradient(90deg, transparent, #000 ${this.fade}%, #000 ${100 - this.fade}%, transparent)`;
    
    mask.style.opacity = 1;
    mask.style.perspective = `${+(r * this.CAMERA).toFixed(3)}cqw`;
    mask.style.perspectiveOrigin = `50% ${this.axis}%`;
    mask.style.maskImage = maskGrad;
    mask.style.webkitMaskImage = maskGrad;
    
    const duration = columns * this.speed;
    const share = this.aspectRatio / this.SLICES;
    
    let html = '';
    
    for (let t = 0; t < columns; t++) {
      const first = columns - 1 - t;
      const imgIdx = (this.shown[t] ?? first) % Math.max(this.images.length, 1);
      const img = this.images[imgIdx];
      
      const left = `calc(50% - ${u(this.aspectRatio / 2)})`;
      const top = `calc(${this.axis}% - ${u(0.5)})`;
      const width = u(this.aspectRatio);
      const height = u(1);
      const anim = `${orbit} ${duration}s linear ${-t * this.speed}s infinite`;
      
      let slicesHtml = '';
      for (let k = 0; k < this.SLICES; k++) {
        const sLeft = u((this.aspectRatio - share) / 2);
        const sWidth = k === this.SLICES - 1 ? u(share) : `calc(${u(share)} + 1px)`;
        const sTransform = turn((this.aspectRatio / 2 - (k + 0.5) * share) * unit);
        const classes = `slice ${k === 0 ? 'slice-first' : ''} ${k === this.SLICES - 1 ? 'slice-last' : ''}`;
        
        let imgHtml = '';
        if (img) {
          imgHtml = `<img src="${img.src}" alt="${k === 0 ? (img.alt || '') : ''}" draggable="false" style="left: ${u(-k * share)}; width: ${u(this.aspectRatio)}; height: ${u(1)};">`;
        }
        
        slicesHtml += `
          <div class="${classes}" style="left: ${sLeft}; width: ${sWidth}; height: ${height}; transform: ${sTransform}">
            ${imgHtml}
          </div>
        `;
      }
      
      html += `
        <div class="tile" data-t="${t}" data-first="${first}" style="left: ${left}; top: ${top}; width: ${width}; height: ${height}; animation: ${anim};">
          ${slicesHtml}
        </div>
      `;
    }
    
    mask.innerHTML = html;
    
    // Add animation iteration listeners
    const tiles = mask.querySelectorAll('.tile');
    tiles.forEach(tileEl => {
      tileEl.addEventListener('animationiteration', e => {
        const t = parseInt(tileEl.getAttribute('data-t'));
        const first = parseInt(tileEl.getAttribute('data-first'));
        const lap = Math.round(e.elapsedTime / duration);
        const next = lap * columns + first;
        if (this.shown[t] !== next) {
          this.shown[t] = next;
          // Ideally we'd only update the images for this tile, but for simplicity
          // in vanilla JS we can just update the src attributes directly
          const newImgIdx = next % Math.max(this.images.length, 1);
          const newImg = this.images[newImgIdx];
          if (newImg) {
            const imgs = tileEl.querySelectorAll('img');
            imgs.forEach(imgEl => {
              imgEl.src = newImg.src;
            });
          }
        }
      });
    });
  }
}

customElements.define('tilted-grid-hero', TiltedGridHero);
