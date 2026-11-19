import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getThinkingLevel(mode: string | undefined): ThinkingLevel {
  if (mode === 'Fast') return ThinkingLevel.LOW;
  if (mode === 'Study Coach') return ThinkingLevel.MEDIUM;
  return ThinkingLevel.HIGH;
}

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  text: string;
}

interface ChatRequestBody {
  message?: string;
  mode?: string;
  activeDocument?: {
    name?: string;
    courseCode?: string;
    summary?: string;
  };
  history?: ChatHistoryItem[];
  assignmentsSummary?: string;
}

interface FlashcardsRequestBody {
  topic?: string;
  contextText?: string;
  courseCode?: string;
}

interface FacultyInsightRequestBody {
  courseCode?: string;
  submissionsSummary?: string;
}

const app = express();
app.use(express.json({ limit: '2mb' }));

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as ChatRequestBody;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
      res.status(400).json({ error: 'Message prompt is required.' });
      return;
    }

    const ai = getGeminiClient();
    const docName = body.activeDocument?.name || 'Distributed_Systems_Lec4.pdf';
    const docCourse = body.activeDocument?.courseCode || 'CS-402';
    const docSummary =
      body.activeDocument?.summary ||
      'Lecture 4 covers Raft Consensus, Leader Election, randomized election timeouts (150-300ms), RequestVote and AppendEntries RPCs, Section 5.2 State Transitions, and Log Replication.';
    const mode = body.mode || 'Reasoning';

    const historyText = Array.isArray(body.history)
      ? body.history
          .slice(-6)
          .map((item) => `${item.role === 'user' ? 'Student' : 'Copilot'}: ${item.text}`)
          .join('\n')
      : '';

    const systemInstruction = [
      'You are EduTrack AI Academic Copilot, a crisp, helpful university academic assistant for Alex Rivera (CS Senior, Semester 7).',
      `Current active course document: ${docName} (${docCourse}).`,
      `Document summary & syllabus grounding: ${docSummary}`,
      body.assignmentsSummary ? `Current student assignments context: ${body.assignmentsSummary}` : '',
      `Mode: ${mode}. Provide accurate, practical, student-friendly explanations grounded in the referenced course materials.`,
      'Return structured JSON matching the schema with a concise title, intro paragraph, 2 to 4 actionable numbered steps, a targeted implementation/study callout, and the referenced source citation.',
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = historyText
      ? `Recent conversation:\n${historyText}\n\nNew student question: ${message}`
      : message;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: getThinkingLevel(mode),
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Short clear heading for the answer card, e.g. Key Summary: Raft Leader Election',
            },
            intro: {
              type: Type.STRING,
              description: 'Concise 1-2 sentence opening explanation.',
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: {
                    type: Type.STRING,
                    description: 'Short bold step title',
                  },
                  detail: {
                    type: Type.STRING,
                    description: 'Clear step explanation',
                  },
                },
                required: ['label', 'detail'],
              },
              description: '2 to 4 structured steps or key takeaways.',
            },
            calloutTitle: {
              type: Type.STRING,
              description: 'Short uppercase target label, e.g. Lab 4 Implementation Target or Study Focus',
            },
            calloutBody: {
              type: Type.STRING,
              description: 'Specific actionable recommendation or exam/lab tip.',
            },
            referencedSource: {
              type: Type.STRING,
              description: 'Specific section/slide reference within the active course document.',
            },
          },
          required: ['title', 'intro', 'steps', 'calloutTitle', 'calloutBody', 'referencedSource'],
        },
      },
    });

    const raw = (response.text ?? '{}').trim();
    const parsed = JSON.parse(raw);
    res.json({ ok: true, structured: parsed });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Failed to generate AI response.';
    console.error('AI Chat Error:', errMessage);
    res.status(500).json({ error: errMessage });
  }
});

app.post('/api/ai/flashcards', async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as FlashcardsRequestBody;
    const topic = body.topic?.trim() || 'Raft Consensus Leader Election';
    const courseCode = body.courseCode?.trim() || 'CS-402';
    const contextText = body.contextText?.trim() || '';

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Generate 4 concise, high-yield study flashcards for ${courseCode} on "${topic}". ${
        contextText ? `Use this study context: ${contextText}` : ''
      }`,
      config: {
        systemInstruction:
          'You create crisp university flashcards for active recall. Keep fronts as clear questions and backs as accurate 1-2 sentence answers with an optional short memory hint.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              hint: { type: Type.STRING },
            },
            required: ['front', 'back', 'hint'],
          },
        },
      },
    });

    const flashcards = JSON.parse((response.text ?? '[]').trim());
    res.json({ ok: true, flashcards });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Failed to generate flashcards.';
    console.error('AI Flashcards Error:', errMessage);
    res.status(500).json({ error: errMessage });
  }
});

app.post('/api/ai/faculty-insight', async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as FacultyInsightRequestBody;
    const courseCode = body.courseCode || 'CS-402';
    const submissionsSummary = body.submissionsSummary || '';

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Analyze cohort telemetry for ${courseCode} and provide a brief faculty teaching insight and 3 concrete instructional recommendations.\n${submissionsSummary}`,
      config: {
        systemInstruction:
          'You are an academic teaching assistant advisor helping university faculty identify student bottlenecks and intervene constructively.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            bottleneckAnalysis: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['headline', 'bottleneckAnalysis', 'recommendations'],
        },
      },
    });

    const insight = JSON.parse((response.text ?? '{}').trim());
    res.json({ ok: true, insight });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Failed to generate cohort insight.';
    console.error('AI Faculty Insight Error:', errMessage);
    res.status(500).json({ error: errMessage });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduTrack AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
