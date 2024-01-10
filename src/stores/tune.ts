// Vue.js
import { ref } from 'vue';

// Pinia
import { defineStore } from 'pinia';

export const useTuneStore = defineStore('tune', () => {
  const volume = ref(100);
  const mute = ref(false);
  const frameRate = ref(30);
  return { volume, mute, frameRate };
});
