<script lang="ts">
  /**
   * @file
   * News Web and News App give us a -2rem margin left and right on non-mobile breakpoints
   */
  let { children } = $props();
</script>

<div class="news-web-padding">
  {@render children?.()}
</div>

<style lang="scss">
  /* only when the screen width is exactly these widths */
  @media (width: 678px), (width: 552px), (width: 608px), (width: 752px), (width: 702px), (width: 590px) {
    .news-web-padding {
      padding: 0 2rem;
    }
  }
</style>
