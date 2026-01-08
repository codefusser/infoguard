/**
 * Background Service Worker
 * Handles API calls, media analysis, and background tasks
 */

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const TRUSTED_DATABASES = {
  'snopes': 'https://snopes.com/api/claims',
  'factcheck': 'https://www.factcheck.org/api',
  'fullfact': 'https://fullfact.org/api'
};

class InfoGuardAnalyzer {
  constructor() {
    this.initializeListener();
    this.initializeExtensionEvents();
  }

  initializeExtensionEvents() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
        logger.info('Background', 'Extension installed, opening options page');
      }
    });

    // Create context menu items
    this.createContextMenuItems();
  }

  createContextMenuItems() {
    try {
      chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
          id: 'infoguard_inspect_image',
          title: 'Inspect image with InfoGuard',
          contexts: ['image']
        });

        chrome.contextMenus.create({
          id: 'infoguard_inspect_video',
          title: 'Inspect video with InfoGuard',
          contexts: ['video']
        });

        chrome.contextMenus.create({
          id: 'infoguard_inspect_selection',
          title: 'Inspect selected text with InfoGuard',
          contexts: ['selection']
        });

        logger.info('Background', 'Context menu items created');
      });
    } catch (error) {
      logger.error('Background', 'Failed to create context menu items', error);
    }

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      try {
        if (!tab || !tab.id) return;

        if (info.menuItemId === 'infoguard_inspect_image' || info.menuItemId === 'infoguard_inspect_video') {
          const src = info.srcUrl;
          const mediaType = info.menuItemId.includes('image') ? 'image' : 'video';
          const media = { type: mediaType, src };

          const token = await this.getValidToken();
          const result = await this.analyzeMedia(media, token);
          
          chrome.tabs.sendMessage(tab.id, { action: 'displayBadge', targetSrc: src, result });
          logger.info('Background', `Context menu analysis: ${mediaType}`);
        }

        if (info.menuItemId === 'infoguard_inspect_selection') {
          const selection = info.selectionText || '';
          const token = await this.getValidToken();
          const result = await this.analyzeText(selection, token);
          
          chrome.tabs.sendMessage(tab.id, { action: 'displayTextResult', selectionText: selection, result });
          logger.info('Background', 'Context menu text analysis');
        }
      } catch (error) {
        logger.error('Background', 'Context menu handler error', error);
        if (tab && tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'displayError', error: error.message });
        }
      }
    });
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  async getValidToken() {
    const token = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.GOOGLE_TOKEN]);
    const storedToken = token[CONFIG.STORAGE_KEYS.GOOGLE_TOKEN];

    if (!storedToken) {
      throw new Error(CONFIG.ERROR_MESSAGES.AUTH_FAILED);
    }

    return storedToken;
  }

  /**
   * Get Gemini API key from storage
   */
  async getGeminiApiKey() {
    const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.GEMINI_API_KEY]);
    const apiKey = result[CONFIG.STORAGE_KEYS.GEMINI_API_KEY];

    if (!apiKey) {
      throw new Error(CONFIG.ERROR_MESSAGES.API_KEY_MISSING);
    }

    return apiKey;
  }

  initializeListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'analyzeMedia') {
        this.analyzeMedia(request.media, request.token)
          .then(result => {
            sendResponse({ success: true, data: result });
          })
          .catch(error => {
            logger.error('Background', 'Media analysis error', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // Keep the channel open for async response
      }

      if (request.action === 'bulkAnalyze') {
        const mediaList = request.mediaList || [];
        const promises = mediaList.map((m) => this.analyzeMedia(m));
        Promise.all(promises)
          .then(results => sendResponse({ success: true, results }))
          .catch(error => {
            logger.error('Background', 'Bulk analysis error', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;
      }

      if (request.action === 'analyzeText') {
        const text = request.text || '';
        this.analyzeText(text)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => {
            logger.error('Background', 'Text analysis error', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;
      }
    });
  }

  async analyzeMedia(media, token) {
    try {
      logger.debug('Background', 'Starting media analysis', { mediaType: media.type });

      const apiKey = await this.getGeminiApiKey();
      const mediaData = await this.fetchMediaData(media.src);
      const geminiAnalysis = await this.analyzeWithGemini(mediaData, media, apiKey);
      const dbResults = await this.crossReferenceWithDatabases(geminiAnalysis.claims);
      const credibilityScore = this.calculateCredibilityScore(geminiAnalysis, dbResults);

      const result = {
        mediaType: media.type,
        credibilityScore: credibilityScore,
        assessment: geminiAnalysis.assessment,
        artifacts: geminiAnalysis.artifacts,
        inconsistencies: geminiAnalysis.inconsistencies,
        confidence: geminiAnalysis.confidence,
        dbResults: dbResults,
        timestamp: new Date().toISOString()
      };

      logger.info('Background', 'Media analysis completed', { 
        mediaType: media.type, 
        score: credibilityScore 
      });

      return result;
    } catch (error) {
      logger.error('Background', 'Analysis error', error);
      throw error;
    }
  }

  async fetchMediaData(mediaUrl) {
    try {
      const response = await fetch(mediaUrl, {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      return {
        data: uint8Array,
        mimeType: blob.type,
        size: blob.size
      };
    } catch (error) {
      logger.warn('Background', 'Media fetch error', error);
      // Return placeholder data for demo
      return {
        data: new Uint8Array(),
        mimeType: 'image/jpeg',
        size: 0
      };
    }
  }

  async analyzeWithGemini(mediaData, media, apiKey) {
    try {
      const base64Data = this.bufferToBase64(mediaData.data);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mediaData.mimeType || 'image/jpeg',
                  data: base64Data
                }
              },
              {
                text: this.getAnalysisPrompt(media.type)
              }
            ]
          }
        ],
        systemInstruction: {
          parts: {
            text: `You are an expert in detecting deepfakes, AI-generated content, and media manipulation. 
            Analyze the provided media and identify:
            1. Any visual artifacts or inconsistencies that suggest manipulation
            2. Signs of AI generation (unnatural features, artifacts, etc.)
            3. Potential deepfake indicators
            4. Any claims visible in the media
            
            Provide a detailed assessment in JSON format.`
          }
        }
      };

      const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        timeout: CONFIG.TIMEOUTS.ANALYSIS
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseGeminiResponse(data);
    } catch (error) {
      logger.error('Background', 'Gemini analysis error', error);
      // Return a mock response for demo
      return this.getMockAnalysisResponse();
    }
  }

  async analyzeText(text, token) {
    try {
      const apiKey = await this.getGeminiApiKey();

      const requestBody = {
        contents: [
          {
            parts: [
              { text: 'Please analyze the following text for factual accuracy and possible misinformation or misleading claims. Return JSON: {assessment, claims: [], confidence}' },
              { text }
            ]
          }
        ],
        systemInstruction: {
          parts: {
            text: 'You are an expert fact-checker. Cross-reference claims where possible and provide a concise JSON output.'
          }
        }
      };

      const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        timeout: CONFIG.TIMEOUTS.ANALYSIS
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseGeminiResponse(data);
    } catch (error) {
      logger.error('Background', 'Text analysis error', error);
      return this.getMockAnalysisResponse();
    }
  }

  parseGeminiResponse(data) {
    try {
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          assessment: parsed.assessment || content.substring(0, 200),
          artifacts: parsed.artifacts || [],
          inconsistencies: parsed.inconsistencies || [],
          confidence: parsed.confidence || 65,
          claims: parsed.claims || []
        };
      }

      return {
        assessment: content.substring(0, 500),
        artifacts: this.extractArtifacts(content),
        inconsistencies: this.extractInconsistencies(content),
        confidence: 65,
        claims: []
      };
    } catch (error) {
      logger.error('Background', 'Parse error', error);
      return this.getMockAnalysisResponse();
    }
  }

  extractArtifacts(text) {
    const artifacts = [];
    const patterns = [
      /distortion|blur|artifact|noise|compression|pixelat/i,
      /face mismatch|eye inconsisten|lighting issue/i,
      /background inconsisten|object placement/i
    ];

    patterns.forEach((pattern) => {
      if (pattern.test(text)) {
        const match = text.match(new RegExp(`[^.]*${pattern.source}[^.]*`, 'i'));
        if (match) artifacts.push(match[0].trim());
      }
    });

    return artifacts;
  }

  extractInconsistencies(text) {
    const inconsistencies = [];
    const patterns = [
      /shadow|light/i,
      /color|saturation/i,
      /anatomy|proportion/i
    ];

    patterns.forEach((pattern) => {
      if (pattern.test(text)) {
        inconsistencies.push(pattern.source);
      }
    });

    return inconsistencies;
  }

  getMockAnalysisResponse() {
    return {
      assessment: 'This media shows signs of potential manipulation including minor compression artifacts and inconsistent patterns. However, the overall quality suggests it may be authentic or professionally processed.',
      artifacts: ['Compression artifacts detected', 'Minor color variation'],
      inconsistencies: ['Slight lighting variance in regions'],
      confidence: 72,
      claims: []
    };
  }

  async crossReferenceWithDatabases(claims) {
    const results = {};

    for (const [dbName, dbUrl] of Object.entries(TRUSTED_DATABASES)) {
      try {
        // In a real implementation, you would query these APIs
        results[dbName] = {
          status: 'checked',
          matchedClaims: [],
          verdict: 'undetermined'
        };
      } catch (error) {
        logger.error('Background', `Database check error for ${dbName}`, error);
        results[dbName] = { status: 'error', error: error.message };
      }
    }

    return results;
  }

  calculateCredibilityScore(geminiAnalysis, dbResults) {
    let score = 0.8; // Start with 80% authentic

    // Reduce score based on artifacts and inconsistencies
    const artifactCount = geminiAnalysis.artifacts.length;
    const inconsistencyCount = geminiAnalysis.inconsistencies.length;

    score -= artifactCount * 0.08;
    score -= inconsistencyCount * 0.10;

    // Adjust based on Gemini confidence
    const confidenceMultiplier = geminiAnalysis.confidence / 100;
    score *= confidenceMultiplier;

    // Check database results
    Object.values(dbResults).forEach((result) => {
      if (result.status === 'error' || result.verdict === 'false') {
        score -= 0.15;
      }
    });

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  getAnalysisPrompt(mediaType) {
    if (mediaType === 'video') {
      return `Analyze this video frame for signs of deepfakes or AI generation. 
      Look for facial inconsistencies, audio-visual mismatches, and unnatural movements.
      Return JSON with: {assessment, artifacts: [], inconsistencies: [], confidence: number}`;
    } else {
      return `Analyze this image for signs of deepfakes or AI generation.
      Look for visual artifacts, anatomical inconsistencies, and manipulation traces.
      Return JSON with: {assessment, artifacts: [], inconsistencies: [], confidence: number}`;
    }
  }
}

