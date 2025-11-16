/**
 * Community Insight Agent - Kaggle Competition Submission
 * Autonomous AI agent that analyzes community feedback and generates action plans using Claude
 * 
 * Transforms citizen feedback into actionable intelligence by autonomously:
 * - Fetching feedback from multiple sources (surveys, 311 requests, social media)
 * - Analyzing sentiment and identifying themes
 * - Clustering similar issues across data sources
 * - Generating prioritized action plans with recommendations
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "your-api-key-here",
});

const COMMUNITY_INSIGHT_TOOLS: Anthropic.Tool[] = [
  {
    name: "fetch_community_feedback",
    description: "Retrieve community feedback from surveys and resident input. Returns feedback with text, sentiment, and categories.",
    input_schema: {
      type: "object",
      properties: {
        jurisdiction: {
          type: "string",
          description: "Municipality name (e.g., 'Matteson, IL')"
        },
        limit: {
          type: "number",
          description: "Maximum entries to return (default: 100)"
        },
        category_filter: {
          type: "string",
          description: "Optional category filter (e.g., 'infrastructure', 'public_safety')"
        }
      },
      required: ["jurisdiction"]
    }
  },
  {
    name: "fetch_311_service_requests",
    description: "Get 311 service request data showing types, statuses, locations, and resolution times.",
    input_schema: {
      type: "object",
      properties: {
        jurisdiction: {
          type: "string",
          description: "Municipality name"
        },
        days_back: {
          type: "number",
          description: "Days of historical data (default: 90)"
        }
      },
      required: ["jurisdiction"]
    }
  },
  {
    name: "fetch_social_media_insights",
    description: "Get social media data from municipal pages and community groups. Returns posts, comments, and sentiment.",
    input_schema: {
      type: "object",
      properties: {
        jurisdiction: {
          type: "string",
          description: "Municipality name"
        },
        sources: {
          type: "array",
          items: { type: "string" },
          description: "Sources to include (e.g., ['facebook', 'twitter', 'youtube'])"
        },
        days_back: {
          type: "number",
          description: "Historical data window in days (default: 30)"
        }
      },
      required: ["jurisdiction"]
    }
  },
  {
    name: "cluster_similar_issues",
    description: "Use AI to cluster and categorize similar concerns across data sources into thematic issues.",
    input_schema: {
      type: "object",
      properties: {
        data_sources: {
          type: "array",
          description: "Data sources with items to cluster"
        },
        max_clusters: {
          type: "number",
          description: "Maximum issue clusters (default: 10)"
        }
      },
      required: ["data_sources"]
    }
  },
  {
    name: "generate_action_plan",
    description: "Generate prioritized action plan based on identified issues with recommendations and resource estimates.",
    input_schema: {
      type: "object",
      properties: {
        issues: {
          type: "array",
          description: "Identified issues to address"
        },
        constraints: {
          type: "object",
          description: "Budget and resource constraints"
        }
      },
      required: ["issues"]
    }
  }
];

const toolImplementations = {
  fetch_community_feedback: async (args: any) => {
    return [
      {
        id: 1,
        text: "The lighting in Central Park is inadequate, making it unsafe after dark",
        sentiment: "negative",
        category: "public_safety",
        date: "2024-10-15"
      },
      {
        id: 2,
        text: "We need more after-school programs for middle school students",
        sentiment: "neutral",
        category: "education",
        date: "2024-10-16"
      },
      {
        id: 3,
        text: "Potholes on Main Street are getting worse every month",
        sentiment: "negative",
        category: "infrastructure",
        date: "2024-10-17"
      }
    ];
  },
  
  fetch_311_service_requests: async (args: any) => {
    return {
      total_requests: 452,
      top_categories: [
        { type: "Pothole", count: 89, avg_resolution_days: 12 },
        { type: "Streetlight Out", count: 67, avg_resolution_days: 8 },
        { type: "Graffiti Removal", count: 45, avg_resolution_days: 5 },
        { type: "Tree Trimming", count: 38, avg_resolution_days: 21 }
      ],
      recent_trends: "Pothole requests increased 35% in last 30 days"
    };
  },
  
  fetch_social_media_insights: async (args: any) => {
    return {
      posts_analyzed: 234,
      top_topics: [
        { topic: "Park safety concerns", mentions: 45, sentiment: -0.6 },
        { topic: "Road maintenance", mentions: 38, sentiment: -0.7 },
        { topic: "Community events", mentions: 32, sentiment: 0.8 },
        { topic: "School funding", mentions: 28, sentiment: -0.4 }
      ],
      overall_sentiment: -0.2,
      engagement_rate: 0.15
    };
  },
  
  cluster_similar_issues: async (args: any) => {
    return {
      clusters: [
        {
          theme: "Infrastructure Maintenance",
          count: 127,
          severity: "high",
          examples: ["potholes", "road repair", "sidewalk cracks"],
          affected_areas: ["Main Street", "Oak Avenue", "Park Road"]
        },
        {
          theme: "Public Safety & Lighting",
          count: 92,
          severity: "high",
          examples: ["inadequate lighting", "park safety", "security cameras"],
          affected_areas: ["Central Park", "Downtown", "Residential areas"]
        },
        {
          theme: "Youth Programs & Education",
          count: 60,
          severity: "medium",
          examples: ["after-school programs", "library hours", "sports facilities"],
          affected_areas: ["Community Center", "Schools", "Parks"]
        }
      ]
    };
  },
  
  generate_action_plan: async (args: any) => {
    return {
      priorities: [
        {
          rank: 1,
          issue: "Infrastructure Maintenance",
          action: "Emergency pothole repair program for Main Street corridor",
          estimated_cost: "$75,000",
          timeline: "30 days",
          impact: "Addresses 127 resident complaints and improves safety",
          funding_sources: ["Municipal budget", "State infrastructure grants"]
        },
        {
          rank: 2,
          issue: "Public Safety & Lighting",
          action: "Install LED lighting in Central Park and high-traffic areas",
          estimated_cost: "$50,000",
          timeline: "45 days",
          impact: "Addresses 92 safety concerns, reduces crime risk",
          funding_sources: ["Community Safety Grant", "Energy efficiency rebates"]
        },
        {
          rank: 3,
          issue: "Youth Programs",
          action: "Expand after-school programs at Community Center",
          estimated_cost: "$25,000/year",
          timeline: "60 days to launch",
          impact: "Serves 60+ families, addresses education gap",
          funding_sources: ["State education funds", "Private foundations"]
        }
      ],
      total_estimated_cost: "$150,000 initial + $25K/year ongoing",
      grant_opportunities: 3
    };
  }
};

export interface CommunityInsightResult {
  feedbackAnalyzed: number;
  issuesClustered: number;
  actionPlan: any;
  summary: string;
  tokenCount: number;
}

export class CommunityInsightAgent {
  /**
   * Autonomously analyze community data and generate action plan
   */
  async analyzeCommunityConcerns(jurisdiction: string): Promise<CommunityInsightResult> {
    console.log(`💡 Starting community insight analysis for: ${jurisdiction}`);
    
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: `I need a comprehensive analysis of community concerns for ${jurisdiction}.

Please:
1. Fetch community feedback from surveys and resident input
2. Get 311 service request data to identify systemic issues
3. Analyze social media to understand public sentiment
4. Cluster similar issues across all data sources
5. Generate a prioritized action plan with cost estimates and funding sources

Focus on identifying the most pressing issues that affect the most residents.`
      }
    ];

    let tokenCount = 0;
    let feedbackAnalyzed = 0;
    let actionPlan: any = null;
    
    while (true) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        tools: COMMUNITY_INSIGHT_TOOLS,
        messages
      });

      tokenCount += response.usage.input_tokens + response.usage.output_tokens;

      if (response.stop_reason === "end_turn") {
        const finalContent = response.content.find(block => block.type === "text");
        return {
          feedbackAnalyzed,
          issuesClustered: 3, // From sample data
          actionPlan,
          summary: finalContent && 'text' in finalContent ? finalContent.text : "Analysis complete",
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
          
          if (block.name === "fetch_community_feedback" && Array.isArray(result)) {
            feedbackAnalyzed += result.length;
          }
          if (block.name === "generate_action_plan") {
            actionPlan = result;
          }
          
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
  const agent = new CommunityInsightAgent();
  
  console.log("🤖 Community Insight Agent - Demo\n");
  
  const result = await agent.analyzeCommunityConcerns("Matteson, IL");
  
  console.log("\n✅ Analysis Complete!");
  console.log(`Analyzed ${result.feedbackAnalyzed} feedback items`);
  console.log(`Identified ${result.issuesClustered} issue clusters`);
  console.log(`Tokens used: ${result.tokenCount}`);
  console.log(`\n💡 Summary:\n${result.summary}`);
  console.log(`\n📋 Action Plan:\n${JSON.stringify(result.actionPlan, null, 2)}`);
}

if (require.main === module) {
  demo().catch(console.error);
}
