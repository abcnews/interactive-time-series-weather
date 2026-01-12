/**
 * LocalStorage API with silent failure
 */
function tryStorage(
  type: 'localStorage' | 'sessionStorage',
  operation: 'getItem' | 'setItem' | 'removeItem',
  keyName: string,
  value?: string
) {
  try {
    const storage = window[type];
    if (operation === 'setItem') {
      if (value === undefined) {
        return null;
      }
      storage.setItem(keyName, value);
    } else if (operation === 'getItem') {
      return storage.getItem(keyName);
    } else if (operation === 'removeItem') {
      storage.removeItem(keyName);
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Prevents parallel requests across iframes from bypassing the browser cache.
 * e.g. if multiple iframes request the same resource simultaneously, only the first fetches
 * while others wait, then use the cached response.
 *
 * Uses sessionStorage and BroadcastChannel for cross-context synchronization, with automatic
 * timeout to prevent deadlocks.
 *
 * @example
 * ```typescript
 * const blocker = new BroadcastBlocker(url);
 * await blocker.waitUntilUnblocked();
 * blocker.block();
 * const response = await fetch(url);
 * blocker.unblock();
 * ```
 */
export class BroadcastBlocker {
  name = '';
  timeoutMs = 10000;
  #localEmitter = document.createElement('div');
  #broadcastChannel: BroadcastChannel = new BroadcastChannel('fetchBlocking');

  /** @param name - Unique identifier for the resource (e.g., fetch URL) */
  constructor(name, { timeoutMs }: { timeoutMs?: number } = {}) {
    this.name = name;
    if (timeoutMs) {
      this.timeoutMs = timeoutMs;
    }
  }
  /** Check if resource is currently blocked. Removes expired blocks. */
  hasBlock() {
    const blockValue = tryStorage('sessionStorage', 'getItem', this.name);
    if (blockValue) {
      if (Number(blockValue) < Date.now() - this.timeoutMs) {
        this.unblock();
        return false;
      }
      return true;
    }
    return false;
  }
  /** Wait until resource is available. Times out after timeoutMs. */
  async waitUntilUnblocked() {
    if (!this.hasBlock()) {
      return;
    }

    return new Promise<void>(resolve => {
      const done = async () => {
        clearTimeout(timeoutId);
        this.#localEmitter.removeEventListener('unblocked', localListener);
        await this.waitUntilUnblocked();
        resolve();
      };

      const localListener = ((event: CustomEvent) => {
        if (event.detail === this.name) {
          done();
        }
      }) as EventListener;
      this.#localEmitter.addEventListener('unblocked', localListener);

      const timeoutId = setTimeout(done, this.timeoutMs);
      const channelListener = ({ data }) => {
        if (data === this.name) {
          done();
        }
      };
      this.#broadcastChannel.addEventListener('message', channelListener);
    });
  }
  /** Mark resource as blocked. */
  block() {
    tryStorage('sessionStorage', 'setItem', this.name, String(Date.now()));
  }
  /** Remove block and notify all contexts via BroadcastChannel. */
  unblock() {
    tryStorage('sessionStorage', 'removeItem', this.name);
    this.emit(this.name);
  }
  /** Broadcast unblock notification to all contexts. */
  emit(message) {
    this.#broadcastChannel.postMessage(message);
    this.#localEmitter.dispatchEvent(new CustomEvent('unblocked', { detail: message }));
  }
}
