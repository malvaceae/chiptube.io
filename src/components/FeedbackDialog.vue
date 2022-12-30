<script lang="ts" setup>
// Vue.js
import { ref } from 'vue';

// Amplify
import { API } from 'aws-amplify';

// Quasar
import { useDialogPluginComponent, useQuasar } from 'quasar';

// emits
defineEmits(useDialogPluginComponent.emitsObject);

// get the dialog plugin component
const {
  dialogRef,
  onDialogHide,
  onDialogOK,
  onDialogCancel,
} = useDialogPluginComponent();

// get the $q object
const $q = useQuasar();

// the feedback text
const text = ref('');

// send the feedback
const sendFeedback = async () => {
  if (!text.value) {
    return;
  }

  // show loading
  $q.loading.show({ spinnerSize: 46 });

  try {
    // send the feedback
    await API.post('Api', '/feedback', {
      body: {
        text: text.value,
      },
    });

    // notify the feedback has been successfully sent
    $q.notify({ type: 'positive', message: 'Report sent, thank you!' });

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
  }

  // hide loading
  $q.loading.hide();
};
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="full-width" bordered flat square>
      <q-card-section class="text-h6">
        Send feedback to ChipTube
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="column q-gutter-md">
          <div>
            Describe your issue or suggestion
          </div>
          <q-input v-model="text" bottom-slots label-slot outlined square type="textarea">
            <template #label>
              Tell us how we can improve our product
            </template>
            <template #hint>
              Please don't include any sensitive information
            </template>
          </q-input>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn color="grey-6" flat square @click="onDialogCancel">
          <span class="block">Cancel</span>
        </q-btn>
        <q-btn color="primary" :disable="!/\S/.test(text)" flat square @click="sendFeedback">
          <span class="block">Send</span>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped>
:deep(.q-field__bottom) {
  padding: 8px 2px 0;
}
</style>
