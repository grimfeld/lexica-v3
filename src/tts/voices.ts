/*
 * App-fixed TTS voice + model per Language (ADR-0008). The user never picks a
 * voice; the app chooses one per language, app-wide, for both BYOK and cloud.
 * Because voice/model are fixed, they don't enter the cache key — the key is
 * just hash(normalizedText + language).
 *
 * Voice ids are ElevenLabs voice ids. Languages without an entry fall back to a
 * multilingual default so any language can still be spoken.
 */

export interface VoiceConfig {
  voiceId: string;
  modelId: string;
}

// ElevenLabs multilingual model; a neutral default voice ("Rachel").
const DEFAULT: VoiceConfig = {
  voiceId: "21m00Tcm4TlvDq8ikWAM",
  modelId: "eleven_multilingual_v2",
};

const BY_LANGUAGE: Record<string, VoiceConfig> = {
  es: { voiceId: "VR6AewLTigWG4xSOukaG", modelId: "eleven_multilingual_v2" }, // "Arnold"
  fr: { voiceId: "ThT5KcBeYPX3keUQqHPh", modelId: "eleven_multilingual_v2" }, // "Dorothy"
};

export function voiceFor(languageId: string): VoiceConfig {
  return BY_LANGUAGE[languageId] ?? DEFAULT;
}
