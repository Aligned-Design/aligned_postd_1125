/**
 * ML Tone Classifier
 * Classifies content tone using semantic similarity and ML-based analysis
 * Enhances Brand Fidelity Score tone detection with deeper linguistic analysis
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==================== TONE DEFINITIONS ====================

export interface ToneDefinition {
  name: string;
  keywords: string[];
  description: string;
  sentimentRange: [number, number]; // [negative, positive]
  formalityLevel: number; // 0-1, 0=casual, 1=formal
  aggressiveness: number; // 0-1, 0=passive, 1=aggressive
  emotionalIntensity: number; // 0-1, 0=neutral, 1=very emotional
}

export const TONE_LIBRARY: Record<string, ToneDefinition> = {
  professional: {
    name: 'Professional',
    keywords: ['authoritative', 'credible', 'formal', 'structured', 'clear'],
    description: 'Formal, business-appropriate tone suitable for corporate contexts',
    sentimentRange: [0.3, 0.7],
    formalityLevel: 0.9,
    aggressiveness: 0.1,
    emotionalIntensity: 0.2,
  },
  casual: {
    name: 'Casual',
    keywords: ['friendly', 'relaxed', 'conversational', 'informal', 'accessible'],
    description: 'Friendly, informal tone for casual audiences',
    sentimentRange: [0.4, 0.8],
    formalityLevel: 0.2,
    aggressiveness: 0.1,
    emotionalIntensity: 0.5,
  },
  energetic: {
    name: 'Energetic',
    keywords: ['excited', 'dynamic', 'enthusiastic', 'vibrant', 'engaging'],
    description: 'High-energy tone suitable for promotions and campaigns',
    sentimentRange: [0.6, 1.0],
    formalityLevel: 0.4,
    aggressiveness: 0.3,
    emotionalIntensity: 0.8,
  },
  serious: {
    name: 'Serious',
    keywords: ['stern', 'grave', 'solemn', 'formal', 'significant'],
    description: 'Serious, formal tone for important or sensitive topics',
    sentimentRange: [0.0, 0.5],
    formalityLevel: 0.95,
    aggressiveness: 0.2,
    emotionalIntensity: 0.6,
  },
  empathetic: {
    name: 'Empathetic',
    keywords: ['understanding', 'compassionate', 'warm', 'supportive', 'caring'],
    description: 'Warm, compassionate tone showing understanding and support',
    sentimentRange: [0.4, 0.8],
    formalityLevel: 0.6,
    aggressiveness: 0.0,
    emotionalIntensity: 0.7,
  },
  humorous: {
    name: 'Humorous',
    keywords: ['witty', 'playful', 'funny', 'lighthearted', 'entertaining'],
    description: 'Humorous, entertaining tone for engagement',
    sentimentRange: [0.6, 1.0],
    formalityLevel: 0.3,
    aggressiveness: 0.1,
    emotionalIntensity: 0.6,
  },
  authoritative: {
    name: 'Authoritative',
    keywords: ['expert', 'commanding', 'confident', 'decisive', 'definitive'],
    description: 'Authoritative tone projecting confidence and expertise',
    sentimentRange: [0.3, 0.7],
    formalityLevel: 0.85,
    aggressiveness: 0.4,
    emotionalIntensity: 0.3,
  },
  uncertain: {
    name: 'Uncertain',
    keywords: ['tentative', 'cautious', 'hesitant', 'qualified', 'suggested'],
    description: 'Uncertain tone expressing caution or hedging',
    sentimentRange: [0.2, 0.6],
    formalityLevel: 0.5,
    aggressiveness: 0.0,
    emotionalIntensity: 0.2,
  },
};

// ==================== TONE CLASSIFICATION RESULT ====================

export interface ToneClassificationResult {
  detected_tone: string;
  confidence: number; // 0-1
  tone_scores: Record<string, number>; // Score for each tone
  characteristics: {
    formality_level: number; // 0-1
    sentiment: number; // -1 to 1
    aggressiveness: number; // 0-1
    emotional_intensity: number; // 0-1
  };
  matches: Array<{
    tone: string;
    similarity: number; // 0-1
  }>;
}

// ==================== EMBEDDING CACHE ====================

interface EmbeddingCache {
  [key: string]: number[];
}

let embeddingCache: EmbeddingCache = {};

// ==================== TONE CLASSIFIER ====================

export class ToneClassifier {
  private cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private cacheTimestamps: Record<string, number> = {};

  /**
   * Classify tone of given text
   */
  async classifyTone(text: string, _targetTone?: string): Promise<ToneClassificationResult> {
    try {
      // Step 1: Get text embedding
      const textEmbedding = await this.getEmbedding(text);

      // Step 2: Get embeddings for all tones
      const toneEmbeddings = await Promise.all(
        Object.entries(TONE_LIBRARY).map(async ([toneName, toneDef]) => ({
          toneName,
          embedding: await this.getEmbedding(toneDef.description),
        }))
      );

      // Step 3: Calculate similarity scores
      const similarityScores: Record<string, number> = {};
      for (const { toneName, embedding } of toneEmbeddings) {
        similarityScores[toneName] = this.cosineSimilarity(textEmbedding, embedding);
      }

      // Step 4: Analyze linguistic characteristics
      const characteristics = this.analyzeLinguisticCharacteristics(text);

      // Step 5: Determine best matching tone
      const sortedTones = Object.entries(similarityScores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .map(([toneName, similarity]) => ({ toneName, similarity }));

      const detectedTone = sortedTones[0].toneName;
      const confidence = sortedTones[0].similarity;

      // Step 6: Adjust confidence based on linguistic characteristics
      const adjustedConfidence = this.adjustConfidenceByCharacteristics(
        detectedTone,
        confidence,
        characteristics
      );

      return {
        detected_tone: detectedTone,
        confidence: Math.min(adjustedConfidence, 1.0),
        tone_scores: similarityScores,
        characteristics,
        matches: sortedTones.map(({ toneName, similarity }) => ({
          tone: toneName,
          similarity: Math.min(similarity, 1.0),
        })),
      };
    } catch (error) {
      console.error('[Tone Classifier] Error classifying tone:', error);
      throw error;
    }
  }

  /**
   * Get or create embedding for text
   */
  private async getEmbedding(text: string): Promise<number[]> {
    const cacheKey = `embedding_${text.substring(0, 50)}`;

    // Check cache
    if (embeddingCache[cacheKey] && this.cacheTimestamps[cacheKey]) {
      const age = Date.now() - this.cacheTimestamps[cacheKey];
      if (age < this.cacheTTL) {
        return embeddingCache[cacheKey];
      }
    }

    // Get fresh embedding from OpenAI
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 512,
      });

      const embedding = response.data[0].embedding;

      // Cache the embedding
      embeddingCache[cacheKey] = embedding;
      this.cacheTimestamps[cacheKey] = Date.now();

      return embedding;
    } catch (error) {
      console.error('[Tone Classifier] Embedding error:', error);
      // Return zero vector on error (will result in low similarity scores)
      return new Array(512).fill(0);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      console.warn('[Tone Classifier] Embedding dimension mismatch');
      return 0;
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return (dotProduct / (magnitudeA * magnitudeB) + 1) / 2; // Normalize to 0-1
  }

  /**
   * Analyze linguistic characteristics of text
   */
  private analyzeLinguisticCharacteristics(text: string): ToneClassificationResult['characteristics'] {
    const lowerText = text.toLowerCase();

    // Formality detection
    const informalWords = [
      'hey',
      'gonna',
      'wanna',
      'like',
      'kinda',
      'lol',
      'omg',
      'yeah',
      'awesome',
      'cool',
    ];
    const formalWords = [
      'therefore',
      'moreover',
      'furthermore',
      'hereby',
      'therein',
      'whence',
      'pursuant',
    ];

    const informalCount = informalWords.filter((w) => lowerText.includes(w)).length;
    const formalCount = formalWords.filter((w) => lowerText.includes(w)).length;
    const formalityLevel = Math.max(0, Math.min(1, 0.5 + (formalCount - informalCount) * 0.1));

    // Sentiment detection
    const positiveWords = [
      'great',
      'good',
      'excellent',
      'amazing',
      'fantastic',
      'wonderful',
      'love',
      'awesome',
      'perfect',
      'best',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'hate',
      'horrible',
      'worst',
      'disappointed',
      'failed',
      'wrong',
      'problem',
    ];

    const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length;
    const sentiment = (positiveCount - negativeCount) / (text.length / 100);

    // Aggressiveness detection
    const aggressiveWords = [
      'must',
      'demand',
      'forced',
      'attack',
      'crush',
      'destroy',
      'beat',
      'fight',
      'eliminate',
    ];
    const aggressiveCount = aggressiveWords.filter((w) => lowerText.includes(w)).length;
    const aggressiveness = Math.min(1, aggressiveCount / 5);

    // Emotional intensity
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    const emotionalIntensity = Math.min(1, (exclamationCount * 0.3 + questionCount * 0.1) / text.length);

    return {
      formality_level: formalityLevel,
      sentiment: Math.max(-1, Math.min(1, sentiment)),
      aggressiveness: aggressiveness,
      emotional_intensity: emotionalIntensity,
    };
  }

  /**
   * Adjust confidence based on linguistic characteristics
   */
  private adjustConfidenceByCharacteristics(
    tone: string,
    baseConfidence: number,
    characteristics: ToneClassificationResult['characteristics']
  ): number {
    const toneDef = TONE_LIBRARY[tone];
    if (!toneDef) {
      return baseConfidence;
    }

    let adjustment = 0;

    // Check formality alignment
    const formalityDiff = Math.abs(characteristics.formality_level - toneDef.formalityLevel);
    adjustment += (1 - formalityDiff) * 0.1;

    // Check sentiment alignment
    const sentimentInRange =
      characteristics.sentiment >= toneDef.sentimentRange[0] &&
      characteristics.sentiment <= toneDef.sentimentRange[1];
    adjustment += sentimentInRange ? 0.15 : -0.15;

    // Check aggressiveness alignment
    const aggressivenessDiff = Math.abs(characteristics.aggressiveness - toneDef.aggressiveness);
    adjustment += (1 - aggressivenessDiff) * 0.1;

    // Check emotional intensity alignment
    const intensityDiff = Math.abs(characteristics.emotional_intensity - toneDef.emotionalIntensity);
    adjustment += (1 - intensityDiff) * 0.1;

    return Math.max(0, Math.min(1, baseConfidence + adjustment));
  }

  /**
   * Compare two tones for similarity (0-1)
   */
  compareTones(tone1: string, tone2: string): number {
    const def1 = TONE_LIBRARY[tone1];
    const def2 = TONE_LIBRARY[tone2];

    if (!def1 || !def2) {
      return tone1 === tone2 ? 1 : 0;
    }

    // Calculate distance between tone characteristics
    const formalityDiff = Math.abs(def1.formalityLevel - def2.formalityLevel);
    const sentimentDiff =
      Math.abs(def1.sentimentRange[0] - def2.sentimentRange[0]) +
      Math.abs(def1.sentimentRange[1] - def2.sentimentRange[1]);
    const aggressivenessDiff = Math.abs(def1.aggressiveness - def2.aggressiveness);
    const intensityDiff = Math.abs(def1.emotionalIntensity - def2.emotionalIntensity);

    const totalDiff = (formalityDiff + sentimentDiff / 2 + aggressivenessDiff + intensityDiff) / 4;
    return 1 - totalDiff;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    embeddingCache = {};
    this.cacheTimestamps = {};
  }
}

// ==================== SINGLETON INSTANCE ====================

export const toneClassifier = new ToneClassifier();
