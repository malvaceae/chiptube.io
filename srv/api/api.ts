// AWS CDK
import {
  Duration,
  aws_apigateway as apigateway,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejs,
} from 'aws-cdk-lib';

// Constructs
import { Construct } from 'constructs';

/**
 * ChipTube Api Construct
 */
export class ChipTubeApi extends apigateway.RestApi {
  /**
   * Api Handler
   */
  public readonly handler: lambda.Function;

  /**
   * Creates a new api.
   */
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      deployOptions: {
        stageName: 'v1',
      },
      restApiName: 'ChipTube API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        maxAge: Duration.days(1),
      },
    });

    // Remove the default endpoint output.
    this.node.tryRemoveChild('Endpoint');

    // Api Handler
    this.handler = new nodejs.NodejsFunction(this, 'Handler', {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(30),
      memorySize: 1769, // 1 vCPU
      environment: {
        NODE_ENV: 'production',
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            'comprehend:DetectDominantLanguage',
            'comprehend:DetectSyntax',
            'translate:TranslateText',
          ],
          resources: [
            '*',
          ],
        }),
      ],
      bundling: {
        minify: true,
      },
    });

    // Add the proxy resource and any methods.
    [this.root, this.root.addProxy({ anyMethod: false })].forEach((resource) => {
      resource.addMethod('ANY', new apigateway.LambdaIntegration(this.handler), {
        authorizationType: apigateway.AuthorizationType.IAM,
      });
    });

    // Add the Gateway Response when the status code is 4XX.
    this.addGatewayResponse('GatewayResponseDefault4XX', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      },
    });

    // Add the Gateway Response when the status code is 5XX.
    this.addGatewayResponse('GatewayResponseDefault5XX', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      },
    });
  }
}
