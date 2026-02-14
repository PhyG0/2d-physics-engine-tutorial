class Screen {
  // Use this class if you want a full-screen canvas that resizes automatically.
  constructor(width = 1920, height = 1080) {
    this.width = width;
    this.height = height;
    this.aspectRatio = width / height;

    this.container = document.createElement('div');
    this.container.className = 'screen-container';
    this._initializeContainer();

    // Create canvas fullscreen
    this._createFullScreen();

    document.body.appendChild(this.container);

    this._setupResponsive();

    this._resize();
    this._applyBodyStyles();
  }

  // Set up the container div to fill the window.
  _initializeContainer() {
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: '#000000',
      overflow: 'hidden',
      display: 'flex',
    });
  }

  _createFullScreen() {
    this.canvasWrapper = document.createElement('div');
    this.canvasWrapper.className = 'canvas-wrapper';

    Object.assign(this.canvasWrapper.style, {
      flex: '1',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111' // Distinct background to see canvas boundaries
    });

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'screen-canvas';
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.border = "1px solid #333"; // Subtle border

    Object.assign(this.canvas.style, {
      display: 'block',
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain', // Keep aspect ratio
      boxShadow: '0 0 20px rgba(0,0,0,0.5)' // Elevation
    });

    this.canvasWrapper.appendChild(this.canvas);
    this.container.appendChild(this.canvasWrapper);
  }

  // Remove default margins and scrollbars from the body.
  _applyBodyStyles() {
    // ... (Previous styling code remains the same)
    Object.assign(document.body.style, {
      margin: '0',
      padding: '0',
      overflow: 'hidden',
      background: '#000000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      touchAction: 'none',
      userSelect: 'none',
      webkitUserSelect: 'none',
    });

    Object.assign(document.documentElement.style, {
      height: '100%',
      backgroundColor: '#000000',
      overflow: 'hidden',
    });

    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(viewport);
    }
  }

  // Listen for window resize events.
  _setupResponsive() {
    let resizeTimeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      // Wait a bit before resizing to avoid lag.
      resizeTimeout = setTimeout(() => this._resize(), 16);
    };

    window.addEventListener('resize', handleResize);
  }

  _resize() {
    // Logic to resize canvas content if you are drawing something specific
    // For now, the CSS object-fit: contain handles the visual aspect,
    // but if you have WebGL or Context2D logic dependent on screen size, 
    // you would emit an event here.

    // Example: dispatch event for consumers of this class
    const event = new CustomEvent('screen-resize', {
      detail: this.getCanvasDimensions()
    });
    this.canvas.dispatchEvent(event);
  }

  // ... (Rest of the methods remain the same)
  getContext(type = '2d', options = {}) {
    const defaultOptions = {
      alpha: false,
      desynchronized: true,
      ...options,
    };
    return this.canvas.getContext(type, defaultOptions);
  }

  setFullscreen() {
    if (this.container.requestFullscreen) {
      this.container.requestFullscreen();
    }
  }

  getCanvasDimensions() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
      displayWidth: this.canvas.offsetWidth,
      displayHeight: this.canvas.offsetHeight,
    };
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

export default Screen;
