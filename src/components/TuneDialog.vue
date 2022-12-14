<script lang="ts" setup>
// Vue.js
import { reactive, ref } from 'vue';

// Vue Router
import { useRouter } from 'vue-router';

// Amplify
import { API, Storage } from 'aws-amplify';

// Quasar
import { uid, useDialogPluginComponent, useQuasar } from 'quasar';

// emits
defineEmits(useDialogPluginComponent.emitsObject);

// get the dialog plugin component
const {
  dialogRef,
  onDialogHide,
  onDialogOK,
  onDialogCancel,
} = useDialogPluginComponent();

// get the $router object
const $router = useRouter();

// get the $q object
const $q = useQuasar();

// the midi
const midi = ref<File | null>(null);

// the tune
const tune = reactive({
  title: '',
  description: '',
  midi,
});

// upload the tune
const uploadTune = async ({ title, description, midi }: typeof tune) => {
  if (midi === null) {
    return;
  }

  // show loading
  $q.loading.show({ spinnerSize: 46 });

  try {
    // upload the tune
    const { key: midiKey } = await Storage.put(`tunes/${uid()}.mid`, midi, {
      level: 'protected',
    });

    try {
      // register the tune info
      const { id } = await API.post('Api', '/tunes', {
        body: {
          title,
          description,
          midiKey,
        },
      });

      // move to watch route
      await $router.push({ name: 'watch', query: { v: id } });

      // close dialog
      onDialogOK();
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

      // remove the tune
      await Storage.remove(midiKey, {
        level: 'protected',
      });
    }
  } catch {
    //
  }

  // hide loading
  $q.loading.hide();
};
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="full-width" bordered flat square>
      <q-card-section class="text-h6">
        Upload tune
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="column q-gutter-md">
          <q-input v-model="tune.title" label-slot outlined square>
            <template #label>
              Title
            </template>
          </q-input>
          <q-input v-model="tune.description" label-slot outlined square type="textarea">
            <template #label>
              Description
            </template>
          </q-input>
          <q-file v-model="tune.midi" accept=".mid" label-slot outlined square>
            <template #prepend>
              <q-icon name="mdi-file-music" />
            </template>
            <template #label>
              MIDI File
            </template>
          </q-file>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn color="grey-6" flat square @click="onDialogCancel">
          <span class="block">Cancel</span>
        </q-btn>
        <q-btn color="primary" :disable="!Object.values(tune).every(Boolean)" flat square @click="uploadTune(tune)">
          <span class="block">Upload</span>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
