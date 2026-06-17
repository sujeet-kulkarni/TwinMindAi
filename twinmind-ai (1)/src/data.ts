/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer } from './types';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_01',
    name: 'Sarah Jenkins',
    email: 'sarah.j@techsphere.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    segment: 'Tech Innovators',
    summary: 'A fast-paced tech professional looking for high-quality, high-utility gadgets. Willing to pay a premium for fast shipping and convenience, but gets frustrated by friction.',
    twin: {
      interests: ['Premium Audio', 'Smart Home', 'Noise-Cancellation'],
      buyingPatterns: 'Buys immediately upon discovering high-spec upgrades. Prefers card payments with expedited delivery.',
      preferredChannel: 'Email',
      preferredTime: 'Evening (5PM - 9PM)',
      spendingBehavior: 'High-Spender',
      engagementLevel: 75,
      purchaseProbability: 60,
      churnRisk: 35,
      clv: 1850,
      recommendedTactics: [
        'Offer express courier shipping upgrades',
        'Send early-access beta invitations for hardware drops',
        'Keep promotional discount minimal, highlight design/specs instead'
      ],
      personalizedMessageHeadline: 'Experience Unmatched Clarity: Pro NoiseShield v3',
      personalizedMessageBody: 'Hi Sarah, we notice you appreciate state-of-the-art engineering. Order the Pro NoiseShield v3 tonight & get complimentary next-day delivery straight to your desk.'
    },
    activities: [
      {
        id: 'act_101',
        timestamp: '2026-06-12T10:30:00Z',
        type: 'search',
        description: 'Searched for "noise cancelling headphones active specs"',
        category: 'Electronics'
      },
      {
        id: 'act_102',
        timestamp: '2026-06-12T10:35:00Z',
        type: 'view',
        description: 'Viewed "Pro NoiseShield Headphones v3" detail page',
        category: 'Electronics',
        value: 299
      },
      {
        id: 'act_103',
        timestamp: '2026-06-14T14:20:00Z',
        type: 'abandonment',
        description: 'Abandoned cart with "Pro NoiseShield Headphones v3" at checkout step',
        category: 'Electronics',
        value: 299
      },
      {
        id: 'act_104',
        timestamp: '2026-06-15T09:15:00Z',
        type: 'support_conversation',
        description: 'Asked support: "I want to purchase the Pro NoiseShield v3, but standard shipping says 5 days. Is there a faster courier option?"',
        category: 'Electronics'
      }
    ]
  },
  {
    id: 'cust_02',
    name: 'Marcus Chen',
    email: 'marcus.chen99@outlook.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    segment: 'Value Hunters',
    summary: 'A highly price-sensitive buyer who waits for coupons, sales, or seasonal clearances. Highly analytical of prices and frequently compares competitors.',
    twin: {
      interests: ['Fitness Trackers', 'Smart Watches', 'Sales & Clearances'],
      buyingPatterns: 'Only converts when a discount code or bundles offer at least 20% off. Extreme interest in flash sales.',
      preferredChannel: 'Push',
      preferredTime: 'Afternoon (12PM - 4PM)',
      spendingBehavior: 'Budget-Conscious',
      engagementLevel: 85,
      purchaseProbability: 80,
      churnRisk: 15,
      clv: 480,
      recommendedTactics: [
        'Send persistent flash-sale notifications via web push',
        'Offer 20% bundle coupon with low minimum spending requirements',
        'Trigger automated cart-recovery sequences backed with a cash discount'
      ],
      personalizedMessageHeadline: 'Marcus, Your 20% Welcome Code is Expiring!',
      personalizedMessageBody: 'Grab the EcoSport Smartwatch now with code SAVE20. Save $30 instantly and get free shipping!'
    },
    activities: [
      {
        id: 'act_201',
        timestamp: '2026-06-10T15:10:00Z',
        type: 'ad',
        description: 'Clicked Social Ad promoting "EcoSport Smartwatch Summer Clearance"',
        channel: 'Ad'
      },
      {
        id: 'act_202',
        timestamp: '2026-06-10T15:12:00Z',
        type: 'view',
        description: 'Viewed "EcoSport Smartwatch Space Black Edition"',
        category: 'Weables',
        value: 149
      },
      {
        id: 'act_203',
        timestamp: '2026-06-11T12:05:00Z',
        type: 'purchase',
        description: 'Purchased "EcoSport Smartwatch" using promo code SAVE20',
        category: 'Weables',
        value: 119
      },
      {
        id: 'act_204',
        timestamp: '2026-06-16T16:40:00Z',
        type: 'search',
        description: 'Searched for "smartwatch silicone bands discount promo"',
        category: 'Accessories'
      }
    ]
  },
  {
    id: 'cust_03',
    name: 'Elena Rostova',
    email: 'elena.rostova@luxury.co',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    segment: 'Exclusive Elite',
    summary: 'A refined high-net-worth client searching for exclusive, rare, high-quality luxury lifestyle goods and artisanal makeup. Prioritizes elite prestige and brand reputation.',
    twin: {
      interests: ['Luxury Leather Goods', 'Premium Skin Serums', 'Private Invites'],
      buyingPatterns: 'Buys high-end luxury items. High loyalty to select brands but demands premium customer support.',
      preferredChannel: 'Social Ad',
      preferredTime: 'Morning (8AM - 11AM)',
      spendingBehavior: 'Luxury-driven',
      engagementLevel: 90,
      purchaseProbability: 85,
      churnRisk: 10,
      clv: 4200,
      recommendedTactics: [
        'Avoid mass-market couponing (decreases brand allure)',
        'Invite to physical VIP trunk shows or boutique launches',
        'Assign a dedicated support representative'
      ],
      personalizedMessageHeadline: 'Elena, An Invitation to the Private Parisian Collection',
      personalizedMessageBody: 'We have reserved a piece from our newest Italian tanned leather series for you. Request private curation with our premium concierge service today.'
    },
    activities: [
      {
        id: 'act_301',
        timestamp: '2026-06-05T09:00:00Z',
        type: 'view',
        description: 'Opened private catalog email and browsed "Organic Gold Skin Elixir"',
        category: 'Cosmetics',
        value: 450
      },
      {
        id: 'act_302',
        timestamp: '2026-06-08T11:30:00Z',
        type: 'purchase',
        description: 'Purchased "Parisian Leather Tote Bag" in Tan Tint',
        category: 'Bags',
        value: 1200
      },
      {
        id: 'act_303',
        timestamp: '2026-06-15T08:45:00Z',
        type: 'view',
        description: 'Browsed "Gold Elixir Premium Serum v2" product detail page',
        category: 'Cosmetics',
        value: 480
      }
    ]
  },
  {
    id: 'cust_04',
    name: 'Alex Thompson',
    email: 'alex.t.99@yahoo.com',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120',
    segment: 'Vulnerable Accounts',
    summary: 'An easily distracted customer who has experienced multiple micro-frictions, including a delayed delivery and rigid return policies. Engagement is dropping.',
    twin: {
      interests: ['Budget Computing', 'Accessories', 'Loyalty Rewards'],
      buyingPatterns: 'Highly sensitive to customer service, delivery speed, and return terms. Unsubscribed from generic blasts.',
      preferredChannel: 'SMS',
      preferredTime: 'Night (10PM - 12AM)',
      spendingBehavior: 'Moderate',
      engagementLevel: 25,
      purchaseProbability: 20,
      churnRisk: 85,
      clv: 650,
      recommendedTactics: [
        'Offer proactive shipping fee waiver or delivery refund',
        'Trigger personalized VIP fast-track support resolution',
        'Avoid spamming, use highly critical single-channel SMS recovery'
      ],
      personalizedMessageHeadline: 'Alex, we made things right. Check your account.',
      personalizedMessageBody: 'Hi Alex, we are sorry for your shipping concern last week. We have credited your account with $25 wallet cash, plus lifetime free express delivery. We appreciate you.'
    },
    activities: [
      {
        id: 'act_401',
        timestamp: '2026-06-01T21:10:00Z',
        type: 'search',
        description: 'Searched for "refurbished student budget laptops"',
        category: 'Electronics'
      },
      {
        id: 'act_402',
        timestamp: '2026-06-03T23:15:00Z',
        type: 'view',
        description: 'Viewed "WorkBook Air 13" laptop three times',
        category: 'Electronics',
        value: 599
      },
      {
        id: 'act_403',
        timestamp: '2026-06-04T00:05:00Z',
        type: 'abandonment',
        description: 'Abandoned checkout with "WorkBook Air 13" laptop due to $25 shipping surcharge',
        category: 'Electronics',
        value: 599
      },
      {
        id: 'act_404',
        timestamp: '2026-06-08T14:00:00Z',
        type: 'email',
        description: 'Unsubscribed from monthly marketing newsletter blast',
        channel: 'Email'
      },
      {
        id: 'act_405',
        timestamp: '2026-06-15T18:22:00Z',
        type: 'support_conversation',
        description: 'Asked support: "Why is your exchange window only 14 days? That is too short. I want to terminate my account registration."',
        category: 'General'
      }
    ]
  }
];

