// Amplify
import { Amplify } from 'aws-amplify';

// environment variables
const [endpoint, bucket, identityPoolId, userPoolId, userPoolWebClientId, domain, region] = [
  import.meta.env.VITE_API_ENDPOINT,
  import.meta.env.VITE_APP_STORAGE_BUCKET_NAME,
  import.meta.env.VITE_IDENTITY_POOL_ID,
  import.meta.env.VITE_USER_POOL_ID,
  import.meta.env.VITE_USER_POOL_WEB_CLIENT_ID,
  import.meta.env.VITE_USER_POOL_DOMAIN_NAME,
  'ap-northeast-1',
];

// redirect uris
const { redirectSignIn, redirectSignOut } = Object.fromEntries(['redirectSignIn', 'redirectSignOut'].map((key) => {
  return [key, `${location.protocol}//${location.host.replace(/^(127(\.[0-9]{1,3}){3}|\[::1\])/, 'localhost')}`];
}));

// configure
Amplify.configure({
  Auth: {
    identityPoolId,
    region,
    userPoolId,
    userPoolWebClientId,
    oauth: {
      domain,
      scope: [
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
  API: {
    endpoints: [
      {
        name: 'V1',
        endpoint,
        region,
      },
    ],
  },
  Storage: {
    AWSS3: {
      bucket,
      region,
    },
  },
});
