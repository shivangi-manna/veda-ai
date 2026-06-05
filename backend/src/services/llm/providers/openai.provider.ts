import { IAIProvider } from '../types';
import logger from '../../../config/logger';

export class OpenAIProvider implements IAIProvider {
  name = 'OpenAI-Compatible / Anthropic';
  private apiKey: string | null = null;
  private baseUrl: string = 'https://api.freemodel.dev';
  private model: string = 'gpt-5.5';

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || null;
    this.baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.freemodel.dev';
    this.model = process.env.ANTHROPIC_MODEL || 'gpt-5.5';

    if (!this.apiKey || this.apiKey.startsWith('anthropic-placeholder') || this.apiKey === 'YOUR_ANTHROPIC_API_KEY') {
      logger.warn('Anthropic/OpenAI API Key is missing. Provider will run in demo/mock mode.');
      this.apiKey = null;
    }
  }

  isDemoMode(): boolean {
    return this.apiKey === null;
  }

  async generateQuestions(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.apiKey) {
      logger.info('Demo Mode: Simulating AI Response generation.');
      return this.getMockResponse();
    }

    let requestUrl = this.baseUrl;
    const isAnthropicFormat = this.baseUrl.includes('cc.freemodel.dev') || this.baseUrl.includes('api.anthropic.com');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: any;

    if (isAnthropicFormat) {
      if (!requestUrl.endsWith('/v1/messages') && !requestUrl.endsWith('/messages')) {
        const cleanBase = requestUrl.replace(/\/$/, '');
        if (cleanBase.endsWith('/v1')) {
          requestUrl = `${cleanBase}/messages`;
        } else {
          requestUrl = `${cleanBase}/v1/messages`;
        }
      }
      headers['x-api-key'] = this.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['accept'] = 'application/json';

      const modelName = this.model === 'deepseek-v4-flash-free' ? 'claude-3-5-sonnet-20241022' : this.model;
      body = {
        model: modelName,
        max_tokens: 4000,
        system: systemInstruction,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      };
    } else {
      if (!requestUrl.endsWith('/v1/chat/completions') && !requestUrl.endsWith('/chat/completions')) {
        const cleanBase = requestUrl.replace(/\/$/, '');
        if (cleanBase.endsWith('/v1')) {
          requestUrl = `${cleanBase}/chat/completions`;
        } else {
          requestUrl = `${cleanBase}/v1/chat/completions`;
        }
      }
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      body = {
        model: this.model,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      };
    }

    logger.info(`Sending generation request to OpenAI-compatible endpoint: ${requestUrl} using model: ${this.model}`);

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API request failed: ${response.statusText} (${response.status}) - ${errText}`);
    }

    const resJson = await response.json() as any;
    const rawContent = isAnthropicFormat
      ? resJson.content?.[0]?.text
      : resJson.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('AI returned an empty response or invalid choices structure.');
    }

    return rawContent;
  }

  private getMockResponse(): string {
    return JSON.stringify({
      sections: [
        {
          title: "Section A: Multiple Choice Questions",
          instruction: "Answer all the questions. Each question carries 2 marks.",
          questions: [
            {
              text: "Which of the following is a key feature of Node.js?",
              type: "MCQ",
              options: ["Synchronous execution", "Event-driven, non-blocking I/O", "Multi-threaded design", "Heavy CPU rendering"],
              correctAnswer: "Event-driven, non-blocking I/O",
              difficulty: "Easy",
              marks: 2
            }
          ]
        }
      ]
    }, null, 2);
  }
}
