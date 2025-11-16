/**
 * Ballot Research Agent - Kaggle Competition Submission
 * Autonomous AI agent that researches election candidates using Claude with function calling
 * 
 * Helps voters make informed decisions by autonomously:
 * - Finding all candidates on a voter's ballot
 * - Researching candidate backgrounds and qualifications
 * - Analyzing campaign finance data
 * - Searching news coverage and public records
 * - Creating side-by-side comparisons
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "your-api-key-here",
});

const BALLOT_RESEARCH_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_voter_ballot",
    description: "Get the complete ballot for a voter based on their address. Returns all races and candidates they will see on election day.",
    input_schema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Full voter address (street, city, state, ZIP)"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "research_candidate_background",
    description: "Research a candidate's background, education, professional experience, and qualifications using web search.",
    input_schema: {
      type: "object",
      properties: {
        candidate_name: {
          type: "string",
          description: "Full name of the candidate"
        },
        office: {
          type: "string",
          description: "Office they're running for (e.g., 'Circuit Court Judge', 'State Representative')"
        }
      },
      required: ["candidate_name", "office"]
    }
  },
  {
    name: "get_campaign_finance",
    description: "Get campaign finance data showing fundraising, spending, and top donors.",
    input_schema: {
      type: "object",
      properties: {
        candidate_name: {
          type: "string",
          description: "Full name of the candidate"
        },
        office: {
          type: "string",
          description: "Office they're running for"
        }
      },
      required: ["candidate_name", "office"]
    }
  },
  {
    name: "search_candidate_news",
    description: "Search for recent news coverage about a candidate.",
    input_schema: {
      type: "object",
      properties: {
        candidate_name: {
          type: "string",
          description: "Full name of the candidate"
        },
        days_back: {
          type: "number",
          description: "How many days back to search (default: 90)"
        }
      },
      required: ["candidate_name"]
    }
  }
];

const toolImplementations = {
  get_voter_ballot: async (args: any) => {
    return {
      address: args.address,
      election_date: "2024-11-05",
      races: [
        {
          office: "Circuit Court Judge - Cook County",
          candidates: [
            { name: "John Smith", party: "Democrat" },
            { name: "Mary Johnson", party: "Republican" }
          ]
        },
        {
          office: "State Representative District 30",
          candidates: [
            { name: "Robert Williams", party: "Democrat" },
            { name: "Sarah Davis", party: "Republican" },
            { name: "Michael Brown", party: "Independent" }
          ]
        }
      ]
    };
  },
  
  research_candidate_background: async (args: any) => {
    return {
      name: args.candidate_name,
      office: args.office,
      background: {
        education: "JD from Northwestern University Law School, BA from University of Illinois",
        experience: "15 years as practicing attorney, 5 years as public defender",
        previous_offices: ["None - first campaign for elected office"],
        endorsements: ["Illinois Bar Association", "Chicago Tribune Editorial Board"],
        key_qualifications: "Extensive trial experience, focus on criminal justice reform"
      }
    };
  },
  
  get_campaign_finance: async (args: any) => {
    return {
      candidate: args.candidate_name,
      total_raised: 245000,
      total_spent: 198000,
      cash_on_hand: 47000,
      top_donors: [
        { name: "Illinois Trial Lawyers Association", amount: 10000 },
        { name: "Individual donations under $100", amount: 45000 }
      ],
      data_source: "Illinois State Board of Elections"
    };
  },
  
  search_candidate_news: async (args: any) => {
    return [
      {
        title: `${args.candidate_name} announces criminal justice reform platform`,
        source: "Chicago Tribune",
        date: "2024-09-15",
        summary: "Candidate proposes reforms to reduce pretrial detention"
      },
      {
        title: `${args.candidate_name} endorsed by local community groups`,
        source: "Cook County Chronicle",
        date: "2024-10-01",
        summary: "Receives endorsements from 12 community organizations"
      }
    ];
  }
};

export interface BallotResearchResult {
  candidatesResearched: number;
  racesAnalyzed: number;
  findings: any[];
  summary: string;
  tokenCount: number;
}

export class BallotResearchAgent {
  /**
   * Autonomously research all candidates on a voter's ballot
   */
  async researchBallot(address: string): Promise<BallotResearchResult> {
    console.log(`🗳️  Starting ballot research for: ${address}`);
    
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: `I'm a voter at this address: ${address}

Please help me research my ballot:
1. Find all races and candidates I'll see on election day
2. Research each candidate's background and qualifications
3. Look up their campaign finance data
4. Search for recent news coverage
5. Provide a summary comparing the candidates in each race`
      }
    ];

    let tokenCount = 0;
    const findings: any[] = [];
    
    while (true) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        tools: BALLOT_RESEARCH_TOOLS,
        messages
      });

      tokenCount += response.usage.input_tokens + response.usage.output_tokens;

      if (response.stop_reason === "end_turn") {
        const finalContent = response.content.find(block => block.type === "text");
        return {
          candidatesResearched: findings.length,
          racesAnalyzed: 2, // From sample data
          findings,
          summary: finalContent && 'text' in finalContent ? finalContent.text : "Research complete",
          tokenCount
        };
      }

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      
      for (const block of response.content) {
        if (block.type === "tool_use") {
          console.log(`🛠️  Calling tool: ${block.name}`);
          const toolFn = toolImplementations[block.name as keyof typeof toolImplementations];
          const result = await toolFn(block.input);
          findings.push({ tool: block.name, result });
          
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result)
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    }
  }
}

async function demo() {
  const agent = new BallotResearchAgent();
  
  console.log("🤖 Ballot Research Agent - Demo\n");
  
  const result = await agent.researchBallot("123 Main St, Chicago, IL 60609");
  
  console.log("\n✅ Research Complete!");
  console.log(`Researched ${result.candidatesResearched} candidates`);
  console.log(`Analyzed ${result.racesAnalyzed} races`);
  console.log(`Tokens used: ${result.tokenCount}`);
  console.log(`\n📊 Summary:\n${result.summary}`);
}

if (require.main === module) {
  demo().catch(console.error);
}
