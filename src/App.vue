<script lang="ts" setup>
// Vue.js
import { ref } from 'vue';

// Quasar
import { useQuasar } from 'quasar';

// get the $q object
const $q = useQuasar();

// set dark mode status to 'auto'
$q.dark.set('auto');

// variables
const drawer = ref(false);
const search = ref('');
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered>
      <q-toolbar>
        <q-btn flat round @click="drawer = !drawer">
          <q-icon name="mdi-menu" />
        </q-btn>
        <q-toolbar-title shrink>
          ChipTube
        </q-toolbar-title>
        <q-space />
        <q-input v-model="search" class="col-grow gt-xs" dense outlined placeholder="Search" square>
          <template #after>
            <q-btn flat round @click="void 0">
              <q-icon name="mdi-magnify" />
            </q-btn>
          </template>
        </q-input>
        <q-space />
        <div class="row q-gutter-sm no-wrap items-center">
          <q-btn flat icon="mdi-dots-vertical" round>
            <q-menu class="full-width" anchor="bottom right" max-width="300px" self="top right" square>
              <q-list>
                <q-item clickable v-close-popup @click="$q.dark.toggle()">
                  <q-item-section side>
                    <q-icon name="mdi-theme-light-dark" />
                  </q-item-section>
                  <q-item-section>
                    Appearance: {{ $q.dark.isActive ? 'Dark' : 'Light' }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn no-wrap outline padding="6px 12px" square>
            <q-icon class="q-mr-sm" name="mdi-google" />
            <span class="block">Sign in</span>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="drawer" behavior="mobile" :width="240">
      <q-toolbar>
        <q-btn flat round @click="drawer = !drawer">
          <q-icon name="mdi-menu" />
        </q-btn>
        <q-toolbar-title shrink>
          ChipTube
        </q-toolbar-title>
      </q-toolbar>
    </q-drawer>
    <q-page-container>
      <!-- -->
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped>
.body--light {
  .q-layout {
    background-color: $grey-1;
  }

  .q-header {
    background-color: #fff;
  }

  .q-toolbar {
    color: $grey-8;
  }
}

.body--dark {
  .q-header {
    background-color: $dark;
  }
}

.mdi-google {
  color: transparent;
  background-image: conic-gradient(from 55deg at 40%, #4285f4 70deg, #0f9d58 70deg 175deg, #f4b400 175deg 255deg, #db4437 255deg 360deg);
  background-clip: text;
}
</style>
