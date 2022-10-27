// Vue.js
import { ref } from 'vue';

// Pinia
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Record<string, any> | null>(null);
  return { user };
});
