export interface TranslationResult {
  translatedText: string;
  phonetic?: string;
  example?: string;
}

export async function translateText(text: string, from: string, to: string): Promise<TranslationResult> {
  const langPair = `${from}|${to}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200) {
      return {
        translatedText: data.responseData.translatedText,
        // MyMemory doesn't provide phonetic or examples, we might need another API or mock them
        phonetic: '', 
        example: ''
      };
    } else {
      throw new Error(data.responseDetails || 'Translation failed');
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}
