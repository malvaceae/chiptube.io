// Node.js Core Modules
import { spawnSync } from 'child_process';

// AWS CDK
import {
  App,
  DockerImage,
  RemovalPolicy,
  Stack,
  StackProps,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_iam as iam,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
} from 'aws-cdk-lib';

// Constructs
import { Construct } from 'constructs';

/**
 * A root construct which represents a single CloudFormation stack.
 */
class ChipTubeStack extends Stack {
  /**
   * Creates a new stack.
   *
   * @param scope Parent of this stack, usually an `App` or a `Stage`, but could be any construct.
   * @param id The construct ID of this stack. If `stackName` is not explicitly
   * defined, this id (and any parent IDs) will be used to determine the
   * physical ID of the stack.
   * @param props Stack properties.
   */
  constructor(scope?: Construct, id?: string, props?: StackProps) {
    super(scope, id, props);

    // App Bucket
    const appBucket = new s3.Bucket(this, 'AppBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: `access-identity-${appBucket.bucketRegionalDomainName}`,
    });

    // Add the permission to access CloudFront.
    appBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
      ],
      principals: [
        new iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId),
      ],
      resources: [
        appBucket.arnForObjects('*'),
      ],
    }));

    // App Distribution
    const appDistribution = new cloudfront.Distribution(this, 'AppDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(appBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/',
        },
      ],
    });

    // App Bucket Deployment
    new s3deploy.BucketDeployment(this, 'AppBucketDeployment', {
      sources: [
        s3deploy.Source.asset('.', {
          bundling: {
            image: DockerImage.fromRegistry('node:alpine'),
            local: {
              tryBundle(outputDir: string) {
                return !spawnSync('yarn && yarn', [
                  'build', '--outDir', outputDir,
                ], { shell: true }).error;
              },
            },
          },
        }),
      ],
      destinationBucket: appBucket,
      distribution: appDistribution,
    });
  }
}

const app = new App();
new ChipTubeStack(app, 'ChipTube', {
  env: { region: 'ap-northeast-1' },
});
