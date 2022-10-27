// Vue.js
import { ref } from 'vue';

// Pinia
import { defineStore } from 'pinia';

export const usePageStore = defineStore('page', () => {
  const dark = ref<boolean | 'auto'>('auto');
  return { dark };
});