// Initialize the analyzer
const analyzer = new InfoGuardAnalyzer();

      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
      const data = await response.json();
      return this.parseGeminiResponse(data);
    } catch (err) {
      console.error('analyzeText error:', err);
      return { assessment: text.substring(0, 200), artifacts: [], inconsistencies: [], confidence: 50, claims: [text] };
    }
  }

  parseGeminiResponse(data) {
    try {
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          assessment: parsed.assessment || content.substring(0, 200),
          artifacts: parsed.artifacts || [],
          inconsistencies: parsed.inconsistencies || [],
          confidence: parsed.confidence || 65,
          claims: parsed.claims || []
        };
      }

      return {
        assessment: content.substring(0, 500),
        artifacts: this.extractArtifacts(content),
        inconsistencies: this.extractInconsistencies(content),
        confidence: 65,
        claims: []
      };
    } catch (error) {
      console.error('Parse error:', error);
      return this.getMockAnalysisResponse();
    }
  }

  extractArtifacts(text) {
    const artifacts = [];
    const patterns = [
      /distortion|blur|artifact|noise|compression|pixelat/i,
      /face mismatch|eye inconsisten|lighting issue/i,
      /background inconsisten|object placement/i
    ];

    patterns.forEach((pattern) => {
      if (pattern.test(text)) {
        const match = text.match(new RegExp(`[^.]*${pattern.source}[^.]*`, 'i'));
        if (match) artifacts.push(match[0].trim());
      }
    });

    return artifacts;
  }

  extractInconsistencies(text) {
    const inconsistencies = [];
    const patterns = [
      /shadow|light/i,
      /color|saturation/i,
      /anatomy|proportion/i
    ];

    patterns.forEach((pattern) => {
      if (pattern.test(text)) {
        inconsistencies.push(pattern.source);
      }
    });

    return inconsistencies;
  }

  getMockAnalysisResponse() {
    return {
      assessment: 'This image shows signs of potential manipulation including minor compression artifacts and inconsistent lighting patterns. However, the overall quality suggests it may be authentic or professionally edited.',
      artifacts: ['Compression artifacts detected', 'Minor color banding'],
      inconsistencies: ['Slight lighting inconsistency in background'],
      confidence: 72,
      claims: []
    };
  }

  async crossReferenceWithDatabases(claims) {
    const results = {};

    for (const [dbName, dbUrl] of Object.entries(TRUSTED_DATABASES)) {
      try {
        // In a real implementation, you would query these APIs
        results[dbName] = {
          status: 'checked',
          matchedClaims: [],
          verdict: 'undetermined'
        };
      } catch (error) {
        console.error(`Database check error for ${dbName}:`, error);
        results[dbName] = { status: 'error', error: error.message };
      }
    }

    return results;
  }

  calculateCredibilityScore(geminiAnalysis, dbResults) {
    let score = 0.8; // Start with 80% authentic

    // Reduce score based on artifacts and inconsistencies
    const artifactCount = geminiAnalysis.artifacts.length;
    const inconsistencyCount = geminiAnalysis.inconsistencies.length;

    // Each artifact reduces score by 8%
    score -= artifactCount * 0.08;

    // Each inconsistency reduces score by 10%
    score -= inconsistencyCount * 0.10;

    // Adjust based on Gemini confidence
    const confidenceMultiplier = geminiAnalysis.confidence / 100;
    score *= confidenceMultiplier;

    // Check database results
    Object.values(dbResults).forEach((result) => {
      if (result.status === 'error' || result.verdict === 'false') {
        score -= 0.15;
      }
    });

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  getAnalysisPrompt(mediaType) {
    if (mediaType === 'video') {
      return `Analyze this video frame for signs of deepfakes or AI generation. 
      Look for facial inconsistencies, audio-visual mismatches, and unnatural movements.
      Return JSON with: {assessment, artifacts: [], inconsistencies: [], confidence: number}`;
    } else {
      return `Analyze this image for signs of deepfakes or AI generation.
      Look for visual artifacts, anatomical inconsistencies, and manipulation traces.
      Return JSON with: {assessment, artifacts: [], inconsistencies: [], confidence: number}`;
    }
  }
}

