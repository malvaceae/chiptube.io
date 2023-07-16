// AWS CDK
import {
  App,
  Stack,
  aws_certificatemanager as acm,
  aws_route53 as route53,
} from 'aws-cdk-lib';

// ChipTube Stack
import { ChipTubeStack } from '@/stack';

// CDK App
const app = new App();

// AWS Environment
const env = Object.fromEntries(['account', 'region'].map((key) => {
  return [key, process.env[`CDK_DEFAULT_${key.toUpperCase()}`]];
}));

// Context Values
const [googleClientId, googleClientSecret, feedbackEmail, domainName] = [
  app.node.getContext('googleClientId'),
  app.node.getContext('googleClientSecret'),
  app.node.tryGetContext('feedbackEmail'),
  app.node.tryGetContext('domainName'),
];

// If the domain name exists, create ACM resource in us-east-1.
const [zone, certificate, domainNames] = (() => {
  if (domainName) {
    // ChipTube Certificate Stack
    const stack = new Stack(app, 'ChipTube-CertificateStack', {
      env: {
        ...env,
        region: 'us-east-1',
      },
      crossRegionReferences: true,
    });

    // Hosted Zone
    const hostedZone = route53.HostedZone.fromLookup(stack, 'HostedZone', {
      domainName,
    });

    // Certificate
    const certificate = new acm.Certificate(stack, 'Certificate', {
      domainName,
      subjectAlternativeNames: [
        `*.${domainName}`,
      ],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    return [hostedZone, certificate, [domainName]];
  } else {
    return [];
  }
})();

// ChipTube Stack
new ChipTubeStack(app, 'ChipTube', {
  env,
  crossRegionReferences: true,
  googleClientId,
  googleClientSecret,
  feedbackEmail,
  domainName,
  zone,
  certificate,
  domainNames,
});
