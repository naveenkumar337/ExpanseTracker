// src/hooks/useShareIntent.ts
import { useEffect, useState } from 'react';
import { useShareIntent } from 'expo-share-intent';

export interface ShareIntentData {
  text: string | null;
  type: string | null;
}

export function useAppShareIntent() {
  const { shareIntent, resetShareIntent } = useShareIntent();
  const [processedText, setProcessedText] = useState<string | null>(null);

  useEffect(() => {
    if (shareIntent.text) {
      setProcessedText(shareIntent.text);
    }
  }, [shareIntent]);

  function clearProcessedText() {
    setProcessedText(null);
    resetShareIntent();
  }

  return {
    text: processedText,
    hasShareIntent: !!processedText,
    clearProcessedText
  };
}
