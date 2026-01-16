<script lang="ts">
  /**
   * Copypasta of builder-components typeahead because we need to add more buttons
   */
  import { untrack } from 'svelte';

  let {
    values = [],
    value = [],
    disabled,
    onChange = () => {}
  }: {
    values: {
      value: string;
      label: string;
    }[];
    value: string[];
    disabled: boolean;
    onChange?: (val: string[]) => void;
  } = $props();

  const uniqueId = 'list' + (Math.random() * 10e15).toString(16);
  let selectedValues = $state<string[]>(value);
  let isFocused = $state(false);
  let inputElement = $state<HTMLInputElement>();
  let inputValue = $state('');

  function getValueFromLabel(label: string) {
    const foundValue = values.find(value => value.label === label);
    return foundValue;
  }
  $effect(() => {
    const foundValue = getValueFromLabel(inputValue);
    if (!foundValue) {
      return;
    }
    untrack(() => {
      selectedValues = Array.from(new Set([...selectedValues, foundValue.value]));
      inputValue = '';
      onChange(selectedValues);
    });
  });
  $effect(() => {
    selectedValues = value;
  });
  let displayItems = $derived.by(() => {
    return selectedValues.map(val => {
      const [name, override] = val.split('|');
      const option = values.find(v => v.value === name);
      return {
        originalValue: val,
        name,
        override,
        label: override || option?.label || name
      };
    });
  });

  function rename(item: (typeof displayItems)[number]) {
    const newName = prompt(`Rename ${item.label}`, item.label);
    if (newName === null) {
      return;
    }
    const newValue = newName === '' || newName === item.label ? item.name : `${item.name}|${newName}`;
    selectedValues = selectedValues.map(v => (v === item.originalValue ? newValue : v));
    onChange(selectedValues);
  }
</script>

<!-- this interaction is supplementary to the input element, so it's not an accessibility issue -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="typeahead"
  class:typeahead--focused={isFocused}
  class:typeahead--disabled={disabled}
  onclick={e => inputElement?.focus()}
>
  <input
    class="typeahead__input"
    {disabled}
    bind:this={inputElement}
    bind:value={inputValue}
    list={uniqueId}
    onfocus={() => {
      isFocused = true;
    }}
    onblur={() => {
      isFocused = false;
    }}
  />
  <ul class="typeahead__selected-items">
    {#each displayItems as item}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <li class="typeahead__selected-item" onclick={e => e.stopPropagation()}>
        <div class="typeahead__selected-item-text">
          {item.label}
        </div>
        <button
          aria-label={`Rename ${item.label}`}
          title={`Rename ${item.label}`}
          class="typeahead__selected-item-butt"
          onclick={e => {
            e.preventDefault();
            rename(item);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-pencil-square"
            viewBox="0 0 16 16"
          >
            <path
              d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.12 1.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"
            />
            <path
              fill-rule="evenodd"
              d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
            />
          </svg>
        </button>
        <button
          class="typeahead__selected-item-butt"
          aria-label={`Remove ${item.label}`}
          title={`Remove ${item.label}`}
          onclick={e => {
            e.preventDefault();
            selectedValues = selectedValues.filter(thisValue => thisValue !== item.originalValue);
            onChange(selectedValues);
          }}
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-x-lg"
            viewBox="0 0 16 16"
          >
            <path
              d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"
            />
          </svg></button
        >
      </li>
    {/each}
  </ul>
</div>
<datalist id={uniqueId}>
  {#each values as value}
    <option value={value.label}></option>
  {/each}
</datalist>

<style>
  .typeahead {
    padding: 0.25rem 0.5rem;
    background: var(--background);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 0.2rem;
  }
  .typeahead--focused {
    outline: 2px solid Highlight;
  }
  .typeahead--disabled {
    background: transparent;
    cursor: not-allowed;
  }
  .typeahead--disabled * {
    pointer-events: none;
  }
  ul,
  li {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .typeahead input.typeahead__input {
    border: none;
    outline: none;
    width: 100%;
    padding: 0.25rem 0;
    background: transparent;
    color: var(--c-black);
  }

  .typeahead__selected-items {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    max-height: 6rem;
    overflow: auto;
  }
  .typeahead__selected-item {
    background: var(--background);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 0.2rem;
    position: relative;
    padding: 0.25rem;
    display: inline-flex;
    flex-direction: row;
    font-size: 0.75rem;
    .typeahead__selected-item-butt {
      padding: 0;
      height: 100%;
      width: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
    }
  }

  .typeahead__selected-item-text {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>
