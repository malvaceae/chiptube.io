// AWS Lambda
import {
  CdkCustomResourceEvent,
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from 'aws-lambda';

// AWS SDK
import { CodeBuild } from 'aws-sdk';

// AWS SDK - CodeBuild
const codebuild = new CodeBuild({
  apiVersion: '2016-10-06',
});

export const handler: CdkCustomResourceHandler = async (event: CdkCustomResourceEvent): Promise<CdkCustomResourceResponse> => {
  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      const { build } = await codebuild.startBuild({
        projectName: process.env.APP_PROJECT_NAME!,
      }).promise();

      if (!build?.id) {
        throw Error();
      }

      while (true) {
        const { builds } = await codebuild.batchGetBuilds({
          ids: [
            build.id,
          ],
        }).promise();

        if (!builds?.[0]) {
          throw Error();
        }

        if (builds[0].buildStatus === 'FAILED') {
          throw Error('The build failed.');
        }

        if (builds[0].buildStatus === 'FAULT') {
          throw Error('The build faulted.');
        }

        if (builds[0].buildStatus === 'TIMED_OUT') {
          throw Error('The build timed out.');
        }

        if (builds[0].buildStatus === 'STOPPED') {
          throw Error('The build stopped.');
        }

        if (builds[0].buildStatus === 'SUCCEEDED') {
          break;
        }

        await new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
      }
  }

  return {};
};
