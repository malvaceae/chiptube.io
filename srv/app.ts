// Node.js Core Modules
import { join } from 'path';

// AWS CDK
import {
  App,
  IgnoreMode,
  RemovalPolicy,
  Stack,
  StackProps,
  aws_cloudformation as cloudformation,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_codebuild as codebuild,
  aws_iam as iam,
  aws_s3 as s3,
  aws_s3_assets as assets,
  aws_s3_deployment as s3deploy,
  custom_resources as cr,
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

    // App Asset
    const appAsset = new assets.Asset(this, 'AppAsset', {
      path: join(__dirname, '..'),
      exclude: [
        '/*',
        '!index.html',
        '!package.json',
        '!postcss.config.js',
        '!src',
        '!tsconfig.json',
        '!vite.config.ts',
        '!yarn.lock',
      ],
      ignoreMode: IgnoreMode.GIT,
    });

    // App Project
    const appProject = new codebuild.Project(this, 'AppProject', {
      source: codebuild.Source.s3({
        bucket: appAsset.bucket,
        path: appAsset.s3ObjectKey,
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_6_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'on-failure': 'CONTINUE',
            'runtime-versions': {
              nodejs: 'latest',
            },
          },
          pre_build: {
            'on-failure': 'CONTINUE',
            commands: [
              'yarn',
            ],
          },
          build: {
            commands: [
              'yarn build',
            ],
          },
          post_build: {
            commands: [
              'curl -X PUT -H "Content-Type:" --data-binary "{\\"Status\\":\\"$([ ${CODEBUILD_BUILD_SUCCEEDING} = 1 ] && echo SUCCESS || echo FAILURE)\\",\\"UniqueId\\":\\"${CODEBUILD_BUILD_ID}\\"}" "${SIGNAL_URL}"',
            ],
          },
        },
        artifacts: {
          files: [
            '**/*',
          ],
          'base-directory': 'dist',
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: appAsset.bucket,
        path: appAsset.assetHash,
        name: 'artifacts.zip',
        includeBuildId: false,
      }),
    });

    // App Build Wait Condition
    const appBuildWaitCondition = new cloudformation.CfnWaitCondition(this, `AppBuildWaitCondition-${appAsset.assetHash}`, {
      handle: new cloudformation.CfnWaitConditionHandle(this, `AppBuildWaitConditionHandle-${appAsset.assetHash}`).ref,
      timeout: '3600',
    });

    // App Build
    new cr.AwsCustomResource(this, 'AppBuild', {
      onUpdate: {
        service: 'CodeBuild',
        action: 'startBuild',
        parameters: {
          environmentVariablesOverride: [
            {
              name: 'SIGNAL_URL',
              value: appBuildWaitCondition.handle,
            },
          ],
          projectName: appProject.projectName,
        },
        physicalResourceId: cr.PhysicalResourceId.of(appProject.projectArn),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [
          appProject.projectArn,
        ],
      }),
    });

    // App Bucket Deployment
    const appBucketDeployment = new s3deploy.BucketDeployment(this, 'AppBucketDeployment', {
      sources: [
        s3deploy.Source.bucket(appAsset.bucket, `${appAsset.assetHash}/artifacts.zip`),
      ],
      destinationBucket: appBucket,
      distribution: appDistribution,
    });

    // Wait for the build to complete.
    appBucketDeployment.node.addDependency(appBuildWaitCondition);
  }
}

const app = new App();
new ChipTubeStack(app, 'ChipTube', {
  env: { region: 'ap-northeast-1' },
});
