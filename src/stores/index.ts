// Vue.js
import { watch } from 'vue';

// Pinia
import { createPinia } from 'pinia';

// create pinia
const pinia = createPinia();

// set the initial state
if (localStorage.state) {
  pinia.state.value = JSON.parse(localStorage.state);
}

// persist the state
watch(pinia.state, (state) => {
  localStorage.state = JSON.stringify(state);
}, { deep: true });

export default pinia;
