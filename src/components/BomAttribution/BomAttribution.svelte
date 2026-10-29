<script lang="ts">
  interface Props {
    /** Extra sentence about how the data was derived, shown before the warranty disclaimer */
    note?: string;
  }

  let { note = '' }: Props = $props();
</script>

Source: © <a href="https://www.bom.gov.au/">Bureau of Meteorology</a>/<a href="https://www.bom.gov.au/climate/data/"
  >CDO</a
>.
<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
{#if note}{note}{/if}
Provided without warranties of any kind.
