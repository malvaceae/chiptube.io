// AWS Lambda
import { APIGatewayProxyResult } from 'aws-lambda';

// AWS SDK
import {
  CognitoIdentityServiceProvider,
  Comprehend,
  DynamoDB,
  S3,
  SNS,
  Translate,
} from 'aws-sdk';

// Pluralize
import { singular } from 'pluralize';

// Ajv
import Ajv from 'ajv';

// Ajv
export const ajv = new Ajv({
  allErrors: true,
});

// AWS SDK - Cognito
export const cognito = new CognitoIdentityServiceProvider({
  apiVersion: '2016-04-18',
});

// AWS SDK - Comprehend
export const comprehend = new Comprehend({
  apiVersion: '2017-11-27',
});

// AWS SDK - DynamoDB
export const dynamodb = new DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
});

// AWS SDK - S3
export const s3 = new S3({
  apiVersion: '2006-03-01',
});

// AWS SDK - SNS
export const sns = new SNS({
  apiVersion: '2010-03-31',
});

// AWS SDK - Translate
export const translate = new Translate({
  apiVersion: '2017-07-01',
});

export const getUserId = (cognitoAuthenticationProvider: string): string => {
  return cognitoAuthenticationProvider.split(':')[2];
};

export const getUserPoolId = (cognitoAuthenticationProvider: string): string => {
  return cognitoAuthenticationProvider.split(':')[0].split('/')[2];
};

export const tokenize = async (text: string): Promise<Comprehend.ListOfSyntaxTokens> => {
  // Detect dominant language and translate text.
  const { translatedText, languageCode } = await (async (text) => {
    try {
      // Detect dominant language.
      const { Languages: languages } = await comprehend.detectDominantLanguage({
        Text: text,
      }).promise();

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
      const { TranslatedText: translatedText } = await translate.translateText({
        Text: text,
        SourceLanguageCode: languageCode,
        TargetLanguageCode: 'en',
      }).promise();

      return { translatedText };
    } catch {
      return { translatedText: text };
    }
  })(text.normalize('NFKC'));

  // Detect syntax.
  return await (async ({ text, languageCode }) => {
    const { SyntaxTokens: syntaxTokens } = await comprehend.detectSyntax({
      Text: text,
      LanguageCode: languageCode,
    }).promise();

    return syntaxTokens ?? [];
  })({ text: translatedText, languageCode: languageCode ?? 'en' });
};

export const getWords = (syntaxTokens: Comprehend.ListOfSyntaxTokens): string[] => {
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
