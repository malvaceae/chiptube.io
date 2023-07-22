// Pluralize
import { singular } from 'pluralize';

// AWS SDK - Comprehend
import {
  DetectDominantLanguageCommand,
  DetectSyntaxCommand,
  SyntaxToken,
} from '@aws-sdk/client-comprehend';

// AWS SDK - Translate
import { TranslateTextCommand } from '@aws-sdk/client-translate';

// Api Services
import {
  comprehend,
  translate,
} from '@/api/services';

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
