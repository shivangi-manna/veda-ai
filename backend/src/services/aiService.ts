import { ISection, IAnswerKeyItem, IQuestionTypeConfig } from '../types';

interface IGenerationResult {
  sections: ISection[];
  answerKey: IAnswerKeyItem[];
}

interface ICallAIParams {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens?: number;
}

const callAI = async (params: ICallAIParams): Promise<string> => {
  const { apiKey, baseUrl, modelName, systemPrompt, userPrompt, temperature, maxTokens } = params;
  const isAnthropic = baseUrl.includes('cc.freemodel.dev') || baseUrl.includes('api.anthropic.com');

  let requestUrl = baseUrl;
  let headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  let body: any;

  if (isAnthropic) {
    if (!requestUrl.endsWith('/v1/messages') && !requestUrl.endsWith('/messages')) {
      const cleanBase = requestUrl.replace(/\/$/, '');
      if (cleanBase.endsWith('/v1')) {
        requestUrl = `${cleanBase}/messages`;
      } else {
        requestUrl = `${cleanBase}/v1/messages`;
      }
    }
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['user-agent'] = 'claude-code/0.2.29 darwin-arm64 node/v20.9.0';
    headers['accept'] = 'application/json';

    const anthropicModel = modelName === 'deepseek-v4-flash-free' ? 'claude-3-5-sonnet-20241022' : modelName;
    body = {
      model: anthropicModel,
      max_tokens: maxTokens || 4000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      temperature
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
    headers['Authorization'] = `Bearer ${apiKey}`;
    body = {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature
    };
    if (maxTokens) {
      body.max_tokens = maxTokens;
    }
  }

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API request failed: ${response.statusText} (${response.status}) - ${errText}`);
  }

  const resJson = (await response.json()) as any;
  const rawContent = isAnthropic
    ? resJson.content?.[0]?.text
    : resJson.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('AI returned an empty response or invalid choices structure.');
  }

  return rawContent;
};

const extractJsonFromString = (str: string): any => {
  const firstOpenBrace = str.indexOf('{');
  const lastCloseBrace = str.lastIndexOf('}');
  
  if (firstOpenBrace === -1 || lastCloseBrace === -1 || lastCloseBrace < firstOpenBrace) {
    throw new Error(`No valid JSON object found in response. Raw: "${str.substring(0, 150)}..."`);
  }
  
  const jsonCandidate = str.substring(firstOpenBrace, lastCloseBrace + 1);
  try {
    return JSON.parse(jsonCandidate);
  } catch (err: any) {
    throw new Error(`JSON parsing failed. Error: ${err.message}. Block: "${jsonCandidate.substring(0, 150)}..."`);
  }
};

export const generateAssessment = async (params: {
  title: string;
  subject: string;
  gradeClass: string;
  schoolName: string;
  questionConfigs: IQuestionTypeConfig[];
  additionalInstructions?: string;
  extractedFileText?: string;
}): Promise<IGenerationResult> => {
  const {
    title,
    subject,
    gradeClass,
    schoolName,
    questionConfigs,
    additionalInstructions,
    extractedFileText
  } = params;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://opencode.ai/zen';
  const modelName = process.env.ANTHROPIC_MODEL || 'deepseek-v4-flash-free';

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not defined in environment variables.');
  }

  // Construct questions specifications string
  const specText = questionConfigs
    .map((c) => `- ${c.count} x "${c.type}" questions, carrying ${c.marks} marks each.`)
    .join('\n');

  // Construct system prompt
  const systemPrompt = `You are an expert assessment generator. Your task is to generate a professional exam paper in strict JSON format. 
Do not include any chat formatting, thoughts, explanation, or markdown fences except the final JSON structure.
You MUST follow the requested question counts and question types exactly.`;

  // Construct user prompt
  const userPrompt = `
Generate a structured question paper for the following parameters:
- School: ${schoolName}
- Grade/Class: ${gradeClass}
- Subject: ${subject}
- Topic/Title: ${title}

Question Specifications:
${specText}

${additionalInstructions ? `Additional Instructions for AI:\n"${additionalInstructions}"\n` : ''}
${extractedFileText ? `Extracted Content from Uploaded File (Use this as primary source material to base questions on):\n"""\n${extractedFileText}\n"""\n` : ''}

You must organize the paper into sections. Usually, each unique question type goes into its own section (e.g., Section A: Multiple Choice Questions, Section B: Short Answer Questions, etc.).
Each question MUST have a difficulty assigned to it ('Easy', 'Moderate', or 'Hard') distributed reasonably (e.g. mix of easy, moderate, hard).
Each question MUST have its exact marks matching the question type specifications.
Each question MUST include a "taxonomy" field classifying it under Bloom's Taxonomy ('Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating').
Each question MUST include a "rubric" field providing a detailed step-by-step breakdown of how marks are awarded.

You must also generate a corresponding comprehensive answer key covering all questions.

Return a JSON object conforming exactly to this structure:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries 1 mark.",
      "questions": [
        {
          "text": "What is the unit of electrical resistance?",
          "difficulty": "Easy",
          "marks": 1,
          "taxonomy": "Remembering",
          "rubric": "1 Mark: Correct name (Ohm) and symbol (Ω)."
        }
      ]
    }
  ],
  "answerKey": [
    {
      "sectionTitle": "Section A",
      "questionIndex": 1,
      "questionText": "What is the unit of electrical resistance?",
      "answer": "Ohm (Ω). It is the SI unit representing electrical resistance."
    }
  ]
}

