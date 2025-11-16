/**
 * Demo Script - All 5 Autonomous AI Agents
 * 
 * This script demonstrates all 5 agents in action:
 * 1. Survey Builder Agent
 * 2. Grant Discovery Agent
 * 3. Ballot Research Agent
 * 4. School Discovery Agent
 * 5. Community Insight Agent
 * 
 * Run: npx tsx examples/demo-all-agents.ts
 */

import { SurveyBuilderAgent } from '../agents/survey-builder-agent';
import { GrantDiscoveryAgent } from '../agents/grant-discovery-agent';
import { BallotResearchAgent } from '../agents/ballot-research-agent';
import { SchoolDiscoveryAgent } from '../agents/school-discovery-agent';
import { CommunityInsightAgent } from '../agents/community-insight-agent';

async function main() {
  console.log("🤖 CommunityInsight.AI - All 5 Autonomous AI Agents Demo");
  console.log("=" .repeat(70));
  console.log("\n");

  try {
    // 1. Survey Builder Agent
    console.log("1️⃣  SURVEY BUILDER AGENT");
    console.log("-".repeat(70));
    const surveyAgent = new SurveyBuilderAgent();
    const survey = await surveyAgent.generateSurvey(
      "Create a survey about park safety concerns",
      "municipality_to_resident"
    );
    console.log(`✅ Generated survey: "${survey.title}"`);
    console.log(`   Questions: ${survey.questions.length}`);
    console.log(`   Reasoning: ${survey.reasoning}\n`);

    // 2. Grant Discovery Agent
    console.log("2️⃣  GRANT DISCOVERY AGENT");
    console.log("-".repeat(70));
    const grantAgent = new GrantDiscoveryAgent();
    const grants = await grantAgent.discoverGrants(
      "Matteson, IL",
      "Find public safety grants for our community policing program"
    );
    console.log(`✅ Found ${grants.totalMatches} matching grants`);
    console.log(`   Tokens used: ${grants.tokenCount}`);
    console.log(`   Top recommendation: ${grants.recommendations}\n`);

    // 3. Ballot Research Agent
    console.log("3️⃣  BALLOT RESEARCH AGENT");
    console.log("-".repeat(70));
    const ballotAgent = new BallotResearchAgent();
    const ballot = await ballotAgent.researchBallot(
      "123 Main St, Chicago, IL 60609"
    );
    console.log(`✅ Researched ${ballot.candidatesResearched} candidates`);
    console.log(`   Races analyzed: ${ballot.racesAnalyzed}`);
    console.log(`   Tokens used: ${ballot.tokenCount}\n`);

    // 4. School Discovery Agent
    console.log("4️⃣  SCHOOL DISCOVERY AGENT");
    console.log("-".repeat(70));
    const schoolAgent = new SchoolDiscoveryAgent();
    const schools = await schoolAgent.discoverSchools(
      "4605 South State Street, Chicago, IL 60609",
      "Chicago, IL"
    );
    console.log(`✅ Found ${schools.schoolsFound} schools`);
    console.log(`   Tokens used: ${schools.tokenCount}\n`);

    // 5. Community Insight Agent
    console.log("5️⃣  COMMUNITY INSIGHT AGENT");
    console.log("-".repeat(70));
    const insightAgent = new CommunityInsightAgent();
    const insights = await insightAgent.analyzeCommunityConcerns(
      "Matteson, IL"
    );
    console.log(`✅ Analyzed ${insights.feedbackAnalyzed} feedback items`);
    console.log(`   Issue clusters: ${insights.issuesClustered}`);
    console.log(`   Tokens used: ${insights.tokenCount}\n`);

    // Summary
    console.log("=" .repeat(70));
    console.log("✅ ALL 5 AGENTS COMPLETED SUCCESSFULLY!");
    console.log("=" .repeat(70));
    console.log("\nTotal Agent Capabilities Demonstrated:");
    console.log("  • Survey generation with AI");
    console.log("  • Grant discovery with function calling");
    console.log("  • Ballot research with autonomous tool selection");
    console.log("  • School discovery with multi-source verification");
    console.log("  • Community insight with sentiment analysis\n");

    console.log("🌐 Live Platform: https://communityinsight.ai");
    console.log("📖 Documentation: See README.md");
    console.log("🏆 Kaggle Competition: Agents for Good Track\n");

  } catch (error) {
    console.error("❌ Error running demo:", error);
    process.exit(1);
  }
}

main();
