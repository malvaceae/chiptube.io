// AWS SDK - Cognito
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

// AWS SDK - Cognito - Client
export default new CognitoIdentityProviderClient({
  apiVersion: '2016-04-18',
});
