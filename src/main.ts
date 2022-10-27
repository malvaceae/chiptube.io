// Vue.js
import { createApp } from 'vue';

// Vue Router
import router from '@/router';

// Pinia
import pinia from '@/stores';

// Amplify
import '@/plugins/amplify';

// Quasar
import { useQuasar } from '@/plugins/quasar';

// App
import App from '@/App.vue';

// create the root component
const app = createApp(App);

// use the router
app.use(router);

// use the pinia
app.use(pinia);

// use the quasar
useQuasar(app);

// mount the app
app.mount('#app');
