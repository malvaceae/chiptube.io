<script lang="ts" setup>
// Vue.js
import { computed, reactive, ref, watchEffect } from 'vue';

// Vue Router
import { useRouter } from 'vue-router';

// Amplify
import { API, Storage } from 'aws-amplify';

// Midi
import { useMidi } from '@/composables/midi';

// Quasar
import { format, uid, useDialogPluginComponent, useQuasar } from 'quasar';

// properties
const props = defineProps<{ tune?: { id: string, title: string, description: string, midiKey: string, thumbnailKey: string } }>();

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

// the step
const step = ref(props.tune ? 2 : 1);

// the midi file
const midiFile = ref<File | null>(null);

// the midi buffer
const midiBuffer = computed(() => midiFile.value?.arrayBuffer?.());

// the thumbnail file
const thumbnailFile = ref<File | null>(null);

// use midi
const {
  midi,
  title,
  description,
  loadMidi,
} = useMidi();

// the tune
const tune = reactive({
  id: '',
  title: '',
  description: '',
  midiKey: '',
  midiFile,
  thumbnailKey: '',
  thumbnailFile,
});

if (props.tune) {
  Object.assign(tune, props.tune);
}

// watch midi buffer
watchEffect(async () => {
  if (midiBuffer.value) {
    midi.value = null;

    // wait a few moments
    await new Promise((resolve) => setTimeout(resolve, 500));

    // load midi
    await loadMidi(midiBuffer.value);
  }
});

// watch midi
watchEffect(() => {
  if (midi.value) {
    tune.title = title.value;
    tune.description = description.value;
    step.value = 2;
  }
});

// update the tune
const updateTune = async ({ id, title, description, thumbnailKey: oldThumbnailKey, thumbnailFile }: typeof tune) => {
  // show loading
  $q.loading.show({ spinnerSize: 46 });

  try {
    // upload the thumbnail
    const thumbnailKey = await (() => {
      if (thumbnailFile) {
        return Storage.put(`thumbnails/${uid()}${getFileExtension(thumbnailFile.type)}`, thumbnailFile, {
          level: 'protected',
          contentType: thumbnailFile.type,
        }).then(({ key }) => key);
      }
    })();

    try {
      // update the tune info
      const tune = await API.put('Api', `/tunes/${id}`, {
        body: {
          title,
          description,
          thumbnailKey,
        },
      });

      try {
        // remove the old thumbnail
        if (thumbnailKey && oldThumbnailKey) {
          await Storage.remove(oldThumbnailKey, {
            level: 'protected',
          });
        }
      } catch {
        //
      }

      // close dialog
      onDialogOK(tune);
    } catch (e: any) {
      if (e.response.status === 422) {
        $q.notify({
          type: 'negative',
          message: Object.entries(e.response.data.errors as Record<string, string[]>).flatMap(([field, messages]) => {
            return messages.map((message) => `The ${field} ${message}.`);
          }).join('<br>'),
          html: true,
        });

        // remove the thumbnail
        if (thumbnailKey) {
          await Storage.remove(thumbnailKey, {
            level: 'protected',
          });
        }
      }
    }
  } catch (e: any) {
    if (e.message) {
      $q.notify({
        type: 'negative',
        message: e.message,
        html: true,
      });
    }
  }

  // hide loading
  $q.loading.hide();
};

