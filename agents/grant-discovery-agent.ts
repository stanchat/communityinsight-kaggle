/**
 * Grant Discovery Agent - Kaggle Competition Submission
 * Autonomous AI agent that discovers federal and foundation grants using Claude with function calling
 * 
 * This demonstrates advanced agentic AI where Claude:
 * - Decides which tools to call in what sequence
 * - Analyzes jurisdiction demographics to match grant eligibility
 * - Searches multiple grant databases autonomously
 * - Provides eligibility scoring and recommendations
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "your-api-key-here",
});

// Tool definitions for Claude function calling
const GRANT_DISCOVERY_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_jurisdiction_profile",
    description: "Get comprehensive demographic information about a jurisdiction. Returns population, income, poverty rate, demographics, and community characteristics from Census data.",
    input_schema: {
      type: "object",
      properties: {
        jurisdiction: {
          type: "string",
          description: "The jurisdiction name, e.g., 'Matteson, IL' or 'Cook County, IL'"
        }
      },
      required: ["jurisdiction"]
    }
  },
  {
    name: "search_federal_grants",
    description: "Search federal government grant opportunities from agencies like DOJ, HUD, EPA, DOE. Returns current opportunities with deadlines and requirements.",
    input_schema: {
      type: "object",
      properties: {
        focus_area: {
          type: "string",
          description: "Primary focus area (e.g., 'public safety', 'community development', 'education', 'infrastructure')"
        },
        agency: {
          type: "string",
          description: "Specific federal agency (e.g., 'DOJ', 'HUD', 'EPA') - optional"
        }
      },
      required: ["focus_area"]
    }
  },
  {
    name: "search_foundation_grants",
    description: "Search foundation and private grants database. Returns historical grants and active funders matching criteria.",
    input_schema: {
      type: "object",
      properties: {
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Keywords to search for (e.g., ['public safety', 'police', 'crime prevention'])"
        },
        location: {
          type: "string",
          description: "Geographic focus (e.g., 'Illinois', 'Midwest', 'Chicago')"
        },
        min_amount: {
          type: "number",
          description: "Minimum grant amount in dollars - optional"
        }
      },
      required: ["keywords"]
    }
  },
  {
    name: "match_grant_eligibility",
    description: "Analyze whether a jurisdiction meets eligibility criteria for specific grants based on demographics and characteristics.",
    input_schema: {
      type: "object",
      properties: {
        jurisdiction: {
          type: "string",
          description: "The jurisdiction to analyze"
        },
        grant_requirements: {
          type: "object",
          description: "Grant requirements to check (population size, poverty rate, etc.)"
        }
      },
      required: ["jurisdiction", "grant_requirements"]
    }
  }
];

// Sample tool implementations (would connect to real APIs in production)
const toolImplementations = {
  get_jurisdiction_profile: async (args: any) => {
    return {
      jurisdiction: args.jurisdiction,
      population: 18898,
      median_income: 65432,
      poverty_rate: 12.5,
      unemployment_rate: 6.2,
      demographics: {
        african_american: 82.1,
        white: 11.3,
        hispanic: 4.2,
        asian: 1.8
      },
      characteristics: ["suburban", "Cook County", "Chicago metro area"]
    };
  },
  
  search_federal_grants: async (args: any) => {
    return [
      {
        title: "Community Policing Development Program",
        agency: "Department of Justice",
        amount_range: "$100,000 - $750,000",
        deadline: "2025-03-15",
        focus_areas: ["public safety", "police", "community engagement"],
        eligibility: ["municipalities", "counties", "tribal governments"],
        url: "https://grants.gov/example1"
      },
      {
        title: "Community Development Block Grant",
        agency: "HUD",
        amount_range: "$50,000 - $5,000,000",
        deadline: "2025-04-30",
        focus_areas: ["infrastructure", "housing", "economic development"],
        eligibility: ["entitlement communities", "states", "counties"],
        url: "https://grants.gov/example2"
      }
    ];
  },
  
  search_foundation_grants: async (args: any) => {
    return [
      {
        funder: "MacArthur Foundation",
        program: "Safety and Justice Challenge",
        typical_amount: "$250,000",
        focus: "Criminal justice reform, community safety",
        geography: "Chicago metro area",
        past_recipients: ["Cook County", "City of Chicago"]
      }
    ];
  },
  
  match_grant_eligibility: async (args: any) => {
    return {
      eligible: true,
      confidence: 0.85,
      matching_criteria: ["population size", "geographic location", "poverty rate"],
      missing_criteria: [],
      recommendation: "Strong match - jurisdiction meets all major eligibility requirements"
    };
  }
};

export interface GrantDiscoveryResult {
  grantsFound: any[];
  totalMatches: number;
  eligibilityScores: Record<string, number>;
  reasoning: string;
  recommendations: string;
  tokenCount: number;
}

export class GrantDiscoveryAgent {
  /**
   * Execute autonomous grant discovery
   * Claude decides which tools to call, in what order, based on the query
   */
  async discoverGrants(jurisdiction: string, query: string): Promise<GrantDiscoveryResult> {
    console.log(`🔍 Starting grant discovery for ${jurisdiction}: "${query}"`);
    
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: `I need help finding grants for ${jurisdiction}. ${query}
        
Please:
1. Get demographic profile for the jurisdiction to understand eligibility
2. Search relevant federal and foundation grant databases
3. Match grants to jurisdiction's eligibility
4. Provide recommendations with reasoning`
      }
    ];

    let tokenCount = 0;
    const grantsFound: any[] = [];
    const eligibilityScores: Record<string, number> = {};
    
    // Agentic loop: Let Claude decide which tools to call
    while (true) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        tools: GRANT_DISCOVERY_TOOLS,
        messages
      });

      tokenCount += response.usage.input_tokens + response.usage.output_tokens;

      // Check if we're done
      if (response.stop_reason === "end_turn") {
        const finalContent = response.content.find(block => block.type === "text");
        return {
          grantsFound,
          totalMatches: grantsFound.length,
          eligibilityScores,
          reasoning: finalContent && 'text' in finalContent ? finalContent.text : "Analysis complete",
          recommendations: "See reasoning above",
          tokenCount
        };
      }

      // Add assistant's response to conversation
      messages.push({ role: "assistant", content: response.content });

      // Execute tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      
      for (const block of response.content) {
        if (block.type === "tool_use") {
          console.log(`🛠️  Calling tool: ${block.name}`);
          const toolFn = toolImplementations[block.name as keyof typeof toolImplementations];
          const result = await toolFn(block.input);
          
          // Store grants found
          if (Array.isArray(result)) {
            grantsFound.push(...result);
          }
          
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result)
          });
        }
      }

      // Add tool results to conversation
      messages.push({ role: "user", content: toolResults });
    }
  }
}

// Example usage
async function demo() {
  const agent = new GrantDiscoveryAgent();
  
  console.log("🤖 Grant Discovery Agent - Demo\n");
  
  const result = await agent.discoverGrants(
    "Matteson, IL",
    "Find public safety grants for our community policing program"
  );
  
  console.log("\n✅ Discovery Complete!");
  console.log(`Found ${result.totalMatches} matching grants`);
  console.log(`Tokens used: ${result.tokenCount}`);
  console.log(`\n💡 Reasoning:\n${result.reasoning}`);
  console.log(`\n📋 Grants:\n${JSON.stringify(result.grantsFound, null, 2)}`);
}

if (require.main === module) {
  demo().catch(console.error);
}
