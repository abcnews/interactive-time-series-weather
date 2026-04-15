<script lang="ts">
  let { url = '' } = $props();

  let svgContent = $state('');
  let isDev = $state(window.location.port !== '' && window.location.port !== '80');

  // Re-fetch the SVG content whenever the URL prop changes
  $effect(() => {
    if (!url) return;
    fetch(url)
      .then(r => r.text())
      .then(text => {
        svgContent = text;
      })
      .catch(e => console.error('Failed to load favicon SVG', e));
  });

  const colours = $derived(
    isDev
      ? { start: '#ff9100', end: '#ff0000' } // Orange to Red for Dev
      : { start: '#00fbff', end: '#004cff' } // Cyan to Blue for Prod
  );

  /**
   * Processes the raw SVG text using a hybrid DOMParser + innerHTML approach
   * for balance between robustness and readability.
   */
  const dynamicSvg = $derived.by(() => {
    if (!svgContent) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) return '';

    // Inject gradient and styles as a single string block
    const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colours.start}" />
        <stop offset="100%" stop-color="${colours.end}" />
      </linearGradient>
      <style>path { fill: url(#g) !important; }</style>
    `.trim();

    svg.insertBefore(defs, svg.firstChild);

    return new XMLSerializer().serializeToString(doc);
  });
</script>

<svelte:head>
  {#if dynamicSvg}
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,{encodeURIComponent(dynamicSvg)}" />
  {/if}
</svelte:head>