Ensure the output is valid JSON and contains only the JSON object. Do not wrap the JSON object inside any other text.
`;

  try {
    const rawContent = await callAI({
      apiKey,
      baseUrl,
      modelName,
      systemPrompt,
      userPrompt,
      temperature: 0.3
    });

    // Robustly extract and parse JSON from the AI response
    const parsedData: IGenerationResult = extractJsonFromString(rawContent);

    // Validate structure
    if (!parsedData.sections || !Array.isArray(parsedData.sections)) {
      throw new Error('AI output is missing "sections" array');
    }
    if (!parsedData.answerKey || !Array.isArray(parsedData.answerKey)) {
      throw new Error('AI output is missing "answerKey" array');
    }

    return parsedData;
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

export const polishSingleQuestion = async (params: {
  questionText: string;
  marks: number;
  subject: string;
  gradeClass: string;
  schoolName: string;
  instruction: string;
}): Promise<{
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  taxonomy: string;
  rubric: string;
  answer: string;
}> => {
  const { questionText, marks, subject, gradeClass, schoolName, instruction } = params;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://opencode.ai/zen';
  const modelName = process.env.ANTHROPIC_MODEL || 'deepseek-v4-flash-free';

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not defined in environment variables.');
  }

  const systemPrompt = `You are an expert exam designer. Modify the given exam question based on the teacher's polish instruction. 
Return the output strictly in JSON format. Do not wrap in markdown code blocks or add details outside of the JSON structure.
You MUST keep your modifications extremely concise and brief to minimize output token count and response latency. Keep the 'rubric' and 'answer' short and to the point.`;

  const userPrompt = `
Metadata context:
- School: ${schoolName}
- Class/Grade: ${gradeClass}
- Subject: ${subject}

Original Question:
"${questionText}"
Marks: ${marks}

Teacher Refine/Polish Instruction:
"${instruction}"

Your task is to modify the question to satisfy the refine instruction. You must:
1. Rewrite the question text (incorporating math/science formulas if needed).
2. Keep the marks at ${marks}.
3. Assign a matching difficulty level ('Easy', 'Moderate', or 'Hard').
4. Determine the Bloom's Taxonomy category ('Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating').
5. Generate a brief, clear grading rubric (keep it under 15 words).
6. Provide a concise revised answer explanation (keep it under 20 words).

Return a JSON object conforming exactly to this structure:
{
  "text": "The revised question text",
  "difficulty": "Moderate",
  "marks": ${marks},
  "taxonomy": "Applying",
  "rubric": "Brief rubric summary",
  "answer": "Concise answer key explanation"
}

Ensure the output is valid JSON and contains only the JSON object. Do not wrap in other text.
`;

  try {
    const rawContent = await callAI({
      apiKey,
      baseUrl,
      modelName,
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      maxTokens: 800
    });

    const parsedData = extractJsonFromString(rawContent);
    return {
      text: parsedData.text,
      difficulty: parsedData.difficulty || 'Moderate',
      marks: Number(parsedData.marks || marks),
      taxonomy: parsedData.taxonomy || 'Applying',
      rubric: parsedData.rubric || `${marks} Mark(s) for correct answer.`,
      answer: parsedData.answer || 'No explanation provided.'
    };
  } catch (error) {
    console.error('AI Single Question Polish Error:', error);
    throw error;
  }
};
