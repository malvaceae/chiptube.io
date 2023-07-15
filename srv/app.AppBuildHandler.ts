// AWS Lambda
import {
  CdkCustomResourceEvent,
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from 'aws-lambda';

// AWS SDK - CodeBuild
import {
  BatchGetBuildsCommand,
  CodeBuildClient,
  StartBuildCommand,
} from '@aws-sdk/client-codebuild';

// AWS SDK - CodeBuild - Client
const codebuild = new CodeBuildClient({
  apiVersion: '2016-10-06',
});

export const handler: CdkCustomResourceHandler = async (event: CdkCustomResourceEvent): Promise<CdkCustomResourceResponse> => {
  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      const { build } = await codebuild.send(new StartBuildCommand({
        projectName: process.env.APP_PROJECT_NAME,
      }));

      if (!build?.id) {
        throw Error();
      }

      while (true) {
        const { builds } = await codebuild.send(new BatchGetBuildsCommand({
          ids: [
            build.id,
          ],
        }));

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
