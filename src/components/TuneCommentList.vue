<script lang="ts" setup>
// Vue.js
import { ref, toRefs } from 'vue';

// Auth Store
import { useAuthStore } from '@/stores/auth';

// Amplify - API
import { get, post } from 'aws-amplify/api';

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
  const data = await get({
    apiName: 'Api',
    path: `/tunes/${id.value}/comments`,
    options: {
      queryParams: {
        after: after.value ?? '',
      },
    },
  }).response.then<Record<string, any>>(({ body }) => body.json());

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
    const comment = await post({
      apiName: 'Api',
      path: `/tunes/${id.value}/comments`,
      options: {
        body: {
          text: text.value,
        },
      },
    }).response.then<Record<string, any>>(({ body }) => body.json());

    // add the comment
    comments.value.unshift(comment);

    // reset the comment text
    text.value = '';

    // emit update
    emits('update');
  } catch (e: any) {
    if (e.message) {
      $q.notify({
        type: 'negative',
        message: e.message.replaceAll('\n', '<br>'),
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
              <img :src="auth.user.picture" referrerpolicy="no-referrer">
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
  <q-infinite-scroll :offset="250" @load="getComments">
    <q-list class="q-gutter-sm">
      <q-item v-for="comment in comments">
        <router-link :to="{ name: 'users-id', params: { id: comment.user.id } }">
          <q-item-section avatar top>
            <q-avatar>
              <img :src="comment.user.picture" referrerpolicy="no-referrer">
            </q-avatar>
          </q-item-section>
        </router-link>
        <q-item-section>
          <q-item-label class="row items-center q-gutter-xs">
            <div class="text-weight-bold" :style="{ wordBreak: 'break-all' }">
              <router-link :to="{ name: 'users-id', params: { id: comment.user.id } }">
                {{ comment.user.nickname }}
              </router-link>
            </div>
            <div class="text-caption">
              {{ date.formatDate(comment.publishedAt, 'MMM D, YYYY') }}
            </div>
          </q-item-label>
          <q-item-label :style="{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }">
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
      <div class="row justify-center q-my-md">
        <q-spinner-dots size="lg" />
      </div>
    </template>
  </q-infinite-scroll>
</template>

<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: none;
}

a[target="_blank"] {
  color: $blue;
  text-decoration: underline;
}

a[target="_blank"]:visited {
  color: $purple;
}
</style>
