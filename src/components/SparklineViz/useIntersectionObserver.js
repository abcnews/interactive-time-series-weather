/**
 * Svelte action for observing element intersection with the viewport.
 *
 * @param {HTMLElement} node - The DOM element to observe
 * @param {Object} options - Configuration options
 * @param {number|number[]} [options.threshold=0] - Percentage of element visibility (0-1) that triggers callbacks
 * @param {string} [options.rootMargin='0px'] - Margin around the root (similar to CSS margin)
 * @param {Function} [options.onEnter] - Callback when element enters viewport
 * @param {Function} [options.onExit] - Callback when element exits viewport
 * @param {Function} [options.onChange] - Callback on any intersection change (receives IntersectionObserverEntry)
 * @returns {Object} Svelte action object with destroy method
 *
 * @example
 * <div use:intersectionObserver={{
 *   threshold: 0.5,
 *   onEnter: () => console.log('in view'),
 *   onExit: () => console.log('out of view')
 * }}>
 */
export function intersectionObserver(node, options = {}) {
  const { threshold = 0, rootMargin = '0px', onEnter, onExit, onChange } = options;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        console.log('entry for', entry);
        if (entry.isIntersecting) {
          onEnter?.();
        } else {
          onExit?.();
        }
        onChange?.(entry);
      });
    },
    {
      threshold,
      rootMargin
    }
  );
  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}