// upload the tune
const uploadTune = async ({ title, description, midiFile, thumbnailFile }: typeof tune) => {
  if (midiFile === null) {
    return;
  }

  // show loading
  $q.loading.show({ spinnerSize: 46 });

  try {
    // upload the tune
    const { key: midiKey } = await Storage.put(`tunes/${uid()}.mid`, midiFile, {
      level: 'protected',
      contentType: 'audio/midi',
    });

    try {
      // upload the thumbnail
      const thumbnailKey = await (() => {
        if (thumbnailFile) {
          return Storage.put(`thumbnails/${uid()}${getFileExtension(thumbnailFile.type)}`, thumbnailFile, {
            level: 'protected',
            contentType: thumbnailFile.type,
          }).then(({ key }) => key);
        }
      })();

      try {
        // register the tune info
        const { id } = await API.post('Api', '/tunes', {
          body: {
            title,
            description,
            midiKey,
            thumbnailKey,
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

        // remove the thumbnail
        if (thumbnailKey) {
          await Storage.remove(thumbnailKey, {
            level: 'protected',
          });
        }
      }
    } catch (e: any) {
      if (e.message) {
        $q.notify({
          type: 'negative',
          message: e.message,
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

// delete the tune
const deleteTune = async ({ id, midiKey, thumbnailKey }: typeof tune) => {
  try {
    await new Promise((resolve, reject) => {
      $q.dialog({
        class: 'no-shadow',
        title: 'Confirm',
        message: 'Are you sure you want to delete this tune?',
        ok: {
          color: 'negative',
          flat: true,
          label: 'Delete',
          square: true,
        },
        cancel: {
          color: 'grey-6',
          flat: true,
          square: true,
        },
        focus: 'none',
      }).onOk(resolve).onCancel(reject);
    });

    // show loading
    $q.loading.show({ spinnerSize: 46 });

    try {
      // delete the tune info
      await API.del('Api', `/tunes/${id}`, {
        //
      });

      try {
        // remove the tune
        await Storage.remove(midiKey, {
          level: 'protected',
        });
      } catch {
        //
      }

      try {
        // remove the thumbnail
        if (thumbnailKey) {
          await Storage.remove(thumbnailKey, {
            level: 'protected',
          });
        }
      } catch {
        //
      }

      // move to index route
      await $router.replace({ name: 'index' });

      // close dialog
      onDialogHide();
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
  } catch {
    //
  }
};

// get file extension
const getFileExtension = (mime: string) => {
  switch (mime) {
    case 'image/gif':
      return '.gif';
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    default:
      throw Error('Please choose image files only.');
  }
};
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card bordered flat square style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ props.tune ? 'Edit' : 'Upload' }} tune
        </div>
        <q-space />
        <q-btn dense flat round v-close-popup>
          <q-icon name="mdi-close" />
        </q-btn>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-stepper v-model="step" animated :contracted="$q.screen.lt.sm" flat>
          <q-step active-icon="mdi-file-music" icon="mdi-file-music" :name="1" title="MIDI">
            <q-file v-model="midiFile" accept=".mid" input-class="invisible" input-style="height: 325px;" outlined square>
              <div class="full-width absolute-center text-center text-subtitle1 no-pointer-events">
                <template v-if="midiFile">
                  <template v-if="midi">
                    {{ midiFile.name }} ({{ format.humanStorageSize(midiFile.size) }})
                  </template>
                  <template v-else>
                    <q-circular-progress indeterminate rounded size="50px" />
                  </template>
                </template>
                <template v-else>
                  Drag and drop MIDI file to upload
                </template>
              </div>
            </q-file>
          </q-step>
          <q-step active-icon="mdi-pencil" icon="mdi-pencil" :name="2" title="Details">
            <div class="column q-gutter-md">
              <div class="text-h6">
                Details
              </div>
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
              <q-file v-model="thumbnailFile" accept=".gif,.jpeg,.jpg,.png" clearable label-slot outlined square>
                <template #prepend>
                  <q-icon name="mdi-file-image" />
                </template>
                <template #label>
                  Thumbnail
                </template>
              </q-file>
            </div>
          </q-step>
          <q-step active-icon="mdi-check" icon="mdi-check" :name="3" title="Confirm">
            <div class="column q-gutter-md">
              <div class="text-h6">
                Confirm
              </div>
              <q-input label-slot :model-value="tune.title" outlined readonly square>
                <template #label>
                  Title
                </template>
              </q-input>
              <q-input label-slot :model-value="tune.description" outlined readonly square type="textarea">
                <template #label>
                  Description
                </template>
              </q-input>
              <q-input label-slot :model-value="thumbnailFile?.name" outlined readonly square>
                <template #prepend>
                  <q-icon name="mdi-file-image" />
                </template>
                <template #label>
                  Thumbnail
                </template>
              </q-input>
            </div>
          </q-step>
        </q-stepper>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <template v-if="step === 1">
          <q-btn color="grey-6" flat square @click="onDialogCancel">
            <span class="block">Cancel</span>
          </q-btn>
          <q-btn color="primary" :disable="!midi" flat square @click="step = 2">
            <span class="block">Continue</span>
          </q-btn>
        </template>
        <template v-if="step === 2">
          <template v-if="props.tune">
            <q-btn color="negative" flat square @click="deleteTune(tune)">
              <span class="block">Delete</span>
            </q-btn>
            <q-space />
            <q-btn color="grey-6" flat square @click="onDialogCancel">
              <span class="block">Cancel</span>
            </q-btn>
          </template>
          <template v-else>
            <q-btn color="grey-6" flat square @click="step = 1">
              <span class="block">Back</span>
            </q-btn>
          </template>
          <q-btn color="primary" :disable="!tune.title || !tune.description" flat square @click="step = 3">
            <span class="block">Continue</span>
          </q-btn>
        </template>
        <template v-if="step === 3">
          <q-btn color="grey-6" flat square @click="step = 2">
            <span class="block">Back</span>
          </q-btn>
          <q-btn color="primary" flat square @click="props.tune ? updateTune(tune) : uploadTune(tune)">
            <span class="block">{{ props.tune ? 'Update' : 'Upload' }}</span>
          </q-btn>
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped>
:deep(.q-stepper__step-inner) {
  padding-top: 0;
}
</style>
