/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI client lazily to avoid startup crashes if key is missing.
let aiClient: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI | null => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        console.log('Gemini client successfully initialized.');
      } catch (e) {
        console.error('Error initializing Gemini client:', e);
      }
    } else {
      console.warn('GEMINI_API_KEY is not defined. Using smart local simulator fallbacks.');
    }
  }
  return aiClient;
};

// ==========================================
// API ENDPOINTS FOR DIGITAL TWIN LOGIC
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Endpoint 1: Recalibrate Digital Twin after new Real-Time activities
app.post('/api/predict-twin-recalibration', async (req, res) => {
  const { customerName, customerEmail, summary, activities, originalTwin } = req.body;

  if (!customerName || !activities) {
    return res.status(400).json({ error: 'Missing customer context data.' });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `
You are TwinMind AI Engine. Read the customer context, historical or newly added activities, and old digital twin settings, and calibrate the updated Digital Twin Profile.

Customer Name: ${customerName}
Customer Segment/Vibe: ${summary}
Activities: ${JSON.stringify(activities.slice(-10))} // check latest activities in detail
Original Twin settings: ${JSON.stringify(originalTwin)}

Determine their real-time updated metrics:
1. interests: core keywords (e.g. "Luxury Bags", "Audio", "Discount Codes")
2. buyingPatterns: summary of how they shop
3. preferredChannel: string ('Email' | 'SMS' | 'Push' | 'Social Ad')
4. preferredTime: string ('Morning (8AM - 11AM)' | 'Afternoon (12PM - 4PM)' | 'Evening (5PM - 9PM)' | 'Night (10PM - 12AM)')
5. spendingBehavior: string ('Budget-Conscious' | 'Moderate' | 'High-Spender' | 'Luxury-driven')
6. engagementLevel: score 0 to 100
7. purchaseProbability: score 0 to 100
8. churnRisk: score 0 to 100
9. clv: total estimated value matching shopping behavior (e.g. 100 - 5000)
10. recommendedTactics: array of 3 actionable micro-experiments (e.g., "Send personalized fast shipping coupon")
11. personalizedMessageHeadline: high-converting targeted header
12. personalizedMessageBody: high-converting short body tailored to preferred communication channel
13. recalibrationFeedback: human-friendly, highly analytical explanation about WHY the digital twin metrics changed due to the customer's newest activities. (e.g., "Sarah interest shifted deeply to Premium Audio; purchase intent increased +15% but urgent questions on shipping speed indicates barrier.")

Ensure all scores are logical and react dynamically. Only return the parsed JSON inside the schema.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interests: { type: Type.ARRAY, items: { type: Type.STRING } },
              buyingPatterns: { type: Type.STRING },
              preferredChannel: { type: Type.STRING },
              preferredTime: { type: Type.STRING },
              spendingBehavior: { type: Type.STRING },
              engagementLevel: { type: Type.INTEGER },
              purchaseProbability: { type: Type.INTEGER },
              churnRisk: { type: Type.INTEGER },
              clv: { type: Type.INTEGER },
              recommendedTactics: { type: Type.ARRAY, items: { type: Type.STRING } },
              personalizedMessageHeadline: { type: Type.STRING },
              personalizedMessageBody: { type: Type.STRING },
              recalibrationFeedback: { type: Type.STRING },
            },
            required: [
              'interests', 'buyingPatterns', 'preferredChannel', 'preferredTime',
              'spendingBehavior', 'engagementLevel', 'purchaseProbability',
              'churnRisk', 'clv', 'recommendedTactics',
              'personalizedMessageHeadline', 'personalizedMessageBody', 'recalibrationFeedback'
            ],
          },
        },
      });

      const responseText = response.text || '{}';
      const updatedProfile = JSON.parse(responseText);
      return res.json({ updatedProfile });
    } catch (err: any) {
      console.error('Gemini recalibration error:', err);
      // Fallback below
    }
  }

  // Smart local fallback execution in case API key is missing or errors out:
  console.log('Using local rule-engine for Digital Twin recalibration.');
  
  // Calculate dynamic updates based on newest activities
  const latestActivity = activities[activities.length - 1];
  let purchaseProbability = originalTwin.purchaseProbability || 50;
  let churnRisk = originalTwin.churnRisk || 30;
  let engagementLevel = originalTwin.engagementLevel || 60;
  let interests = [...originalTwin.interests];
  let feedback = `Local Simulator Engine adjusted metrics based on recent ${latestActivity?.type} interaction.`;
  let recommendedTactics = [...originalTwin.recommendedTactics];
  let preferredChannel = originalTwin.preferredChannel;

  if (latestActivity) {
    if (latestActivity.type === 'purchase') {
      purchaseProbability = Math.min(95, purchaseProbability + 15);
      churnRisk = Math.max(5, churnRisk - 10);
      engagementLevel = Math.min(100, engagementLevel + 20);
      feedback = `Recalibrated twin: High-conversion purchasing event of ${latestActivity.value ? '$' + latestActivity.value : 'goods'} triggers extreme loyalty loop. Purchase probability reaches peak.`;
    } else if (latestActivity.type === 'abandonment') {
      purchaseProbability = Math.max(10, purchaseProbability - 25);
      churnRisk = Math.min(95, churnRisk + 15);
      engagementLevel = Math.max(10, engagementLevel - 15);
      feedback = `Recalibrated twin: Cart abandonment warning detected. Digital model flags exit threat and drops purchase probability by 25%. Churn risk elevated.`;
      if (!recommendedTactics.includes('Trigger cart recovery SMS with free courier delivery')) {
        recommendedTactics.unshift('Trigger cart recovery SMS with free courier delivery');
      }
    } else if (latestActivity.type === 'support_conversation') {
      engagementLevel = Math.min(100, engagementLevel + 10);
      if (latestActivity.description.toLowerCase().includes('shipping') || latestActivity.description.toLowerCase().includes('delay')) {
        churnRisk = Math.min(90, churnRisk + 10);
        feedback = `Recalibrated twin: Customer raised shipping delivery speed anxieties. Digital twin simulated negative sentiment and recommends instant rapid shipping tier offer.`;
      } else {
        feedback = `Recalibrated twin: support issue active. Twin shows anxious high-retention concern. Recommend personal response.`;
      }
    } else if (latestActivity.type === 'search' || latestActivity.type === 'view') {
      purchaseProbability = Math.min(90, purchaseProbability + 8);
      engagementLevel = Math.min(100, engagementLevel + 5);
      feedback = `Recalibrated twin: Highly targeted browsing of category items observed. Interest level calibrated upwards.`;
      const cat = latestActivity.category || 'New Trends';
      if (!interests.includes(cat)) {
        interests.push(cat);
      }
    }
  }

  // Formulate fallback personalized output
  const brandPref = interests[0] || 'Premium items';
  const headline = `Exclusive: The Perfect Match For You`;
  const body = `We noticed you're exploring the latest in ${brandPref}. Here is an invite to order with express handling. Use code TWINLOOPS.`;

  return res.json({
    updatedProfile: {
      ...originalTwin,
      interests: Array.from(new Set(interests)),
      purchaseProbability,
      churnRisk,
      engagementLevel,
      recommendedTactics: recommendedTactics.slice(0, 4),
      personalizedMessageHeadline: headline,
      personalizedMessageBody: body,
      recalibrationFeedback: feedback,
    },
  });
});

// Endpoint 2: Simulate Campaign before Launch
app.post('/api/simulate-campaign', async (req, res) => {
  const { campaign, customers } = req.body;

  if (!campaign || !customers) {
    return res.status(400).json({ error: 'Missing campaign or customer variables.' });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `
You are TwinMind Predictive Engine. Simulate sending a marketing campaign to our list of customer digital twins. Return a CampaignSimulationResult JSON object.

CAMPAIGN PARAMETERS:
- Name: ${campaign.name}
- Communication Mode/Channel: ${campaign.channel}
- Discount percentage: ${campaign.discount}%
- Copy Message Draft: "${campaign.message}"
- Targeted Segment Filters: ${campaign.targetSegment}

CUSTOMER DIGITAL TWINS:
${JSON.stringify(customers.map((c: any) => ({
  id: c.id,
  name: c.name,
  segment: c.segment,
  spendingBehavior: c.twin.spendingBehavior,
  preferredChannel: c.twin.preferredChannel,
  purchaseProbability: c.twin.purchaseProbability,
  churnRisk: c.twin.churnRisk,
  interests: c.twin.interests,
  clv: c.twin.clv
})))}

Simulate exactly how each of these specific customers react based on:
1. Do they prefer this channel? (e.g. if SMS vs Email)
2. Does the discount appeal to their budget setting?
3. What is the predicted conversion, engagement index (0-100), and short personalized explanation text of their response decision?

Calculate cumulative totals:
- expectedReach (how many match target segment)
- expectedConversionRate (overall average conversion % predicted)
- expectedRevenue (estimated absolute dollar sum based on response rate and user CLV/spending)
- expectedEngagement: 'High' | 'Medium' | 'Low'
- expectedChurnImpact: 'Positive' | 'Neutral' | 'Negative'
- explanation: A concise summary of why the campaign performed this way.

Ensure that the customerReactions list contains predictions matching ALL customers provided in the request body. Return ONLY JSON matching schema:
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              expectedConversionRate: { type: Type.NUMBER },
              expectedEngagement: { type: Type.STRING },
              expectedRevenue: { type: Type.NUMBER },
              expectedReach: { type: Type.INTEGER },
              expectedChurnImpact: { type: Type.STRING },
              explanation: { type: Type.STRING },
              segmentBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    segmentName: { type: Type.STRING },
                    conversionRate: { type: Type.NUMBER },
                    interestLevel: { type: Type.INTEGER },
                    reaction: { type: Type.STRING },
                  },
                  required: ['segmentName', 'conversionRate', 'interestLevel', 'reaction'],
                },
              },
              customerReactions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    customerId: { type: Type.STRING },
                    customerName: { type: Type.STRING },
                    willConvert: { type: Type.BOOLEAN },
                    engagementScore: { type: Type.INTEGER },
                    reactionText: { type: Type.STRING },
                  },
                  required: ['customerId', 'customerName', 'willConvert', 'engagementScore', 'reactionText'],
                },
              },
            },
            required: [
              'expectedConversionRate', 'expectedEngagement', 'expectedRevenue',
              'expectedReach', 'expectedChurnImpact', 'explanation',
              'segmentBreakdown', 'customerReactions'
            ],
          },
        },
      });

      const responseText = response.text || '{}';
      return res.json(JSON.parse(responseText));
    } catch (err: any) {
      console.error('Gemini Campaign Simulation error:', err);
    }
  }

  // Simple, deterministic local algorithm fallback:
  console.log('Using local heuristic simulation logic representing marketing cohorts.');
  
  const discountVal = Number(campaign.discount);
  const targetSeg = campaign.targetSegment; // 'All' or specific segments
  let reach = 0;
  let conversions = 0;
  let totalCap = 0;

  const reactions = customers.map((c: any) => {
    let matchesSegment = true;
    if (targetSeg !== 'All' && !c.segment.toLowerCase().includes(targetSeg.toLowerCase()) && !c.name.toLowerCase().includes(targetSeg.toLowerCase())) {
      matchesSegment = false;
    }

    if (matchesSegment) {
      reach++;
    }

    // Reaction calculations base
    let channelScore = (c.twin.preferredChannel.toLowerCase() === campaign.channel.toLowerCase()) ? 30 : 0;
    let budgetFactor = 0;
    if (c.twin.spendingBehavior === 'Budget-Conscious') {
      budgetFactor = discountVal >= 20 ? 40 : (discountVal > 0 ? 15 : -10);
    } else if (c.twin.spendingBehavior === 'Luxury-driven') {
      budgetFactor = discountVal > 30 ? -5 : 15; // Luxury customers ignore high discounts or suspect quality drops
    } else {
      budgetFactor = discountVal >= 10 ? 20 : 5;
    }

    const totalReactionPower = c.twin.purchaseProbability * 0.4 + channelScore + budgetFactor;
    const willConvert = matchesSegment && totalReactionPower >= 55;
    const engagementScore = Math.min(100, Math.max(10, Math.floor(totalReactionPower + randomRange(-10, 10))));

    if (willConvert) {
      conversions++;
      const baseValue = c.twin.clv ? c.twin.clv * 0.15 : 100;
      totalCap += Math.floor(baseValue * (1 - discountVal / 100));
    }

    // Set custom reaction messages
    let reactionText = '';
    if (!matchesSegment) {
      reactionText = `Filtered out. This campaign was targeted at "${targetSeg}" segment exclusively.`;
    } else if (willConvert) {
      reactionText = `Responded eagerly to ${campaign.channel} containing a ${discountVal}% discount. Fits their ${c.twin.spendingBehavior} profile and active interests of ${c.twin.interests.join(', ')}.`;
    } else {
      reactionText = `Passive. Disliked channel choice or deemed incentive of ${discountVal}% too low for conversion. Risk level is ${c.twin.churnRisk}%.`;
    }

    return {
      customerId: c.id,
      customerName: c.name,
      willConvert,
      engagementScore,
      reactionText,
    };
  });

  const conversionRate = reach > 0 ? Math.round((conversions / reach) * 100) : 0;
  const isRevenueMin = totalCap > 0 ? totalCap : (reach * 25);

  const breakdown = [
    {
      segmentName: 'Tech Innovators',
      conversionRate: Math.max(10, Math.round(conversionRate * 1.1)),
      interestLevel: 75,
      reaction: 'High interest in premium offerings with advanced features. Demands rapid order processing.',
    },
    {
      segmentName: 'Value Hunters',
      conversionRate: discountVal >= 20 ? 80 : 30,
      interestLevel: discountVal >= 20 ? 90 : 45,
      reaction: discountVal >= 20 ? 'Thrives on high discount tier keys.' : 'Hesitant due to low promotional values.',
    },
    {
      segmentName: 'Exclusive Elite',
      conversionRate: discountVal < 30 ? 65 : 20,
      interestLevel: 60,
      reaction: 'Appreciates premium aesthetic, rejects heavy mass-market discounts.',
    },
  ];

  return res.json({
    expectedConversionRate: conversionRate,
    expectedEngagement: conversionRate > 60 ? 'High' : (conversionRate > 30 ? 'Medium' : 'Low'),
    expectedRevenue: isRevenueMin,
    expectedReach: reach,
    expectedChurnImpact: conversionRate > 50 ? 'Positive' : 'Neutral',
    explanation: `Calculated from customer twins response modeling. High performance on aligned preferred channels (${campaign.channel}) with a ${discountVal}% deal structure.`,
    segmentBreakdown: breakdown,
    customerReactions: reactions,
  });
});

// Endpoint 3: Simulate Future Business Question / Scenario
app.post('/api/simulate-business-scenario', async (req, res) => {
  const { scenario, customers } = req.body;

  if (!scenario || !customers) {
    return res.status(400).json({ error: 'Missing variables to model scenario.' });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `
You are TwinMind Macroeconomic Forecaster. Run a future simulation forecasting how our customer digital twin base will react over a 12-month period to the following business change scenario.

MARKETER QUESTION / BUSINESS SCENARIO:
"${scenario}"

CUSTOMER COHORTS & DIGITAL TWINS OVERVIEW:
${JSON.stringify(customers.map((c: any) => ({
  name: c.name,
  segment: c.segment,
  spendingBehavior: c.twin.spendingBehavior,
  purchaseProbability: c.twin.purchaseProbability,
  churnRisk: c.twin.churnRisk,
  clv: c.twin.clv
})))}

Model human reactions across:
- Revenue Impact (estimated positive or negative % change, e.g. -12.5 or +8.2)
- Customer Retention Impact (estimated dynamic % change)
- Overall Churn Risk Shift (movement %, e.g., +4.2 points risk increase)
- Sentiment Classification: 'Positive' | 'Negative' | 'Neutral' | 'Mixed'
- Business Growth Impact statement (1-2 sentences summarizing growth outlook & opportunities)
- A highly convincing reasoning/explanation on client mentalities.
- Match predictionsBySegment array containing predicted behavioral shifts for:
  1. Value Hunters
  2. Tech Enthusiasts
  3. Luxury Shoppers

Return ONLY the structured JSON matching this schema:
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenario: { type: Type.STRING },
              revenueImpact: { type: Type.NUMBER },
              customerRetentionImpact: { type: Type.NUMBER },
              churnRiskShift: { type: Type.NUMBER },
              sentimentClassification: { type: Type.STRING },
              businessGrowthImpact: { type: Type.STRING },
              explanation: { type: Type.STRING },
              predictionsBySegment: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    segmentName: { type: Type.STRING },
                    mood: { type: Type.STRING },
                    reaction: { type: Type.STRING },
                    impact: { type: Type.STRING }, // 'Highly Positive' | 'Slightly Positive' | 'Neutral' | 'Slightly Negative' | 'Highly Negative'
                  },
                  required: ['segmentName', 'mood', 'reaction', 'impact'],
                },
              },
            },
            required: [
              'scenario', 'revenueImpact', 'customerRetentionImpact',
              'churnRiskShift', 'sentimentClassification', 'businessGrowthImpact',
              'explanation', 'predictionsBySegment'
            ],
          },
        },
      });

      const responseText = response.text || '{}';
      return res.json(JSON.parse(responseText));
    } catch (err: any) {
      console.error('Gemini Business Simulator Error:', err);
    }
  }

  // Pre-calculated scenario responses as smart fallbacks
  console.log(`Using fallback scenario calculations for: ${scenario}`);
  const sText = scenario.toLowerCase();
  let revenueImpact = 0;
  let customerRetentionImpact = 0;
  let churnRiskShift = 0;
  let sentimentClassification: 'Positive' | 'Negative' | 'Neutral' | 'Mixed' = 'Neutral';
  let growthImpact = '';
  let explain = '';
  let predictions: any[] = [];

  if (sText.includes('price') && sText.includes('10')) {
    revenueImpact = 4.2; // positive short term but higher margins
    customerRetentionImpact = -8.5;
    churnRiskShift = 12.0;
    sentimentClassification = 'Negative';
    growthImpact = 'Price increases boost per-unit profitability, but drive away cost-sensitive Value Hunters. Churn threats rise significantly in budget buckets.';
    explain = 'The TwinMind predictive framework simulates immediate price friction. While margins grow 10%, volume declines as model predicts high attrition from the bottom segment.';
    predictions = [
      { segmentName: 'Value Hunters', mood: 'Dejected & Indignant', reaction: 'Immediate cart exit and high migration risk to local alternatives.', impact: 'Highly Negative' },
      { segmentName: 'Tech Enthusiasts', mood: 'Resigned Acceptance', reaction: 'Will evaluate premium value vs cost but typically stay if tech leads.', impact: 'Slightly Negative' },
      { segmentName: 'Luxury Shoppers', mood: 'Completely Unaffected', reaction: 'Prices ignore brand prestige factors. Luxury buyer cohorts will purchase uniformly.', impact: 'Neutral' },
    ];
  } else if (sText.includes('discount') && sText.includes('reduce')) {
    revenueImpact = -3.5;
    customerRetentionImpact = -6.0;
    churnRiskShift = 8.5;
    sentimentClassification = 'Negative';
    growthImpact = 'Discount reductions preserve margins but severely dampens conversion speeds of promo-led buyers.';
    explain = 'Removing default incentives cools down impulse spenders. Twins with value tags reduce browsing frequency by half.';
    predictions = [
      { segmentName: 'Value Hunters', mood: 'Boycott/Silent Stance', reaction: 'Refuses normal ticket pricing. Idle until big clearance is promoted.', impact: 'Highly Negative' },
      { segmentName: 'Tech Enthusiasts', mood: 'Indifferent', reaction: 'Buy primarily based on utility and features rather than 10-15% margin cuts.', impact: 'Neutral' },
      { segmentName: 'Luxury Shoppers', mood: 'Indifferent', reaction: 'Unbothered by small discount drops. Prefer high tier service and curation.', impact: 'Neutral' },
    ];
  } else if (sText.includes('email') && sText.includes('stop')) {
    revenueImpact = -18.0;
    customerRetentionImpact = -15.0;
    churnRiskShift = 15.2;
    sentimentClassification = 'Mixed';
    growthImpact = 'While inbox noise complaints reduce to zero, overall sales velocity stalls due to the absence of persistent consumer triggers.';
    explain = 'Email acts as a steady nudge. Stop campaigns creates visual slip, decreasing repeat orders across 70% of digital shopper twins.';
    predictions = [
      { segmentName: 'Value Hunters', mood: 'Forgetful', reaction: 'Misses seasonal drops entirely without email notifications. Forgets the platform exists.', impact: 'Slightly Negative' },
      { segmentName: 'Tech Enthusiasts', mood: 'Relieved but Quiet', reaction: 'Feels inbox is cleaner, but overall brand engagement dies down.', impact: 'Slightly Negative' },
      { segmentName: 'Luxury Shoppers', mood: 'Detached', reaction: 'Requires high-touch personalized communications. Complete stop drops CLV limits significantly.', impact: 'Slightly Negative' },
    ];
  } else if (sText.includes('loyalty') || sText.includes('program')) {
    revenueImpact = 15.5;
    customerRetentionImpact = 22.0;
    churnRiskShift = -18.5;
    sentimentClassification = 'Positive';
    growthImpact = 'Extremely high growth curve. Loyalty status drives recurring rewards, motivating higher bucket repeat buys.';
    explain = 'Loyalty points create soft gamified lock-in effect. Churn risk of vulnerable cohorts declines instantly.';
    predictions = [
      { segmentName: 'Value Hunters', mood: 'Excited & Locked-in', reaction: 'Accumulates cash back and points eagerly. Concentrates buying energy with you.', impact: 'Highly Positive' },
      { segmentName: 'Tech Enthusiasts', mood: 'Highly Engaged', reaction: 'Gamification tiers and early beta-testing access motivate continuous spending.', impact: 'Highly Positive' },
      { segmentName: 'Luxury Shoppers', mood: 'Complacent', reaction: 'Appreciates premium high-tier status treatment and prioritized logistics options.', impact: 'Slightly Positive' },
    ];
  } else {
    // Custom user typed scenario
    revenueImpact = 6.8;
    customerRetentionImpact = 5.2;
    churnRiskShift = -3.5;
    sentimentClassification = 'Positive';
    growthImpact = `The platform simulates active business realignment following: "${scenario}". Positive growth indicators expected.`;
    explain = `Based on AI digital models, implementing "${scenario}" triggers minor market expansion and solidifies general customer loyalty.`;
    predictions = [
      { segmentName: 'Value Hunters', mood: 'Curious', reaction: 'Will watch for immediate tangible rewards or discounts.', impact: 'Slightly Positive' },
      { segmentName: 'Tech Enthusiasts', mood: 'Optimistic', reaction: 'Appreciates innovation and process improvements.', impact: 'Positive' },
      { segmentName: 'Luxury Shoppers', mood: 'Favorable', reaction: 'Supports long-term brand quality assurance values.', impact: 'Neutral' },
    ];
  }

  return res.json({
    scenario,
    revenueImpact,
    customerRetentionImpact,
    churnRiskShift,
    sentimentClassification,
    businessGrowthImpact: growthImpact,
    explanation: explain,
    predictionsBySegment: predictions,
  });
});

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// ==========================================
// VITE DEV SERVER & PRODUCTION MIDDLEWARES
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite dev middleware
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TwinMind Application] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
