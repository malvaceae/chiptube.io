// AWS CDK
import {
  CfnOutput,
  CustomResource,
  Duration,
  IgnoreMode,
  SecretValue,
  Stack,
  StackProps,
  aws_apigateway as apigateway,
  aws_certificatemanager as acm,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_codebuild as codebuild,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejs,
  aws_route53 as route53,
  aws_route53_targets as targets,
  aws_s3 as s3,
  aws_s3_assets as assets,
  aws_s3_deployment as s3deploy,
  aws_sns as sns,
  aws_sns_subscriptions as subscriptions,
  custom_resources as cr,
} from 'aws-cdk-lib';

// Constructs
import { Construct } from 'constructs';

// ChipTube Api
import { ChipTubeApi } from '@/api';

/**
 * ChipTube Stack Properties
 */
export interface ChipTubeStackProps extends StackProps {
  /**
   * Google Client Id
   */
  readonly googleClientId: string;

  /**
   * Google Client Secret
   */
  readonly googleClientSecret: string;

  /**
   * Feedback Email
   */
  readonly feedbackEmail?: string;

  /**
   * Domain Name
   */
  readonly domainName?: string;

  /**
   * GitHub Repository Name
   */
  readonly githubRepo?: string;

  /**
   * Hosted Zone
   */
  readonly zone?: route53.IHostedZone;

  /**
   * Certificate
   */
  readonly certificate?: acm.ICertificate;

  /**
   * Domain Names
   */
  readonly domainNames?: string[];
}

/**
 * ChipTube Stack Construct
 */
