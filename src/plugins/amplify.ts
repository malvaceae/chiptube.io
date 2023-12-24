// Amplify
import { Amplify } from 'aws-amplify';

// environment variables
const [endpoint, bucket, identityPoolId, userPoolId, userPoolClientId, domain, region] = [
  import.meta.env.VITE_API_ENDPOINT,
  import.meta.env.VITE_APP_STORAGE_BUCKET_NAME,
  import.meta.env.VITE_IDENTITY_POOL_ID,
  import.meta.env.VITE_USER_POOL_ID,
  import.meta.env.VITE_USER_POOL_CLIENT_ID,
  import.meta.env.VITE_USER_POOL_DOMAIN_NAME,
  'ap-northeast-1',
];

// redirect uris
const { redirectSignIn, redirectSignOut } = Object.fromEntries(['redirectSignIn', 'redirectSignOut'].map((key) => {
  return [key, [`${location.protocol}//${location.host.replace(/^(127(\.[0-9]{1,3}){3}|\[::1\])/, 'localhost')}`]];
}));

// configure
Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId,
      userPoolId,
      userPoolClientId,
      allowGuestAccess: true,
      loginWith: {
        oauth: {
          domain,
          scopes: [
            'email',
            'openid',
            'profile',
            'aws.cognito.signin.user.admin',
          ],
          redirectSignIn,
          redirectSignOut,
          responseType: 'code',
        },
      },
    },
  },
  API: {
    REST: {
      Api: {
        endpoint,
        region,
      },
    },
  },
  Storage: {
    S3: {
      bucket,
      region,
    },
  },
});
