<script lang="ts" setup>
// Vue.js
import { ref, toRefs } from 'vue';

// Auth Store
import { useAuthStore } from '@/stores/auth';

// Amplify
import { API } from 'aws-amplify';

// Quasar
import { date, useQuasar } from 'quasar';

// properties
const props = defineProps<{ id: string }>();

// get the tune id
const { id } = toRefs(props);

// emits
const emits = defineEmits<{
  (e: 'update'): void;
}>();

// get the auth store
const auth = useAuthStore();

// get the $q object
const $q = useQuasar();

// the scroll target
const scrollTarget = ref<HTMLElement>();

// is loading
const isLoading = ref(true);

// comments
const comments = ref<Record<string, any>[]>([]);

// the after token
const after = ref<string>();

// get comments
const getComments = async (_: number, done: (stop?: boolean) => void) => {
  // start loading
  isLoading.value = true;

  // get comments
  const data = await API.get('Api', `/tunes/${id.value}/comments`, {
    queryStringParameters: {
      after: after.value,
    },
  });

  // add comments
  comments.value.push(...data.comments);

  // update the after token
  after.value = data.after;

  // complete updates
  done(!after.value);

  // stop loading
  isLoading.value = false;
};

// the comment text
const text = ref('');

// register the comment
const registerComment = async () => {
  if (!auth.user || !text.value) {
    return;
  }

  // show loading
  $q.loading.show({ spinnerSize: 46 });

  try {
    // register the comment
    const comment = await API.post('Api', `/tunes/${id.value}/comments`, {
      body: {
        text: text.value,
      },
    });

    // add the comment
    comments.value.unshift(comment);

    // reset the comment text
    text.value = '';

    // emit update
    emits('update');
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
  <template v-if="!isLoading || comments.length > 0">
    <q-list class="q-pb-sm">
      <q-item>
        <q-item-section avatar top>
          <q-avatar>
            <template v-if="auth.user">
              <img :src="auth.user.picture">
            </template>
            <template v-else>
              <q-icon name="mdi-account-circle" size="40px" />
            </template>
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-input v-model="text" autogrow dense :disable="!auth.user" placeholder="Add a comment..." type="textarea">
            <template #after>
              <q-btn :disable="!/\S/.test(text)" flat round @click="registerComment">
                <q-icon name="mdi-send" />
              </q-btn>
            </template>
          </q-input>
        </q-item-section>
      </q-item>
    </q-list>
  </template>
  <q-infinite-scroll :offset="250" :scroll-target="scrollTarget" @load="getComments">
    <q-list ref="scrollTarget" class="q-gutter-sm">
      <q-item v-for="comment in comments">
        <q-item-section avatar top>
          <q-avatar>
            <img :src="comment.user.picture">
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="row items-center q-gutter-xs">
            <div class="text-weight-bold">
              {{ comment.user.nickname }}
            </div>
            <div class="text-caption">
              {{ date.formatDate(comment.publishedAt, 'MMM D, YYYY') }}
            </div>
          </q-item-label>
          <q-item-label :style="{ whiteSpace: 'pre-wrap' }">
            <template v-for="line in comment.text.split(/(?=\n)/)">
              <template v-for="text in line.split(/(?=https?:\/\/[!#-;=?-[\]_a-z~]+)|(?![!#-;=?-[\]_a-z~])/)">
                <template v-if="/^https?:\/\/[!#-;=?-[\]_a-z~]+$/.test(text)">
                  <a :href="text" rel="ugc nofollow" target="_blank">
                    {{ text }}
                  </a>
                </template>
                <template v-else>
                  {{ text }}
                </template>
              </template>
            </template>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <template #loading>
      <q-list class="q-gutter-sm">
        <q-item v-for="_ in 24">
          <q-item-section avatar top>
            <q-avatar>
              <q-skeleton animation="none" type="QAvatar" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton animation="none" type="text" width="35%" />
            </q-item-label>
            <q-item-label>
              <q-skeleton animation="none" type="text" />
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </q-infinite-scroll>
</template>

<style lang="scss" scoped>
a:not(.q-link) {
  color: $blue;
}

a:not(.q-link):visited {
  color: $purple;
}
</style>