export class ChipTubeStack extends Stack {
  /**
   * Creates a new stack.
   *
   * @param scope Parent of this stack, usually an `App` or a `Stage`, but could be any construct.
   * @param id The construct ID of this stack. If `stackName` is not explicitly
   * defined, this id (and any parent IDs) will be used to determine the
   * physical ID of the stack.
   * @param props Stack properties.
   */
  constructor(scope: Construct, id: string, props: ChipTubeStackProps) {
    super(scope, id, props);

    // Stack Properties
    const {
      googleClientId,
      googleClientSecret,
      feedbackEmail,
      domainName,
      githubRepo,
      zone,
      certificate,
      domainNames,
    } = props;

    // App Table
    const appTable = new dynamodb.Table(this, 'AppTable', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    // Add the GSI for adjacency list.
    appTable.addGlobalSecondaryIndex({
      indexName: 'GSI-AdjacencyList',
      partitionKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Add the LSI for published at.
    appTable.addLocalSecondaryIndex({
      indexName: 'LSI-PublishedAt',
      sortKey: {
        name: 'publishedAt',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // Add the LSI for views.
    appTable.addLocalSecondaryIndex({
      indexName: 'LSI-Views',
      sortKey: {
        name: 'views',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // Add the LSI for likes.
    appTable.addLocalSecondaryIndex({
      indexName: 'LSI-Likes',
      sortKey: {
        name: 'likes',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // Add the LSI for favorites.
    appTable.addLocalSecondaryIndex({
      indexName: 'LSI-Favorites',
      sortKey: {
        name: 'favorites',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // Add the LSI for comments.
    appTable.addLocalSecondaryIndex({
      indexName: 'LSI-Comments',
      sortKey: {
        name: 'comments',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // App Storage
    const appStorage = new s3.Bucket(this, 'AppStorage', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          maxAge: 86400,
          allowedHeaders: [
            '*',
          ],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: [
            '*',
          ],
          exposedHeaders: [
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
            'ETag',
          ],
        },
      ],
    });

    // App Storage Bucket Name
    new CfnOutput(this, 'AppStorageBucketName', {
      value: appStorage.bucketName,
    });

    // Api
    const api = new ChipTubeApi(this, 'Api');

    // Add environment variable for access App Table.
    api.handler.addEnvironment('APP_TABLE_NAME', appTable.tableName);

    // Add permissions to access App Table.
    appTable.grantReadWriteData(api.handler);

    // Add environment variable for access App Storage.
    api.handler.addEnvironment('APP_STORAGE_BUCKET_NAME', appStorage.bucketName);

    // Add permissions to access App Storage.
    appStorage.grantRead(api.handler);

    // If the domain name exists, create a alias record to Api.
    const apiEndpoint = (() => {
      if (zone && certificate) {
        // Api Domain Name
        const apiDomainName = api.addDomainName('DomainName', {
          domainName: `api.${domainName}`,
          certificate,
          endpointType: apigateway.EndpointType.EDGE,
        });

        // Api Domain Alias Record Target
        const target = route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(apiDomainName));

        // Api Domain Alias Record
        new route53.ARecord(this, 'ApiDomainAliasRecord', {
          zone,
          target,
          recordName: 'api',
        });

        return `https://${apiDomainName.domainName}`;
      } else {
        return api.url.replace(/\/$/, '');
      }
    })();

    // Api Endpoint
    new CfnOutput(this, 'ApiEndpoint', {
      value: apiEndpoint,
    });

    // App Bucket
    const appBucket = new s3.Bucket(this, 'AppBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
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
      certificate,
      defaultRootObject: 'index.html',
      domainNames,
      errorResponses: [
        {
          httpStatus: 403,
          ttl: Duration.days(1),
          responseHttpStatus: 200,
          responsePagePath: '/',
        },
        {
          httpStatus: 404,
          ttl: Duration.days(1),
          responseHttpStatus: 200,
          responsePagePath: '/',
        },
      ],
    });

    // If the domain name exists, create a alias record to App Distribution.
    const appDistributionAliasRecord = (() => {
      if (zone) {
        // App Distribution Alias Record Target
        const target = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(appDistribution));

        // App Distribution Alias Record
        return new route53.ARecord(this, 'AppDistributionAliasRecord', {
          zone,
          target,
        });
      }
    })();

    // User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      standardAttributes: {
        email: {
          required: true,
        },
        fullname: {
          required: true,
        },
        profilePicture: {
          required: true,
        },
      },
    });

    // Add permissions to access User Pool.
    userPool.grant(api.handler, 'cognito-idp:AdminUpdateUserAttributes');

    // User Pool Signed In Trigger
    const userPoolSignedInTrigger = new nodejs.NodejsFunction(this, 'UserPoolSignedInTrigger', {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(30),
      memorySize: 1769, // 1 vCPU
      environment: {
        APP_TABLE_NAME: appTable.tableName,
      },
      bundling: {
        minify: true,
      },
    });

    // Add permissions to access App Table.
    appTable.grantWriteData(userPoolSignedInTrigger);

    // Add permissions to access User Pool.
    userPoolSignedInTrigger.role?.attachInlinePolicy?.(new iam.Policy(this, 'UserPoolSignedInTriggerServiceRolePolicy', {
      statements: [
        new iam.PolicyStatement({
          actions: [
            'cognito-idp:AdminUpdateUserAttributes',
          ],
          resources: [
            userPool.userPoolArn,
          ],
        }),
      ],
    }));

    // Add lambda triggers to User Pool.
    [cognito.UserPoolOperation.POST_AUTHENTICATION, cognito.UserPoolOperation.POST_CONFIRMATION].forEach((operation) => {
      userPool.addTrigger(operation, userPoolSignedInTrigger);
    });

    // User Pool Id
    new CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });

    // callback urls and logout urls
    const { callbackUrls, logoutUrls } = Object.fromEntries(['callbackUrls', 'logoutUrls'].map((key) => {
      if (domainName) {
        return [key, [
          `https://${domainName}`,
        ]];
      } else {
        return [key, [
          'http://localhost:5173',
          `https://${appDistribution.domainName}`,
        ]];
      }
    }));

    // User Pool Web Client
    const userPoolWebClient = userPool.addClient('WebClient', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls,
        logoutUrls,
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.COGNITO_ADMIN,
        ],
      },
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
    });

    // User Pool Web Client Id
    new CfnOutput(this, 'UserPoolWebClientId', {
      value: userPoolWebClient.userPoolClientId,
    });

    // Create a user pool domain with the domain name if it exists.
    const userPoolDomain = (() => {
      if (zone && certificate && appDistributionAliasRecord) {
        // User Pool Domain
        const userPoolDomain = userPool.addDomain('Domain', {
          customDomain: {
            domainName: `auth.${domainName}`,
            certificate,
          },
        });

        // Wait for the App Distribution Alias Record to create.
        userPoolDomain.node.addDependency(appDistributionAliasRecord);

        // User Pool Domain Alias Record Target
        const target = route53.RecordTarget.fromAlias(new targets.UserPoolDomainTarget(userPoolDomain));

        // User Pool Domain Alias Record
        new route53.ARecord(this, 'UserPoolDomainAliasRecord', {
          zone,
          target,
          recordName: 'auth',
        });

        return userPoolDomain;
      } else {
        // User Pool Domain
        return userPool.addDomain('Domain', {
          cognitoDomain: {
            domainPrefix: api.restApiId,
          },
        });
      }
    })();

    // User Pool Domain Name
    new CfnOutput(this, 'UserPoolDomainName', {
      value: userPoolDomain.baseUrl().slice(8),
    });

    // User Pool Identity Provider Google
    new cognito.UserPoolIdentityProviderGoogle(this, 'UserPoolIdentityProviderGoogle', {
      userPool,
      clientId: googleClientId,
      clientSecretValue: SecretValue.unsafePlainText(googleClientSecret),
      scopes: [
        'profile',
        'email',
        'openid',
      ],
      attributeMapping: {
        email: {
          attributeName: 'email',
        },
        fullname: {
          attributeName: 'name',
        },
        profilePicture: {
          attributeName: 'picture',
        },
        custom: {
          email_verified: {
            attributeName: 'email_verified',
          },
        },
      },
    });

    // Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: userPoolWebClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    // Identity Pool Id
    new CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref,
    });

    // Identity Pool Authenticated Role
    const identityPoolAuthenticatedRole = new iam.Role(this, 'IdentityPoolAuthenticatedRole', {
      assumedBy: new iam.WebIdentityPrincipal('cognito-identity.amazonaws.com', {
        'StringEquals': {
          'cognito-identity.amazonaws.com:aud': identityPool.ref,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'authenticated',
        },
      }),
      inlinePolicies: {
        IdentityPoolAuthenticatedRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'mobileanalytics:PutEvents',
                'cognito-sync:*',
                'cognito-identity:*',
              ],
              resources: [
                '*',
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                'execute-api:Invoke',
              ],
              resources: [
                api.arnForExecuteApi(),
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [
                appStorage.arnForObjects('public/*'),
                appStorage.arnForObjects('protected/${cognito-identity.amazonaws.com:sub}/*'),
                appStorage.arnForObjects('private/${cognito-identity.amazonaws.com:sub}/*'),
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:PutObject',
              ],
              resources: [
                appStorage.arnForObjects('uploads/*'),
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:GetObject',
              ],
              resources: [
                appStorage.arnForObjects('protected/*'),
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:ListBucket',
              ],
              resources: [
                appStorage.bucketArn,
              ],
              conditions: {
                'StringLike': {
                  's3:prefix': [
                    'public/',
                    'public/*',
                    'protected/',
                    'protected/*',
                    'private/${cognito-identity.amazonaws.com:sub}/',
                    'private/${cognito-identity.amazonaws.com:sub}/*',
                  ],
                },
              },
            }),
          ],
        }),
      },
    });

    // Identity Pool Unauthenticated Role
    const identityPoolUnauthenticatedRole = new iam.Role(this, 'IdentityPoolUnauthenticatedRole', {
      assumedBy: new iam.WebIdentityPrincipal('cognito-identity.amazonaws.com', {
        'StringEquals': {
          'cognito-identity.amazonaws.com:aud': identityPool.ref,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'unauthenticated',
        },
      }),
      inlinePolicies: {
        IdentityPoolUnauthenticatedRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'mobileanalytics:PutEvents',
                'cognito-sync:*',
              ],
              resources: [
                '*',
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                'execute-api:Invoke',
              ],
              resources: [
                api.arnForExecuteApi(),
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [
                appStorage.arnForObjects('public/*'),
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:PutObject',
              ],
              resources: [
                appStorage.arnForObjects('uploads/*'),
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:GetObject',
              ],
              resources: [
                appStorage.arnForObjects('protected/*'),
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:ListBucket',
              ],
              resources: [
                appStorage.bucketArn,
              ],
              conditions: {
                'StringLike': {
                  's3:prefix': [
                    'public/',
                    'public/*',
                    'protected/',
                    'protected/*',
                  ],
                },
              },
            }),
          ],
        }),
      },
    });

    // Identity Pool Role Attachment
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: Object.fromEntries([identityPoolAuthenticatedRole, identityPoolUnauthenticatedRole].map((role) => {
        return [role.node.id.replace(/^.*?((un)?authenticated).*?$/i, (_, s) => s.toLowerCase()), role.roleArn];
      })),
    });

    // If the feedback email exists, create the SNS topic.
    if (feedbackEmail) {
      // Feedback Topic
      const feedbackTopic = new sns.Topic(this, 'FeedbackTopic');

      // Add the email subscription.
      feedbackTopic.addSubscription(new subscriptions.EmailSubscription(feedbackEmail));

      // Add environment variable for access Feedback Topic.
      api.handler.addEnvironment('FEEDBACK_TOPIC_ARN', feedbackTopic.topicArn);

      // Add permissions to access Feedback Topic.
      feedbackTopic.grantPublish(api.handler);
    }

    // App Asset
    const appAsset = new assets.Asset(this, 'AppAsset', {
      path: '.',
      exclude: [
        '/*',
        '!.browserslistrc',
        '!index.html',
        '!package.json',
        '!postcss.config.js',
        '!public',
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
        buildImage: codebuild.LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          VITE_API_ENDPOINT: {
            value: apiEndpoint,
          },
          VITE_APP_STORAGE_BUCKET_NAME: {
            value: appStorage.bucketName,
          },
          VITE_IDENTITY_POOL_ID: {
            value: identityPool.ref,
          },
          VITE_USER_POOL_ID: {
            value: userPool.userPoolId,
          },
          VITE_USER_POOL_WEB_CLIENT_ID: {
            value: userPoolWebClient.userPoolClientId,
          },
          VITE_USER_POOL_DOMAIN_NAME: {
            value: userPoolDomain.baseUrl().slice(8),
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: 0.2,
        phases: {
          install: {
            'runtime-versions': {
              nodejs: 18,
            },
            commands: [
              'corepack enable',
            ],
          },
          pre_build: {
            commands: [
              'yarn --frozen-lockfile',
            ],
          },
          build: {
            commands: [
              'yarn build',
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

    // App Build Handler
    const appBuildHandler = new nodejs.NodejsFunction(this, 'AppBuildHandler', {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.minutes(15),
      environment: {
        APP_PROJECT_NAME: appProject.projectName,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            'codebuild:BatchGetBuilds',
            'codebuild:StartBuild',
          ],
          resources: [
            appProject.projectArn,
          ],
        }),
      ],
      bundling: {
        minify: true,
      },
    });

    // App Build Provider
    const appBuildProvider = new cr.Provider(this, 'AppBuildProvider', {
      onEventHandler: appBuildHandler,
    });

    // App Build
    const appBuild = new CustomResource(this, `AppBuild-${appAsset.assetHash}`, {
      serviceToken: appBuildProvider.serviceToken,
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
    appBucketDeployment.node.addDependency(appBuild);

    // If the GitHub repository name exists, create a role to cdk deploy from GitHub.
    if (githubRepo) {
      // GitHub OpenID Connect Provider
      const githubOpenIdConnectProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(this, 'GitHubOpenIdConnectProvider', `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`);

      // GitHub Deploy Role
      new iam.Role(this, 'GitHubDeployRole', {
        assumedBy: new iam.WebIdentityPrincipal(githubOpenIdConnectProvider.openIdConnectProviderArn, {
          'StringEquals': {
            [`${githubOpenIdConnectProvider.openIdConnectProviderIssuer}:aud`]: 'sts.amazonaws.com',
          },
          'StringLike': {
            [`${githubOpenIdConnectProvider.openIdConnectProviderIssuer}:sub`]: `repo:${githubRepo}:*`,
          },
        }),
        inlinePolicies: {
          GitHubDeployRolePolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: [
                  'sts:AssumeRole',
                ],
                resources: [
                  `arn:aws:iam::${this.account}:role/cdk-${this.synthesizer.bootstrapQualifier}-*-role-${this.account}-*`,
                ],
              }),
            ],
          }),
        },
      });
    }
  }
}
