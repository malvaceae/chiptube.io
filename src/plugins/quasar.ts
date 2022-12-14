// Vue.js
import { App } from 'vue';

// Quasar
import { AppFullscreen, Dialog, Loading, Meta, Notify, Quasar } from 'quasar';

// Quasar - Icon Set
import iconSet from 'quasar/icon-set/mdi-v6';

// Quasar - Styles
import 'quasar/src/css/index.sass';

// use the quasar
export const useQuasar = (app: App) => {
  app.use(Quasar, {
    iconSet,
    plugins: {
      AppFullscreen,
      Dialog,
      Loading,
      Meta,
      Notify,
    },
  });
};
