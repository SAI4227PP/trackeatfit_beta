// utils/sseClient.js

/**
 * Robust WebSocket client and post state manager for Community/AllNews.
 * Usage:
 *   const wsPosts = new CommunitySSEClient({ url, onPosts, onError, onOpen, userId });
 *   wsPosts.connect();
 *   wsPosts.close();
 *   wsPosts.fetchPosts();
 *   wsPosts.likePost(postId);
 *   wsPosts.savePost(postId);
 *   ...
 */

export class CommunitySSEClient {
  /**
   * @param {Object} options
   * @param {string} options.url
   * @param {function} [options.onPosts] - Called for post create, update, delete events
   * @param {function} [options.onLike] - Called for like/unlike events
   * @param {function} [options.onSaved] - Called for save/unsave events
   * @param {function} [options.onComment] - Called for comment create/delete events
   * @param {function} [options.onError]
   * @param {function} [options.onOpen]
   * @param {string} options.userId
   * @param {number} [options.maxReconnectAttempts]
   */
  constructor({ url, onPosts, onLike, onSaved, onComment, onError, onOpen, userId, maxReconnectAttempts = 5, debugLabel }) {
    this.url = url;
    this.onPosts = onPosts;
    this.onLike = onLike;
    this.onSaved = onSaved;
    this.onComment = onComment;
    this.onError = onError;
    this.onOpen = onOpen;
    this.userId = userId;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.ws = null;
    this.reconnectAttempts = 0;
    this._pingInterval = null;
    this.debugLabel = debugLabel || 'CommunitySSEClient';
  }

  /**
   * Singleton instance map by userId and clientType.
   * @type {Object.<string, CommunitySSEClient>}
   */
  static _instances = {};

  /**
   * Get or create a singleton instance for a given userId and clientType.
   * @param {Object} options - Same as constructor options, plus optional clientType.
   * @returns {CommunitySSEClient}
   */
  static getInstance(options) {
    // Use both userId and clientType for the key to avoid handler overwrites
    const key = (options.userId || 'default') + (options.clientType ? `-${options.clientType}` : '');
    if (!CommunitySSEClient._instances[key]) {
      CommunitySSEClient._instances[key] = new CommunitySSEClient(options);
    }
    return CommunitySSEClient._instances[key];
  }

  connect() {
    // Prevent multiple connections for the same instance
    if (this.ws && (this.ws.readyState === 1 || this.ws.readyState === 0)) {
      // Already connected or connecting
      return;
    }
    // Always use the production WebSocket URL
    let wsUrl = 'wss://trackeatfit.onrender.com/ws/events';
    console.log('[CommunitySSEClient] Connecting to WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = (e) => {
        console.log(`[${this.debugLabel}] WebSocket connection opened`);
        this.reconnectAttempts = 0;
        // Start keep-alive ping
        this._startPing();
        if (this.onOpen) this.onOpen(e);
      };

      this.ws.onmessage = (e) => {
        console.log(`[${this.debugLabel}] Raw WebSocket message:`, e.data);
        try {
          const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          // console.log(`[${this.debugLabel}] Parsed WebSocket message:`, msg);
          // Handle posts events: create, update, delete
          if (
            msg &&
            (msg.event === 'posts' || msg.eventType === 'posts') &&
            msg.data &&
            ['create','update','delete'].includes(msg.data.type)
          ) {
            if (this.onPosts) this.onPosts(msg.data);
          }
          // Handle like events (likeUpdate)
          if (
            msg &&
            (msg.event === 'posts' || msg.eventType === 'posts') &&
            msg.data &&
            msg.data.type === 'likeUpdate'
          ) {
            if (this.onLike) this.onLike(msg.data);
          }
          // Handle savedPosts events (save/unsave)
          if (
            msg &&
            (msg.event === 'savedPosts' || msg.eventType === 'savedPosts') &&
            msg.data &&
            ['save','unsave'].includes(msg.data.type)
          ) {
            // Always pass the full data (including post if present)
            if (this.onSaved) this.onSaved(msg.data);
          }
          // Handle comment events (newComment, comments delete)
          if (
            msg &&
            ((msg.event === 'newComment' || msg.eventType === 'newComment') ||
             (msg.event === 'comments' || msg.eventType === 'comments')) &&
            msg.data
          ) {
            // newComment: creation, comments: {type: 'delete', ...}
            if (this.onComment) this.onComment(msg.data, msg.event || msg.eventType);
          }
          // --- Custom eventType handler for logged-food ---
          if (
            msg &&
            (msg.eventType === 'logged-food' || msg.event === 'logged-food') &&
            typeof this._onLoggedFood === 'function'
          ) {
            this._onLoggedFood(msg);
          }
        } catch (err) {
          console.error(`[${this.debugLabel}] WebSocket message parse error:`, err, e.data);
        }
      };

      this.ws.onerror = (error) => {
        let errMsg = `[${this.debugLabel}] WebSocket error:`;
        if (error && error.message) {
          errMsg += ' ' + error.message;
        } else if (typeof error === 'object') {
          try {
            errMsg += ' ' + JSON.stringify(error);
          } catch (e) {
            errMsg += ' [object error]';
          }
        } else {
          errMsg += ' ' + String(error);
        }
        console.error(errMsg);
        if (this.onError) this.onError(error);
        this._stopPing();
        this._tryReconnect();
      };

      this.ws.onclose = () => {
        console.log(`[${this.debugLabel}] WebSocket closed`);
        this._stopPing();
        this._tryReconnect();
      };
    } catch (err) {
      console.error(`[${this.debugLabel}] Failed to create WebSocket:`, err);
      if (this.onError) this.onError(err);
    }
  }

  _startPing() {
    this._stopPing();
    // Send a ping every 30 seconds
    this._pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === 1) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch (e) {
          // Ignore send errors
        }
      }
    }, 30000);
  }

  _stopPing() {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
  }

  _tryReconnect() {
    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      setTimeout(() => this.connect(), 5000 * Math.pow(2, this.reconnectAttempts));
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._stopPing();
  }
}

// For legacy usage, keep the simple createSSE function, but warn if used
export default function createSSE(url, handlers = {}, options = {}) {
  console.warn('[sseClient] createSSE is deprecated. Use CommunitySSEClient (WebSocket) instead.');
  // Use a singleton for legacy as well
  if (!createSSE._ws) {
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = options.maxReconnectAttempts || 5;

    function connect() {
      if (ws && (ws.readyState === 1 || ws.readyState === 0)) {
        return;
      }
      // Always use the production WebSocket URL
      let wsUrl = 'wss://v1.trackeatfit.xyz/ws/events';
      ws = new WebSocket(wsUrl);
      ws.onopen = (e) => {
        reconnectAttempts = 0;
        if (handlers.onopen) handlers.onopen(e);
      };
      ws.onmessage = (e) => {
        if (handlers.onmessage) handlers.onmessage(e);
      };
      ws.onerror = (error) => {
        if (handlers.onerror) handlers.onerror(error);
        reconnectAttempts++;
        if (reconnectAttempts <= maxReconnectAttempts) {
          setTimeout(connect, 5000 * Math.pow(2, reconnectAttempts));
        }
      };
      ws.onclose = () => {
        reconnectAttempts++;
        if (reconnectAttempts <= maxReconnectAttempts) {
          setTimeout(connect, 5000 * Math.pow(2, reconnectAttempts));
        }
      };
    }

    function close() {
      if (ws) {
        ws.close();
        ws = null;
      }
    }

    createSSE._ws = { connect, close, get instance() { return ws; } };
  }
  return createSSE._ws;
}

