<script lang="ts" setup>
// Amplify
import { Auth, CognitoHostedUIIdentityProvider } from '@aws-amplify/auth';

// Sign In
const signIn = async () => await Auth.federatedSignIn({
  provider: CognitoHostedUIIdentityProvider.Google,
});
</script>

<template>
  <q-btn no-wrap outline padding="6px 12px" square @click="signIn">
    <q-icon class="q-mr-sm" name="mdi-google" />
    <span class="block">Sign in</span>
  </q-btn>
</template>

<style lang="scss" scoped>
.mdi-google {
  color: transparent;
  background-image: conic-gradient(from 55deg at 40%, #4285f4 70deg, #0f9d58 70deg 175deg, #f4b400 175deg 255deg, #db4437 255deg 360deg);
  background-clip: text;
}
</style>
