<script lang="ts" setup>
// Vue.js
import { ref } from 'vue';

// Auth Store
import { useAuthStore } from '@/stores/auth';

// Amplify
import { API, Auth } from 'aws-amplify';

// Quasar
import { useMeta, useQuasar } from 'quasar';

// use meta
useMeta({
  title: 'ChipTube',
  titleTemplate: (title) => title,
  meta: {
    description: {
      content: 'Enjoy the tunes you love, upload original MIDI file, and share it all with friends, family, and the world on ChipTube.',
    },
  },
});

// get the auth store
const auth = useAuthStore();

// get the $q object
const $q = useQuasar();

// the user nickname
const nickname = ref(auth.user?.nickname);

// update the user
const updateUser = async () => {
  if (auth.user && nickname.value && !Object.is(auth.user.nickname, nickname.value) && !$q.loading.isActive) {
    // show loading
    $q.loading.show({ spinnerSize: 46 });

    try {
      // update the user
      await API.put('Api', '/users/me', {
        body: {
          nickname: nickname.value,
        },
      });

      // update user attributes
      await Auth.updateUserAttributes(await Auth.currentAuthenticatedUser(), {
        //
      });

      // get the current user
      auth.user = (await Auth.currentAuthenticatedUser()).attributes;
    } catch (e: any) {
      if (e.response.status === 422) {
        $q.notify({
          type: 'negative',
          message: Object.entries(e.response.data.errors as Record<string, string[]>).flatMap(([field, messages]) => {
            return messages.map((message) => `The ${field} ${message}.`);
          }).join('<br>'),
          html: true,
        });
      }
    }

    // hide loading
    $q.loading.hide();
  }
};
</script>

<template>
  <q-page padding>
    <div class="row q-col-gutter-lg">
      <div class="col col-shrink">
        <q-list dense>
          <q-item-label class="text-h6" header>
            Settings
          </q-item-label>
          <q-item class="rounded-borders" :active-class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-4'" :to="{}">
            <q-item-section>
              Account
            </q-item-section>
          </q-item>
        </q-list>
      </div>
      <div class="col col-grow">
        <q-card flat square>
          <q-card-section>
            <div class="q-mb-lg text-subtitle1 text-weight-medium">
              Account
            </div>
            <div class="q-mb-sm text-h6">
              Choose how you appear and what you see on ChipTube
            </div>
            <div class="q-mb-lg">
              Signed in as {{ auth.user?.email }}
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            <div class="q-mb-sm text-subtitle1 text-weight-medium">
              Your account
            </div>
            <div class="q-mb-lg">
              You sign in to ChipTube with your Google Account
            </div>
            <div class="column q-gutter-md text-weight-medium">
              <div class="row items-center q-gutter-sm">
                <div class="col-12 col-md-2">
                  User ID
                </div>
                <div class="col">
                  <q-input label-slot :model-value="auth.user?.sub" outlined readonly square>
                    <template #label>
                      User ID
                    </template>
                  </q-input>
                </div>
              </div>
              <div class="row items-center q-gutter-sm">
                <div class="col-12 col-md-2">
                  Email
                </div>
                <div class="col">
                  <q-input label-slot :model-value="auth.user?.email" outlined readonly square>
                    <template #label>
                      Email
                    </template>
                  </q-input>
                </div>
              </div>
              <div class="row items-center q-gutter-sm">
                <div class="col-12 col-md-2">
                  Name
                </div>
                <div class="col">
                  <q-input label-slot :model-value="auth.user?.name" outlined readonly square>
                    <template #label>
                      Name
                    </template>
                  </q-input>
                </div>
              </div>
              <div class="row items-center q-gutter-sm">
                <div class="col-12 col-md-2">
                  Nickname
                </div>
                <div class="col">
                  <q-input v-model="nickname" label-slot outlined square @blur="updateUser" @keyup.enter="updateUser">
                    <template #label>
                      Nickname
                    </template>
                  </q-input>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.row .col:first-of-type {
  flex-basis: 240px;
}

.row .col .q-list .q-item {
  padding: 8px 16px;
}

.row .col .q-list .q-item__label--header {
  padding: 0 8px 16px;
}
</style>
