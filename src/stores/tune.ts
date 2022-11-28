// Vue.js
import { ref } from 'vue';

// Pinia
import { defineStore } from 'pinia';

export const useTuneStore = defineStore('tune', () => {
  const volume = ref(100);
  const mute = ref(false);
  return { volume, mute };
});
