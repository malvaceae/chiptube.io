// Node.js Core Modules
import { readFileSync } from 'fs';

// AWS CDK
import {
  Duration,
  aws_apigateway as apigateway,
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejs,
} from 'aws-cdk-lib';

// Constructs
import { Construct } from 'constructs';

// OpenAPI
import { OpenAPIV3 } from 'openapi-types';

// js-yaml
import yaml from 'js-yaml';

/**
 * ChipTube Api Properties
 */
export interface ChipTubeApiProps {
  /**
   * Api Spec File
   */
  readonly specFile: string;
}

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
  constructor(scope: Construct, id: string, props: ChipTubeApiProps) {
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
      runtime: lambda.Runtime.NODEJS_16_X,
      timeout: Duration.seconds(30),
      memorySize: 1769, // 1 vCPU
      bundling: {
        minify: true,
        nodeModules: [
          'kuromoji',
        ],
      },
    });

    // Load the api spec file.
    const spec = loadYaml<OpenAPIV3.Document>(
      readFileSync(props.specFile).toString(),
    );

    // Add resources and methods.
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      // Add the resource.
      const resource = this.root.resourceForPath(path);

      // Add methods.
      Object.values(OpenAPIV3.HttpMethods).filter((v) => pathItem?.hasOwnProperty(v)).forEach((httpMethod) => {
        resource.addMethod(httpMethod, new apigateway.LambdaIntegration(this.handler), {
          authorizationType: apigateway.AuthorizationType.IAM,
        });
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

const loadYaml = <T = ReturnType<typeof yaml.load>>(...args: Parameters<typeof yaml.load>): T => {
  return yaml.load(...args) as T;
};
