/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ActivityType =
  | 'search'
  | 'view'
  | 'purchase'
  | 'abandonment'
  | 'email'
  | 'ad'
  | 'support_conversation'
  | 'browsing';

export interface CustomerActivity {
  id: string;
  timestamp: string; // ISO string
  type: ActivityType;
  description: string;
  category?: string; // e.g. "Electronics", "Luxury", "Essentials"
  value?: number; // monetary value if applicable
  channel?: 'Email' | 'SMS' | 'Push' | 'Ad' | 'Web';
}

export interface DigitalTwinProfile {
  interests: string[];
  buyingPatterns: string;
  preferredChannel: 'Email' | 'SMS' | 'Push' | 'Social Ad';
  preferredTime: 'Morning (8AM - 11AM)' | 'Afternoon (12PM - 4PM)' | 'Evening (5PM - 9PM)' | 'Night (10PM - 12AM)';
  spendingBehavior: 'Budget-Conscious' | 'Moderate' | 'High-Spender' | 'Luxury-driven';
  engagementLevel: number; // 0 to 100
  purchaseProbability: number; // 0 to 100
  churnRisk: number; // 0 to 100
  clv: number; // Customer Lifetime Value estimate
  recommendedTactics: string[];
  personalizedMessageHeadline: string;
  personalizedMessageBody: string;
  recalibrationFeedback?: string; // AI explanation of latest recalibration
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  segment: string;
  summary: string;
  twin: DigitalTwinProfile;
  activities: CustomerActivity[];
}

export interface CampaignSimulation {
  id: string;
  name: string;
  channel: string;
  discount: number; // e.g. 15 for 15%
  message: string;
  targetSegment: string;
  simulatedAt: string;
}

export interface CampaignSimulationResult {
  expectedConversionRate: number; // %
  expectedEngagement: 'High' | 'Medium' | 'Low';
  expectedRevenue: number; // $
  expectedReach: number; // Number of customers
  expectedChurnImpact: 'Positive' | 'Neutral' | 'Negative';
  explanation: string;
  segmentBreakdown: {
    segmentName: string;
    conversionRate: number;
    interestLevel: number; // 0 - 100
    reaction: string;
  }[];
  customerReactions: {
    customerId: string;
    customerName: string;
    willConvert: boolean;
    engagementScore: number;
    reactionText: string;
  }[];
}

export interface BusinessScenarioResult {
  scenario: string;
  revenueImpact: number; // positive or negative %, e.g., 12.5 or -5.2
  customerRetentionImpact: number; // e.g., -2.4 or 8.1
  churnRiskShift: number; // e.g., 4.5 or -3.1
  sentimentClassification: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
  businessGrowthImpact: string; // concise high-level description
  explanation: string;
  predictionsBySegment: {
    segmentName: string;
    mood: string;
    reaction: string;
    impact: 'Highly Positive' | 'Slightly Positive' | 'Neutral' | 'Slightly Negative' | 'Highly Negative';
  }[];
}
