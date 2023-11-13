// Pluralize
import { singular } from 'pluralize';

// AWS SDK - Comprehend
import {
  DetectDominantLanguageCommand,
  DetectSyntaxCommand,
  SyntaxLanguageCode,
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
      // Get the language code.
      const languageCode = await (async () => {
        // If the text is Japanese, return "ja".
        if (/[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Han}]/u.test(text)) {
          return 'ja';
        }

        // Detect dominant language.
        const { Languages: languages } = await comprehend.send(new DetectDominantLanguageCommand({
          Text: text,
        }));

        // Get the language code.
        return languages?.[0]?.LanguageCode;
      })();

      // If the detected language code is supported by the DetectSyntax API, return it.
      if (languageCode && isSyntaxLanguageCode(languageCode)) {
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
  return await comprehend.send(new DetectSyntaxCommand({
    Text: translatedText,
    LanguageCode: languageCode ?? SyntaxLanguageCode.EN,
  })).then(({ SyntaxTokens: tokens }) => tokens ?? []);
};

export const getWords = (syntaxTokens: SyntaxToken[]): string[] => {
  const tokens = syntaxTokens.filter(({ PartOfSpeech: pos }) => {
    return pos?.Tag && !/^(?:ADP|DET|PUNCT)$/.test(pos.Tag);
  });

  return tokens.map(({ Text: word }) => word?.replace?.(/“|”/g, '')).flatMap((word) => {
    return word ? [word] : [];
  });
};

export const normalize = (word: string): string => {
  return singular(word.toLowerCase());
};

const isSyntaxLanguageCode = (s: string): s is SyntaxLanguageCode => {
  return Object.values<string>(SyntaxLanguageCode).includes(s);
};
