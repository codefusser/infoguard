// Content Script - Runs on web pages

class MediaDetector {
  constructor() {
    this.detectedMedia = [];
    this.mediaElementsMap = {}; // src -> [elements]
    this.initializeListener();
    this.autoAnalyzeInterval = null;
    this.initAutoAnalyze();
  }

  initializeListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'detectMedia') {
        this.detectMedia();
        sendResponse({ media: this.detectedMedia });
      }
      // Overlay the page on demand: detect media and request analysis for all (up to cap)
      if (request.action === 'overlayPage') {
        const media = this.detectMedia();
        this.requestBulkAnalysis(media, request.cap || 50);
        sendResponse({ mediaCount: media.length });
      } else if (request.action === 'selectImage') {
        this.enableImageSelection();
      }
    });
  }

  detectMedia() {
    this.detectedMedia = [];
    this.mediaElementsMap = {};
    
    // Detect images
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (this.isVisibleAndValid(img) && img.src) {
        const src = this.getAbsoluteUrl(img.src);
        this.detectedMedia.push({ type: 'image', src, alt: img.alt || '', timestamp: new Date().toISOString() });
        if (!this.mediaElementsMap[src]) this.mediaElementsMap[src] = [];
        this.mediaElementsMap[src].push(img);
      }
    });

    // Detect videos
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      if (this.isVisibleAndValid(video)) {
        const source = video.querySelector('source');
        if (source && source.src) {
          this.detectedMedia.push({
            type: 'video',
            src: this.getAbsoluteUrl(source.src),
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Detect iframes with video (YouTube, Vimeo, etc.)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      if (this.isVisibleAndValid(iframe) && this.isMediaIframe(iframe)) {
        this.detectedMedia.push({
          type: 'video',
          src: iframe.src,
          platform: this.getMediaPlatform(iframe.src),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Try to detect media from picture elements
    const pictures = document.querySelectorAll('picture');
    pictures.forEach((picture) => {
      const img = picture.querySelector('img');
      if (img && this.isVisibleAndValid(img) && img.src) {
        const src = this.getAbsoluteUrl(img.src);
        this.detectedMedia.push({ type: 'image', src, alt: img.alt || '', timestamp: new Date().toISOString() });
        if (!this.mediaElementsMap[src]) this.mediaElementsMap[src] = [];
        this.mediaElementsMap[src].push(img);
      }
    });

    console.log(`[InfoGuard] Detected ${this.detectedMedia.length} media items`);
    return this.detectedMedia;
  }

  // Request bulk analysis for a list of media (and display badges)
  requestBulkAnalysis(mediaList, cap = 50) {
    const toAnalyze = mediaList.slice(0, cap);
    if (toAnalyze.length === 0) return;

    chrome.runtime.sendMessage({ action: 'bulkAnalyze', mediaList: toAnalyze }, (response) => {
      if (response && response.success && Array.isArray(response.results)) {
        response.results.forEach((res, idx) => {
          const media = toAnalyze[idx];
          this.displayBadgeForSrc(media.src, res);
        });
      }
    });
  }

  initAutoAnalyze() {
    // Read the user's preference and start/stop periodic detection accordingly
    chrome.storage.local.get(['autoAnalyze'], (res) => {
      const enabled = res.autoAnalyze !== false; // default true
      if (enabled) {
        this.startAutoAnalyze();
      }
    });

    // Listen for changes to the autoAnalyze setting
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.autoAnalyze) {
        const enabled = changes.autoAnalyze.newValue !== false;
        if (enabled) this.startAutoAnalyze(); else this.stopAutoAnalyze();
      }
    });
  }

  startAutoAnalyze() {
    if (this.autoAnalyzeInterval) return;
    // Run initial detection+analysis
    const run = () => {
      const media = this.detectMedia();
      this.requestBulkAnalysis(media, 10);
    };
    run();
    this.autoAnalyzeInterval = setInterval(run, 5000);
  }

  stopAutoAnalyze() {
    if (!this.autoAnalyzeInterval) return;
    clearInterval(this.autoAnalyzeInterval);
    this.autoAnalyzeInterval = null;
  }

  // Display a badge for a given media src and analysis result
  displayBadgeForSrc(src, result) {
    const elements = this.mediaElementsMap[src] || [];
    elements.forEach((el) => this.addBadgeToElement(el, result));
  }

  addBadgeToElement(element, result) {
    // Ensure style for badges exists once
    if (!document.getElementById('infoguard-badge-style')) {
      const style = document.createElement('style');
      style.id = 'infoguard-badge-style';
      style.textContent = `
        .infoguard-badge { position: absolute; top: 6px; left: 6px; padding: 4px 8px; border-radius: 12px; font-size: 12px; color: white; font-weight: 700; z-index: 2147483647; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
        .infoguard-result-panel { position: absolute; z-index: 2147483647; background: white; color: #222; padding: 10px; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.2); max-width: 320px; font-size: 13px; }
      `;
      document.head.appendChild(style);
    }

    // Avoid duplicating a badge on the same element
    if (element.__infoGuardBadge) return;

    // Make element positioned so absolute badge can be placed
    const computed = window.getComputedStyle(element);
    if (computed.position === 'static' || !computed.position) {
      // save original explicit position value so we can restore it later
      try { element.dataset.infoguardOriginalPosition = element.style.position || ''; } catch(e){}
      element.style.position = 'relative';
    }

    const badge = document.createElement('div');
    badge.className = 'infoguard-badge';
    const pct = Math.round((result.credibilityScore || 0) * 100);
    badge.textContent = `${pct}%`;
    const color = pct > 70 ? '#2ecc71' : pct > 40 ? '#f1c40f' : '#e74c3c';
    badge.style.background = color;
    badge.title = result.assessment || 'InfoGuard analysis';

    // Click badge to expand details
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.showResultPanelForElement(element, result);
    });

    element.appendChild(badge);
    element.__infoGuardBadge = badge;
  }

  showResultPanelForElement(element, result) {
    // Remove existing panels
    const existing = document.querySelector('.infoguard-result-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.className = 'infoguard-result-panel';
    const pct = Math.round((result.credibilityScore || 0) * 100);
    panel.innerHTML = `
      <div style="font-weight:800;margin-bottom:6px">InfoGuard — ${pct}%</div>
      <div style="font-size:13px;color:#444;margin-bottom:8px">${result.assessment || 'No assessment available.'}</div>
      <div style="font-size:12px;color:#666"><strong>Artifacts:</strong> ${(result.artifacts || []).join(', ') || 'None'}</div>
      <div style="font-size:12px;color:#666"><strong>Inconsistencies:</strong> ${(result.inconsistencies || []).join(', ') || 'None'}</div>
    `;

    // Append panel and position it relative to the element
    element.appendChild(panel);
    // Auto remove after 12s
    setTimeout(() => { panel.remove(); }, 12000);
  }

  isVisibleAndValid(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    // Check if element is visible
    if (rect.width === 0 || rect.height === 0) return false;
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;

    // Check if in viewport or nearby
    return rect.top < window.innerHeight + 1000 && rect.bottom > -1000;
  }

  getAbsoluteUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return window.location.protocol + url;
    if (url.startsWith('/')) return window.location.origin + url;
    return window.location.origin + '/' + url;
  }

  isMediaIframe(iframe) {
    const src = iframe.src || '';
    return (
      src.includes('youtube.com') ||
      src.includes('youtu.be') ||
      src.includes('vimeo.com') ||
      src.includes('dailymotion.com') ||
      src.includes('twitch.tv') ||
      src.includes('tiktok.com') ||
      src.includes('instagram.com') ||
      iframe.className.includes('video') ||
      iframe.id.includes('video')
    );
  }

  getMediaPlatform(url) {
    if (url.includes('youtube')) return 'YouTube';
    if (url.includes('vimeo')) return 'Vimeo';
    if (url.includes('dailymotion')) return 'Dailymotion';
    if (url.includes('twitch')) return 'Twitch';
    if (url.includes('tiktok')) return 'TikTok';
    if (url.includes('instagram')) return 'Instagram';
    return 'Video Platform';
  }

  enableImageSelection() {
    // Add selection mode
    const style = document.createElement('style');
    style.textContent = `
      img.infoguard-selectable {
        cursor: pointer;
        border: 2px dashed #667eea !important;
        opacity: 0.9;
      }
      img.infoguard-selectable:hover {
        border: 2px solid #667eea !important;
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    // Make images selectable
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      img.classList.add('infoguard-selectable');
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const mediaData = {
          type: 'image',
          src: this.getAbsoluteUrl(img.src),
          alt: img.alt || '',
          timestamp: new Date().toISOString()
        };

        chrome.runtime.sendMessage({
          action: 'analyzeSelectedMedia',
          media: mediaData
        });

        // Remove selection mode
        images.forEach(i => i.classList.remove('infoguard-selectable'));
        style.remove();
      });
    });
  }
}

// Initialize the media detector
const detector = new MediaDetector();

// Periodically check for new media (for dynamic pages)
setInterval(() => {
  detector.detectMedia();
}, 5000);

// Handle messages from background for context-menu triggered results
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'displayBadge' && request.targetSrc) {
    detector.displayBadgeForSrc(request.targetSrc, request.result);
    return;
  }

  if (request.action === 'displayTextResult') {
    const selection = request.selectionText || '';
    const result = request.result || {};
    // Try to position panel near current selection
    const sel = window.getSelection();
    let rect = null;
    if (sel && sel.rangeCount) rect = sel.getRangeAt(0).getBoundingClientRect();

    const panel = document.createElement('div');
    panel.className = 'infoguard-result-panel';
    panel.style.position = 'fixed';
    panel.style.right = '12px';
    panel.style.top = '12px';
    panel.innerHTML = `
      <div style="font-weight:800;margin-bottom:6px">InfoGuard — Selection</div>
      <div style="font-size:13px;color:#444;margin-bottom:8px">${result.assessment || 'No assessment available.'}</div>
    `;
    document.body.appendChild(panel);
    setTimeout(() => panel.remove(), 12000);
    return;
  }

  if (request.action === 'clearBadges') {
    try {
      const badges = document.querySelectorAll('.infoguard-badge');
      let count = 0;
      badges.forEach(b => {
        const parent = b.parentElement;
        if (parent) {
          // restore position if we recorded an original
          try {
            const orig = parent.dataset ? parent.dataset.infoguardOriginalPosition : undefined;
            if (typeof orig !== 'undefined') {
              if (orig) parent.style.position = orig;
              else parent.style.removeProperty('position');
              delete parent.dataset.infoguardOriginalPosition;
            }
            try { delete parent.__infoGuardBadge; } catch(e){}
          } catch (e) {}
        }
        b.remove();
        count++;
      });
      // remove result panels
      const panels = document.querySelectorAll('.infoguard-result-panel');
      panels.forEach(p => p.remove());

      sendResponse({ cleared: true, count });
    } catch (err) {
      console.error('clearBadges error', err);
      sendResponse({ cleared: false, error: err.message });
    }
    return true;
  }

  if (request.action === 'displayError') {
    alert('InfoGuard error: ' + (request.error || 'Unknown'));
  }
});
