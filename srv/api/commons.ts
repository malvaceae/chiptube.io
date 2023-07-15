// AWS Lambda
import { APIGatewayProxyResult } from 'aws-lambda';

// AWS SDK - Cognito
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

// AWS SDK - Comprehend
import {
  ComprehendClient,
  DetectDominantLanguageCommand,
  DetectSyntaxCommand,
  SyntaxToken,
} from '@aws-sdk/client-comprehend';

// AWS SDK - DynamoDB
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// AWS SDK - DynamoDB - Document Client
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// AWS SDK - S3
import { S3Client } from '@aws-sdk/client-s3';

// AWS SDK - SNS
import { SNSClient } from '@aws-sdk/client-sns';

// AWS SDK - Translate
import {
  TranslateClient,
  TranslateTextCommand,
} from '@aws-sdk/client-translate';

// Pluralize
import { singular } from 'pluralize';

// Ajv
import Ajv from 'ajv';

// Ajv
export const ajv = new Ajv({
  allErrors: true,
});

// AWS SDK - Cognito - Client
export const cognito = new CognitoIdentityProviderClient({
  apiVersion: '2016-04-18',
});

// AWS SDK - Comprehend - Client
export const comprehend = new ComprehendClient({
  apiVersion: '2017-11-27',
});

// AWS SDK - DynamoDB - Client
export const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({
  apiVersion: '2012-08-10',
}));

// AWS SDK - S3 - Client
export const s3 = new S3Client({
  apiVersion: '2006-03-01',
});

// AWS SDK - SNS - Client
export const sns = new SNSClient({
  apiVersion: '2010-03-31',
});

// AWS SDK - Translate - Client
export const translate = new TranslateClient({
  apiVersion: '2017-07-01',
});

export const getUserId = (cognitoAuthenticationProvider: string): string => {
  return cognitoAuthenticationProvider.split(':')[2];
};

export const getUserPoolId = (cognitoAuthenticationProvider: string): string => {
  return cognitoAuthenticationProvider.split(':')[0].split('/')[2];
};

export const tokenize = async (text: string): Promise<SyntaxToken[]> => {
  // Detect dominant language and translate text.
  const { translatedText, languageCode } = await (async (text) => {
    try {
      // Detect dominant language.
      const { Languages: languages } = await comprehend.send(new DetectDominantLanguageCommand({
        Text: text,
      }));

      if (!languages?.[0]?.LanguageCode) {
        return { translatedText: text };
      }

      // Get the language code.
      const { LanguageCode: languageCode } = languages[0];

      // If the detected language code is supported by the DetectSyntax API, return it.
      if (['en', 'es', 'fr', 'de', 'it', 'pt'].includes(languageCode)) {
        return { translatedText: text, languageCode };
      }

      // Translate text to English.
      const { TranslatedText: translatedText } = await translate.send(new TranslateTextCommand({
        Text: text,
        SourceLanguageCode: languageCode,
        TargetLanguageCode: 'en',
      }));

      return { translatedText };
    } catch {
      return { translatedText: text };
    }
  })(text.normalize('NFKC'));

  // Detect syntax.
  return await (async ({ text, languageCode }) => {
    const { SyntaxTokens: syntaxTokens } = await comprehend.send(new DetectSyntaxCommand({
      Text: text,
      LanguageCode: languageCode,
    }));

    return syntaxTokens ?? [];
  })({ text: translatedText, languageCode: languageCode ?? 'en' });
};

export const getWords = (syntaxTokens: SyntaxToken[]): string[] => {
  return syntaxTokens.filter(({ PartOfSpeech: partOfSpeech }) => {
    return !/^(?:ADP|DET|PUNCT)$/.test(partOfSpeech?.Tag ?? '');
  }).flatMap(({ Text: word }) => word ? [word] : []);
};

export const normalize = (word: string): string => {
  return singular(word.toLowerCase());
};

export const response = (body: any, statusCode = 200): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
};