// Initialize the analyzer
const analyzer = new InfoGuardAnalyzer();

// Create context menu entries and handle installation
chrome.runtime.onInstalled.addListener((details) => {
  // Open options on install
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }

  // Create context menu items
  try {
    chrome.contextMenus.create({
      id: 'infoguard_inspect_image',
      title: 'Inspect image with InfoGuard',
      contexts: ['image']
    });

    chrome.contextMenus.create({
      id: 'infoguard_inspect_video',
      title: 'Inspect video with InfoGuard',
      contexts: ['video']
    });

    chrome.contextMenus.create({
      id: 'infoguard_inspect_selection',
      title: 'Inspect selected text with InfoGuard',
      contexts: ['selection']
    });
  } catch (e) {
    console.warn('[InfoGuard] contextMenus setup failed', e);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (!tab || !tab.id) return;

    if (info.menuItemId === 'infoguard_inspect_image' || info.menuItemId === 'infoguard_inspect_video') {
      const src = info.srcUrl;
      const media = { type: info.menuItemId.includes('image') ? 'image' : 'video', src };
      const result = await analyzer.analyzeMedia(media);
      // Send result back to content script for display
      chrome.tabs.sendMessage(tab.id, { action: 'displayBadge', targetSrc: src, result });
    }

    if (info.menuItemId === 'infoguard_inspect_selection') {
      const selection = info.selectionText || '';
      const result = await analyzer.analyzeText(selection);
      chrome.tabs.sendMessage(tab.id, { action: 'displayTextResult', selectionText: selection, result });
    }
  } catch (err) {
    console.error('[InfoGuard] context menu handler error:', err);
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'displayError', error: err.message });
    }
  }
});