export const PRESET_CAMPAIGNS = [
  {
    name: 'Weekend Tech Enthusiast Push',
    channel: 'Push',
    discount: 10,
    message: 'Sarah! Experience ultimate acoustic design. Get the NoiseShield v3 today with guaranteed priority morning courier delivery. Use coupon AUDIOEXTRA.',
    targetSegment: 'Tech Innovators'
  },
  {
    name: 'Friction Solver Recovery Campaign',
    channel: 'SMS',
    discount: 25,
    message: 'Alex, we made it right. Free express shipping + $25 client credits credited to you instantly. Checkout with code EXPRESSFREE.',
    targetSegment: 'Vulnerable Accounts'
  },
  {
    name: 'VIP Private Preview Drop',
    channel: 'Social Ad',
    discount: 0,
    message: 'Elena, you are invited to pre-order the limited artisan Italian luggage drops. Private preview is now open exclusively to VIP tiers.',
    targetSegment: 'Exclusive Elite'
  },
  {
    name: 'Value Bonanza promo code dropping',
    channel: 'Email',
    discount: 25,
    message: 'Marcus, savings are unlocked! Get 25% off anything in store code SAVINGS25. Active for 24 hours only.',
    targetSegment: 'Value Hunters'
  }
];

export const PRESET_SCENARIOS = [
  'What happens if product prices increase by 10%?',
  'What happens if discounts are reduced across all campaigns?',
  'What happens if we stop all weekly email campaigns?',
  'What happens if an elite loyalty program with free express handling is introduced?',
  'What happens if we double the marketing budget on social media retargeting?'
];
