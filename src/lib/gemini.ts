import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({});
  }
  return aiClient;
}

const MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

export async function generatePreVisitSummary(symptoms: string) {
  const ai = getAI();
  const prompt = `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: ${symptoms}`;
  
  const timeoutMs = 10000;
  let lastError: any = null;

  for (const model of MODELS) {
    let attempt = 0;
    while (attempt < 2) {
      let timeoutId: NodeJS.Timeout | undefined;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Gemini API timeout after 10000ms')), timeoutMs);
        });

        const apiPromise = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                urgency: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                chiefComplaint: { type: 'string' },
                questions: { type: 'array', items: { type: 'string' } }
              },
              required: ['urgency', 'chiefComplaint', 'questions']
            }
          }
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        
        if (!response.text) {
          throw new Error('Empty response received from Gemini');
        }

        const parsed = JSON.parse(response.text);
        let urgency = parsed.urgency;
        if (!['Low', 'Medium', 'High'].includes(urgency)) {
          if (typeof urgency === 'string' && urgency.toLowerCase().includes('high')) urgency = 'High';
          else if (typeof urgency === 'string' && urgency.toLowerCase().includes('low')) urgency = 'Low';
          else urgency = 'Medium';
        }
        parsed.urgency = urgency;
        return parsed;
      } catch (e: any) {
        if (timeoutId) clearTimeout(timeoutId);
        attempt++;
        lastError = e;
        console.error(`[Gemini Pre-Visit] Attempt ${attempt} failed on model ${model}:`, e?.message || e);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  throw new Error(`Failed all Gemini model attempts: ${lastError?.message || lastError}`);
}

export async function generatePostVisitSummary(notes: string, prescription?: string) {
  const ai = getAI();
  const context = prescription ? `Clinical Notes:\n${notes}\n\nPrescription:\n${prescription}` : `Clinical Notes:\n${notes}`;
  const prompt = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: ${context}`;
  
  const timeoutMs = 10000;
  let lastError: any = null;

  for (const model of MODELS) {
    let attempt = 0;
    while (attempt < 2) {
      let timeoutId: NodeJS.Timeout | undefined;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Gemini API timeout after 10000ms')), timeoutMs);
        });

        const apiPromise = ai.models.generateContent({
          model,
          contents: prompt
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        
        return response.text || '';
      } catch (e: any) {
        if (timeoutId) clearTimeout(timeoutId);
        attempt++;
        lastError = e;
        console.error(`[Gemini Post-Visit] Attempt ${attempt} failed on model ${model}:`, e?.message || e);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  throw new Error(`Failed all Gemini model attempts: ${lastError?.message || lastError}`);
}



