/**
 * Survey Builder Agent - Kaggle Competition Submission
 * Autonomous AI agent that generates professional community surveys using Claude 4.5 Sonnet or Google Gemini
 * 
 * This demonstrates the agentic AI pattern where the LLM autonomously:
 * - Analyzes user requirements
 * - Designs survey structure
 * - Generates questions with appropriate types
 * - Adapts point-of-view (municipality to resident, resident to municipality, neutral)
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "your-api-key-here",
});

interface SurveyQuestion {
  questionText: string;
  questionType: "multiple_choice" | "checkbox" | "text" | "long_text" | "rating" | "dropdown" | "priority_ranking";
  description?: string;
  options?: string[];
  isRequired: boolean;
  orderIndex: number;
}

interface GeneratedSurvey {
  title: string;
  description: string;
  introText: string;
  outroText: string;
  primaryColor: string;
  questions: SurveyQuestion[];
  reasoning?: string;
}

export class SurveyBuilderAgent {
  /**
   * Generate a survey using AI based on natural language prompt
   * 
   * @param prompt - Natural language description of survey needs (e.g., "Create a survey about park safety")
   * @param pointOfView - Perspective: "municipality_to_resident", "resident_to_municipality", or "neutral_facilitator"
   * @returns Generated survey with questions, intro/outro text, and design choices
   */
  async generateSurvey(
    prompt: string, 
    pointOfView: string = "municipality_to_resident"
  ): Promise<GeneratedSurvey> {
    const povGuidance = {
      municipality_to_resident: `Survey POV: Municipality asking residents for feedback.
- Use "our community", "our services", "we provide"
- Frame questions from the perspective of a municipality asking residents for input
- Example: "How satisfied are you with our park maintenance?"`,
      resident_to_municipality: `Survey POV: Residents requesting improvements from municipality.
- Use "I need", "My neighborhood needs", "I would like to see"
- Frame questions from the perspective of residents identifying needs
- Example: "What improvements do you need in your neighborhood?"`,
      neutral_facilitator: `Survey POV: Neutral third party collecting community data.
- Use objective, neutral language
- Avoid possessive terms like "our" or "my"
- Example: "How would you rate the quality of park maintenance in the community?"`,
    };

    const systemPrompt = `You are an expert survey designer for municipal governments and community organizations. Your role is to create effective, well-structured surveys based on user descriptions.

${povGuidance[pointOfView as keyof typeof povGuidance] || povGuidance.municipality_to_resident}

AVAILABLE QUESTION TYPES:
- multiple_choice: Radio buttons (select one option)
- checkbox: Checkboxes (select multiple options)
- text: Short text input (single line)
- long_text: Long text input (paragraph)
- rating: 1-5 star rating scale
- dropdown: Dropdown select menu
- priority_ranking: Drag-to-rank priority list

SURVEY DESIGN PRINCIPLES:
1. Keep surveys focused and concise (5-15 questions ideal)
2. Start with easy, non-sensitive questions
3. Group related questions together
4. Use clear, unbiased language consistent with the specified POV
5. Provide context/descriptions for complex questions
6. Make strategic questions required (avoid making everything required)
7. Use appropriate question types for the data you need
8. Include demographic questions at the END if needed

RESPONSE FORMAT:
You must respond with a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "title": "Survey title",
  "description": "Brief survey description",
  "introText": "Welcome message explaining the survey's purpose",
  "outroText": "Thank you message",
  "primaryColor": "#3b82f6",
  "questions": [
    {
      "questionText": "Question text here",
      "questionType": "multiple_choice",
      "description": "Optional clarification",
      "options": ["Option 1", "Option 2", "Option 3"],
      "isRequired": true,
      "orderIndex": 0
    }
  ],
  "reasoning": "Brief explanation of your design choices"
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Parse JSON response
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    return JSON.parse(jsonMatch[0]);
  }
}

// Example usage
async function demo() {
  const agent = new SurveyBuilderAgent();
  
  console.log("🤖 Survey Builder Agent - Demo");
  console.log("Generating survey about park safety...\n");
  
  const survey = await agent.generateSurvey(
    "Create a survey about park safety concerns",
    "municipality_to_resident"
  );
  
  console.log("✅ Generated Survey:");
  console.log(JSON.stringify(survey, null, 2));
  console.log(`\n📊 Created ${survey.questions.length} questions`);
  console.log(`💡 Reasoning: ${survey.reasoning}`);
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}
