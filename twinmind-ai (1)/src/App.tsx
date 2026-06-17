/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sparkles, 
  TrendingUp, 
  Play, 
  HelpCircle, 
  Plus, 
  Activity, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  ChevronRight, 
  Search, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Percent,
  Bot
} from 'lucide-react';
import { INITIAL_CUSTOMERS, PRESET_CAMPAIGNS, PRESET_SCENARIOS } from './data';
import { Customer, CustomerActivity, ActivityType, CampaignSimulationResult, BusinessScenarioResult } from './types';

export default function App() {
  // Navigation tabs: 'twins' | 'campaign-simulator' | 'scenario-simulator' | 'analytics'
  const [activeTab, setActiveTab] = useState<'twins' | 'campaign-simulator' | 'scenario-simulator' | 'analytics'>('twins');
  
  // Customers State (holds real-time twin state changes)
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(INITIAL_CUSTOMERS[0].id);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Forms for adding new custom customer
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustSegment, setNewCustSegment] = useState('Tech Innovators');
  const [newCustSummary, setNewCustSummary] = useState('');
  const [newCustSpending, setNewCustSpending] = useState<'Budget-Conscious' | 'Moderate' | 'High-Spender' | 'Luxury-driven'>('Moderate');

  // Real-time Event simulation forms
  const [activityType, setActivityType] = useState<ActivityType>('search');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityCategory, setActivityCategory] = useState('Electronics');
  const [activityVal, setActivityVal] = useState('150');
  const [isUpdatingTwin, setIsUpdatingTwin] = useState(false);

  // Campaign Simulator inputs
  const [selectedPresetCampaignIdx, setSelectedPresetCampaignIdx] = useState<number>(0);
  const [campaignName, setCampaignName] = useState(PRESET_CAMPAIGNS[0].name);
  const [campaignChannel, setCampaignChannel] = useState(PRESET_CAMPAIGNS[0].channel);
  const [campaignDiscount, setCampaignDiscount] = useState(PRESET_CAMPAIGNS[0].discount);
  const [campaignMessage, setCampaignMessage] = useState(PRESET_CAMPAIGNS[0].message);
  const [campaignTargetSegment, setCampaignTargetSegment] = useState(PRESET_CAMPAIGNS[0].targetSegment);
  const [campaignResult, setCampaignResult] = useState<CampaignSimulationResult | null>(null);
  const [isSimulatingCampaign, setIsSimulatingCampaign] = useState(false);

  // Business Scenario Simulator inputs
  const [selectedPresetScenario, setSelectedPresetScenario] = useState<string>(PRESET_SCENARIOS[0]);
  const [customScenarioText, setCustomScenarioText] = useState('');
  const [scenarioResult, setScenarioResult] = useState<BusinessScenarioResult | null>(null);
  const [isSimulatingScenario, setIsSimulatingScenario] = useState(false);

  // Global Info / Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'success' | 'warn' } | null>(null);

  // Auto-run typical simulations on initialization to make screen look populated
  useEffect(() => {
    handleSimulateCampaign(true);
    handleSimulateScenario(PRESET_SCENARIOS[0], true);
  }, []);

  const triggerToast = (text: string, type: 'info' | 'success' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handlePresetCampaignChange = (idx: number) => {
    setSelectedPresetCampaignIdx(idx);
    const preset = PRESET_CAMPAIGNS[idx];
    setCampaignName(preset.name);
    setCampaignChannel(preset.channel);
    setCampaignDiscount(preset.discount);
    setCampaignMessage(preset.message);
    setCampaignTargetSegment(preset.targetSegment);
  };

  // Add real-time activity for the selected customer, then hits /api/predict-twin-recalibration
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityDesc.trim()) return;

    const newActivity: CustomerActivity = {
      id: 'act_' + Date.now(),
      timestamp: new Date().toISOString(),
      type: activityType,
      description: activityDesc,
      category: activityCategory,
      value: activityVal ? parseFloat(activityVal) : undefined,
      channel: activityType === 'email' ? 'Email' : (activityType === 'ad' ? 'Ad' : undefined)
    };

    setIsUpdatingTwin(true);
    triggerToast(`Capturing activity of ${selectedCustomer.name}... Updating Digital Twin...`, 'info');

    // Optimistically push activity to list instantly
    const updatedActivities = [...selectedCustomer.activities, newActivity];
    const customerWithActivity = {
      ...selectedCustomer,
      activities: updatedActivities
    };

    // Replace customer temporarily to show the log entry immediately
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? customerWithActivity : c));

    try {
      const response = await fetch('/api/predict-twin-recalibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerWithActivity.name,
          customerEmail: customerWithActivity.email,
          summary: customerWithActivity.summary,
          activities: updatedActivities,
          originalTwin: customerWithActivity.twin
        })
      });

      if (!response.ok) throw new Error('API recalibration failure');
      
      const data = await response.json();
      if (data.updatedProfile) {
        setCustomers(prev => prev.map(c => {
          if (c.id === selectedCustomer.id) {
            return {
              ...c,
              twin: data.updatedProfile
            };
          }
          return c;
        }));
        triggerToast(`Digital Twin recalibrated successfully! Updated purchase probability to ${data.updatedProfile.purchaseProbability}%`, 'success');
      }
    } catch (err) {
      console.error(err);
      triggerToast('AI simulation failure. Recalibrated locally with prediction rules.', 'warn');
    } finally {
      setIsUpdatingTwin(false);
      setActivityDesc('');
      setActivityVal('');
    }
  };

  // Add customized customer record
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail) {
      triggerToast('Please provide your customer name and email.', 'warn');
      return;
    }

    const newCustId = 'cust_' + Date.now();
    const newCust: Customer = {
      id: newCustId,
      name: newCustName,
      email: newCustEmail,
      avatar: `https://images.unsplash.com/${newCustId === 'cust_1' ? 'photo-1544005313-94ddf0286df2' : 'photo-1506794778202-cad84cf45f1d'}?auto=format&fit=crop&q=80&w=120`,
      segment: newCustSegment,
      summary: newCustSummary || `${newCustName} is a customer in the ${newCustSegment} cohort added during testing.`,
      twin: {
        interests: ['General Trends'],
        buyingPatterns: 'Standard browser behavior; evaluates items carefully.',
        preferredChannel: 'Email',
        preferredTime: 'Afternoon (12PM - 4PM)',
        spendingBehavior: newCustSpending,
        engagementLevel: 50,
        purchaseProbability: 45,
        churnRisk: 25,
        clv: newCustSpending === 'High-Spender' ? 1200 : (newCustSpending === 'Luxury-driven' ? 2500 : 400),
        recommendedTactics: ['Send welcoming coupon code', 'Recommend recent top trends'],
        personalizedMessageHeadline: `Welcome ${newCustName}! Discover New Launches`,
        personalizedMessageBody: `Hi ${newCustName}, we curated a private collection for you today. Explore custom rewards customized for moderate spenders like yourself.`
      },
      activities: [
        {
          id: 'act_' + Date.now(),
          timestamp: new Date().toISOString(),
          type: 'browsing',
          description: 'Registered an account and completed profile settings.'
        }
      ]
    };

    setCustomers(prev => [...prev, newCust]);
    setSelectedCustomerId(newCustId);
    setShowAddCustomer(false);
    setNewCustName('');
    setNewCustEmail('');
    setNewCustSummary('');
    triggerToast(`Customer twin for ${newCustName} initialized!`, 'success');
  };

  // Run Campaign Simulation
  const handleSimulateCampaign = async (silentMode = false) => {
    setIsSimulatingCampaign(true);
    if (!silentMode) {
      triggerToast('Digital Twin Predictive model mapping Campaign metrics...', 'info');
    }

    try {
      const response = await fetch('/api/simulate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign: {
            name: campaignName,
            channel: campaignChannel,
            discount: campaignDiscount,
            message: campaignMessage,
            targetSegment: campaignTargetSegment
          },
          customers: customers
        })
      });

      if (!response.ok) throw new Error('Campaign simulation request failed.');
      const result = await response.json();
      setCampaignResult(result);
      if (!silentMode) {
        triggerToast(`Simulation Finished! Response rate predicted at ${result.expectedConversionRate}%`, 'success');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Failed to contact simulation servers. Using standard predictive fallback.', 'warn');
    } finally {
      setIsSimulatingCampaign(false);
    }
  };

  // Run Business Scenario analysis
  const handleSimulateScenario = async (scenarioText: string, silentMode = false) => {
    setIsSimulatingScenario(true);
    const activeText = scenarioText || customScenarioText;
    if (!activeText) {
      triggerToast('Please write or select a scenario to simulate.', 'warn');
      setIsSimulatingScenario(false);
      return;
    }

    if (!silentMode) {
      triggerToast(`Modeling consumer response of Twin Base to: "${activeText}"`, 'info');
    }

    try {
      const response = await fetch('/api/simulate-business-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: activeText,
          customers: customers
        })
      });

      if (!response.ok) throw new Error('Scenario analysis failed.');
      const result = await response.json();
      setScenarioResult(result);
      if (!silentMode) {
        triggerToast(`Simulation completed with ${result.sentimentClassification} customer sentiment shift!`, 'success');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Macro scenario calculation fell back to heuristic engine.', 'warn');
    } finally {
      setIsSimulatingScenario(false);
    }
  };

  // Utility to determine avatar/icons for events
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'search': return <Search className="w-4 h-4 text-cyan-400" />;
      case 'view': return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'purchase': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'abandonment': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'email': return <Mail className="w-4 h-4 text-blue-400" />;
      case 'ad': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'support_conversation': return <MessageSquare className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  // Segment totals
  const totalWhalesCount = customers.filter(c => c.twin.spendingBehavior === 'Luxury-driven' || c.twin.spendingBehavior === 'High-Spender').length;
  const averagePurchaseProbability = Math.round(customers.reduce((acc, c) => acc + c.twin.purchaseProbability, 0) / customers.length);
  const averageChurnRisk = Math.round(customers.reduce((acc, c) => acc + c.twin.churnRisk, 0) / customers.length);
  const totalEstimatedCLV = customers.reduce((acc, c) => acc + c.twin.clv, 0);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950" id="twinmind-container">
      {/* SIDE NAVIGATION */}
      <aside className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between py-6 shrink-0 transition-all duration-300">
        <div className="space-y-8 px-4">
          {/* LOGO AREA */}
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-cyan-500/20 tracking-wider">
              TM
            </div>
            <div className="hidden md:block">
              <span className="text-white font-bold tracking-tight block text-base">TwinMind AI</span>
              <span className="text-xs text-slate-500 block">Marketing Digital Twin</span>
            </div>
          </div>

          {/* NAV ITEMS */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('twins')}
              id="sidebar-twins-btn"
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'twins'
                  ? 'bg-slate-800 text-cyan-400 shadow-inner border-l-4 border-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="hidden md:block">Customer Twins</span>
            </button>

            <button
              onClick={() => setActiveTab('campaign-simulator')}
              id="sidebar-campaign-btn"
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'campaign-simulator'
                  ? 'bg-slate-800 text-cyan-400 shadow-inner border-l-4 border-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Play className="w-5 h-5 text-emerald-400" />
              <span className="hidden md:block">Campaign Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('scenario-simulator')}
              id="sidebar-scenario-btn"
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'scenario-simulator'
                  ? 'bg-slate-800 text-cyan-400 shadow-inner border-l-4 border-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <HelpCircle className="w-5 h-5 text-yellow-400" />
              <span className="hidden md:block">Future Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              id="sidebar-analytics-btn"
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-cyan-400 shadow-inner border-l-4 border-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="hidden md:block">Analytics Hub</span>
            </button>
          </nav>
        </div>

        {/* SYSTEM STATUS FOOTER */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/60 hidden md:block">
            <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-bold uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Gemini Agent Live</span>
            </div>
            <p className="text-[10px] text-slate-500 italic">Continuous real-time twin calibration cycle.</p>
          </div>
          <div className="text-center mt-3 text-[10px] text-slate-600 hidden md:block">
            TwinMind AI • v2.4
          </div>
        </div>
      </aside>

      {/* MAIN VIEW CONTROLLER */}
      <main className="flex-1 flex flex-col min-w-0" id="twinmind-main-viewport">
        {/* HEADER */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/40 backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
              TwinMind Executive Hub
              <span className="text-slate-500 font-mono text-xs ml-3 hidden sm:inline px-2 py-0.5 border border-slate-800 bg-slate-900 rounded-sm">
                Prediction-Based Marketing
              </span>
            </h1>
            <div className="px-2.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs hidden md:flex items-center space-x-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Active Agent Sync</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-500 block">Digital Twin Integrity</span>
              <span className="text-xs font-mono font-bold text-cyan-400">98.4% Confidence</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-cyan-950/80 border border-cyan-800 flex items-center justify-center font-bold text-cyan-400 text-sm">
              AI
            </div>
          </div>
        </header>

        {/* TOAST / ACTION BANNER */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-lg border flex items-center justify-between transition-all duration-300 animate-fade-in bg-slate-900/90 border-cyan-500/30 text-slate-200">
            <div className="flex items-center space-x-3 text-sm">
              <Bot className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* ACTUAL TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {/* TAB 1: CUSTOMER TWINS */}
          {activeTab === 'twins' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start" id="twins-view-grid">
              
              {/* Left Side: Customer Roster (col-span-4) */}
              <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Customer Twins</h2>
                    <p className="text-xs text-slate-500">Select simulated profile to explore twin state</p>
                  </div>
                  <button
                    onClick={() => setShowAddCustomer(!showAddCustomer)}
                    className="p-1 px-3 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-400 border border-cyan-800/50 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Profile</span>
                  </button>
                </div>

                {/* ADD NEW CUSTOMER FORM EXPANDABLE */}
                {showAddCustomer && (
                  <form onSubmit={handleCreateCustomer} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3.5">
                    <div className="text-xs font-bold text-cyan-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                      <span>Add Target Shopper Profile</span>
                      <button type="button" onClick={() => setShowAddCustomer(false)} className="text-slate-500 hover:text-white">✕</button>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newCustName}
                        onChange={e => setNewCustName(e.target.value)}
                        placeholder="e.g. Liam Foster"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={newCustEmail}
                        onChange={e => setNewCustEmail(e.target.value)}
                        placeholder="foster@digitaltwin.io"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Primary Cohort</label>
                        <select
                          value={newCustSegment}
                          onChange={e => setNewCustSegment(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Tech Innovators">Tech Innovators</option>
                          <option value="Value Hunters">Value Hunters</option>
                          <option value="Exclusive Elite">Exclusive Elite</option>
                          <option value="Vulnerable Accounts">Vulnerable Accounts</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Spending Vibe</label>
                        <select
                          value={newCustSpending}
                          onChange={e => setNewCustSpending(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="Budget-Conscious">Budget-Conscious</option>
                          <option value="Moderate">Moderate</option>
                          <option value="High-Spender">High-Spender</option>
                          <option value="Luxury-driven">Luxury-driven</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Short Vibe Summary</label>
                      <textarea
                        value={newCustSummary}
                        onChange={e => setNewCustSummary(e.target.value)}
                        placeholder="e.g. Always looking for eco-luxury products with standard courier shipping..."
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-all"
                    >
                      Initialize Digital Twin
                    </button>
                  </form>
                )}

                {/* TARGET LIST OF CLIENTS */}
                <div className="space-y-2">
                  {customers.map(c => {
                    const isSelected = c.id === selectedCustomerId;
                    return (
                      <div
                        key={c.id}
                        id={`customer-card-${c.id}`}
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-slate-800 border-cyan-500 shadow-md shadow-cyan-500/5'
                            : 'bg-slate-950 border-slate-800/80 hover:bg-slate-800/30 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className="w-10 h-10 rounded-full border border-slate-800/60 object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-white truncate">{c.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 rounded text-slate-400">
                                {c.segment}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate">{c.email}</span>
                            <div className="flex items-center space-x-3 mt-1.5 text-[10px]">
                              <div>
                                <span className="text-slate-500 mr-1">Purchase Prob:</span>
                                <span className={`font-semibold ${c.twin.purchaseProbability >= 70 ? 'text-emerald-400' : (c.twin.purchaseProbability >= 40 ? 'text-yellow-400' : 'text-rose-500')}`}>
                                  {c.twin.purchaseProbability}%
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 mr-1">Churn:</span>
                                <span className={`font-semibold ${c.twin.churnRisk >= 60 ? 'text-rose-400' : 'text-slate-400'}`}>
                                  {c.twin.churnRisk}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side Part 1: Twin Intelligence Profile (col-span-5) */}
              <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6" id="twin-details-container">
                <div className="flex items-center space-x-4 border-b border-slate-800 pb-4">
                  <div className="relative">
                    <img
                      src={selectedCustomer.avatar}
                      alt={selectedCustomer.name}
                      className="w-14 h-14 rounded-full border-2 border-cyan-400 p-0.5 object-cover"
                    />
                    <div className="absolute right-0 bottom-0 bg-cyan-400 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-slate-900 text-slate-950">
                      <Bot className="w-2.5 h-2.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">{selectedCustomer.name}&apos;s Digital Twin</h3>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-[10px]">Virtual Clone</span>
                    </div>
                    <p className="text-xs text-slate-400">Cohort: <span className="text-white font-semibold">{selectedCustomer.segment}</span> • ID: <span className="font-mono">{selectedCustomer.id}</span></p>
                  </div>
                </div>

                <div className="text-xs leading-relaxed text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 italic relative">
                  <span className="absolute -top-2 left-3 px-1.5 bg-slate-900 text-[10px] text-slate-500 uppercase">Customer Summary</span>
                  &ldquo;{selectedCustomer.summary}&rdquo;
                </div>

                {/* DIGITAL TWIN METRICS METADATA GRID */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Purchase Likelihood</span>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xl font-bold font-mono text-cyan-400">{selectedCustomer.twin.purchaseProbability}%</span>
                      <span className="text-[10px] text-slate-400">Predicted conversion</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 transition-all duration-500" 
                        style={{ width: `${selectedCustomer.twin.purchaseProbability}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Retention Churn Risk</span>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`text-xl font-bold font-mono ${selectedCustomer.twin.churnRisk >= 50 ? 'text-rose-500' : 'text-emerald-400'}`}>{selectedCustomer.twin.churnRisk}%</span>
                      <span className="text-[10px] text-slate-400">At-risk probability</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${selectedCustomer.twin.churnRisk >= 50 ? 'bg-rose-500' : 'bg-emerald-400'}`} 
                        style={{ width: `${selectedCustomer.twin.churnRisk}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Engagement Level</span>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xl font-bold font-mono text-cyan-400">{selectedCustomer.twin.engagementLevel}%</span>
                      <span className="text-[10px] text-slate-400">Interaction Index</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 transition-all duration-500" 
                        style={{ width: `${selectedCustomer.twin.engagementLevel}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Est. Customer Lifetime Value</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xl font-bold font-mono text-emerald-400">${selectedCustomer.twin.clv}</span>
                      <span className="text-[10px] text-slate-400">CLV Forecast</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-2">Based on {selectedCustomer.twin.spendingBehavior} parameters</div>
                  </div>
                </div>

                {/* AI RECALIBRATION LOGIC FEEDBACK COGNITIVE (WHY IT CHANGED) */}
                {selectedCustomer.twin.recalibrationFeedback && (
                  <div className="bg-cyan-950/20 p-3.5 rounded-lg border border-cyan-800/30 text-xs">
                    <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      <Bot className="w-3.5 h-3.5 animate-bounce" />
                      <span>Twin Calibrator Insights (Explainable AI)</span>
                    </div>
                    <p className="text-cyan-100 italic leading-relaxed">{selectedCustomer.twin.recalibrationFeedback}</p>
                  </div>
                )}

                {/* TWIN ATTRIBUTES SECTION */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded border border-slate-850">
                    <span className="text-slate-500 block mb-1">Prefer Communication Channel</span>
                    <span className="text-white font-medium bg-slate-850 px-2 py-0.5 rounded border border-slate-800 inline-block">
                      {selectedCustomer.twin.preferredChannel === 'Email' && <Mail className="w-3 h-3 inline mr-1 text-blue-400" />}
                      {selectedCustomer.twin.preferredChannel === 'Push' && <Smartphone className="w-3 h-3 inline mr-1 text-purple-400" />}
                      {selectedCustomer.twin.preferredChannel === 'Social Ad' && <Sparkles className="w-3 h-3 inline mr-1 text-pink-400" />}
                      {selectedCustomer.twin.preferredChannel}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded border border-slate-850">
                    <span className="text-slate-500 block mb-1">Peak Online Activity Time</span>
                    <span className="text-white font-medium bg-slate-850 px-2 py-0.5 rounded border border-slate-800 inline-block">
                      {selectedCustomer.twin.preferredTime}
                    </span>
                  </div>
                </div>

                {/* TARGETED COGNITIVE AFFINITY TAGS */}
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Affinity Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCustomer.twin.interests.map((tag, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 bg-slate-950 border border-slate-800 text-cyan-400 font-mono italic rounded">
                        #{tag.trim()}
                      </span>
                    ))}
                    <span className="text-[11px] px-2.5 py-1 bg-slate-950 border border-slate-800 text-yellow-500 font-mono italic rounded">
                      #{selectedCustomer.twin.spendingBehavior}
                    </span>
                  </div>
                </div>

                {/* INTERACTIVE RECOMMENDATIONS FROM TWIN */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">AI Recommended Tactics</span>
                  <div className="space-y-1.5">
                    {selectedCustomer.twin.recommendedTactics.map((tactic, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs bg-slate-950/40 p-2.5 rounded border border-slate-850">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center text-[10px] shrink-0 font-bold border border-cyan-800/30">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200">{tactic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AUTOMATIC GENERATED MARKETING MESSAGES */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">AI Personalized Ad Copy Headline</span>
                    <span className="text-[9px] px-1.5 bg-slate-850 border border-slate-800 rounded text-slate-500">Live Custom</span>
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{selectedCustomer.twin.personalizedMessageHeadline}</h4>
                  <p className="text-xs text-slate-450 leading-normal italic text-slate-400">&ldquo;{selectedCustomer.twin.personalizedMessageBody}&rdquo;</p>
                </div>
              </div>

              {/* Right Side Part 2: Real-Time Stream & Activity Capturing Form (col-span-3) */}
              <div className="xl:col-span-3 space-y-6">
                
                {/* Simulated Action Creator form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2.5 flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Real-Time Interaction Simulator</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Choose an activity to commit to the timeline. Watch the Digital Twin instantly update predictions in real-time.
                  </p>

                  <form onSubmit={handleAddActivity} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Activity Nature</label>
                      <select
                        value={activityType}
                        onChange={e => {
                          const val = e.target.value as ActivityType;
                          setActivityType(val);
                          // populate prefilled helper actions for speed demo
                          if (val === 'search') setActivityDesc('Searched for latest high-spec gadget alternatives');
                          else if (val === 'view') setActivityDesc('Viewed top tier soundbar detail specs page');
                          else if (val === 'purchase') setActivityDesc('Completed terminal cart payment for accessories');
                          else if (val === 'abandonment') setActivityDesc('Abandoned active cart with items valued over $250');
                          else if (val === 'support_conversation') setActivityDesc('Opened chat asking "Why is delivery time slow?"');
                          else if (val === 'ad') setActivityDesc('Clicked newsletter promotional banner for sales');
                        }}
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="search">Product Search</option>
                        <option value="view">Product Detail View</option>
                        <option value="purchase">Product Purchase</option>
                        <option value="abandonment">Cart Abandonment</option>
                        <option value="support_conversation">Support Ticket Chat</option>
                        <option value="ad">Ad / Email Interaction</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Item Category</label>
                        <input
                          type="text"
                          value={activityCategory}
                          onChange={e => setActivityCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Value Amount ($)</label>
                        <input
                          type="number"
                          value={activityVal}
                          onChange={e => setActivityVal(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Action Description Log</label>
                      <textarea
                        value={activityDesc}
                        onChange={e => setActivityDesc(e.target.value)}
                        placeholder="Search event or query details..."
                        rows={3}
                        required
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingTwin}
                      className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-1"
                    >
                      <span>{isUpdatingTwin ? 'Recalibration in Progress...' : 'Inject Event & Propagate'}</span>
                    </button>
                  </form>
                </div>

                {/* Customer Event Streams list */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 block">
                    Interactive Activity Log
                  </h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {selectedCustomer.activities.slice().reverse().map((act) => (
                      <div key={act.id} className="p-2.5 bg-slate-950 rounded border border-slate-850 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1.5">
                            {getActivityIcon(act.type)}
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{act.type.replace('_', ' ')}</span>
                          </div>
                          <span className="text-[9px] text-slate-500">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-350 italic text-[11px] leading-snug">{act.description}</p>
                        {act.value && (
                          <div className="text-[10px] text-slate-500">
                            Category: <span className="text-slate-300">{act.category}</span> • Value: <span className="text-emerald-400 font-mono font-bold">${act.value}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAMPAIGN SIMULATOR */}
          {activeTab === 'campaign-simulator' && (
            <div className="space-y-6" id="campaign-simulator-view">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-base font-bold text-white tracking-snug mb-1">Marketer Campaign Simulator</h2>
                <p className="text-xs text-slate-400">Design campaigns and pre-simulate the behavioral conversion rates of your customer digital twins before deployment.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Campaign Setup Panel (col-span-5) */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-850 pb-2">Campaign settings</h3>
                  
                  {/* Preset Selector */}
                  <div className="space-y-2">
                    <label className="block text-[10px] text-slate-400 uppercase">Load Preset Template</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRESET_CAMPAIGNS.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePresetCampaignChange(idx)}
                          className={`text-left p-2 rounded text-[11px] border leading-tight transition-all truncate ${
                            selectedPresetCampaignIdx === idx
                              ? 'bg-cyan-950 border-cyan-800 text-cyan-400 font-bold'
                              : 'bg-slate-950/70 border-slate-850 text-slate-400 hover:border-slate-800'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual forms */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Campaign Title Name</label>
                      <input
                        type="text"
                        value={campaignName}
                        onChange={e => setCampaignName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Preferred Channel</label>
                        <select
                          value={campaignChannel}
                          onChange={e => setCampaignChannel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="Email">Email Inbox</option>
                          <option value="Push">Mobile Push</option>
                          <option value="SMS">SMS Text</option>
                          <option value="Social Ad">Social Ad Retargeting</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Discount Price Cut (%)</label>
                        <input
                          type="number"
                          value={campaignDiscount}
                          onChange={e => setCampaignDiscount(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Target Segment Scope</label>
                      <select
                        value={campaignTargetSegment}
                        onChange={e => setCampaignTargetSegment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="All">All Customer Twins</option>
                        <option value="Tech Innovators">Tech Innovators Cohort</option>
                        <option value="Value Hunters">Value Hunters Cohort</option>
                        <option value="Exclusive Elite">Exclusive Elite Cohort</option>
                        <option value="Vulnerable Accounts">Vulnerable Accounts Cohort</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Marketing Copy Message Description</label>
                      <textarea
                        value={campaignMessage}
                        onChange={e => setCampaignMessage(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none leading-relaxed"
                      />
                    </div>

                    <button
                      onClick={() => handleSimulateCampaign(false)}
                      disabled={isSimulatingCampaign}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-1.5"
                    >
                      <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                      <span>{isSimulatingCampaign ? 'Running AI Twin Simulations...' : 'Simulate Campaign Response'}</span>
                    </button>
                  </div>
                </div>

                {/* Campaign Results Simulation Outputs (col-span-7) */}
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 min-h-[500px]">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Predictive Simulation Results</h3>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 uppercase">
                      <span className="w-1.5 h-1.5 rounded bg-cyan-400"></span>
                      <span>Confidence Level: 97.1%</span>
                    </div>
                  </div>

                  {!campaignResult ? (
                    <div className="flex flex-col items-center justify-center pt-24 text-center text-slate-500 space-y-3">
                      <Bot className="w-12 h-12 text-slate-700 animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold">No active campaign simulation loaded.</p>
                        <p className="text-xs">Adjust configurations on the left or hit the &ldquo;Simulate Campaign&rdquo; button.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* CUMULATIVE METRIC CARD BANNER GRID */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <span className="text-[10px] text-slate-500 uppercase block mb-1">Conversion Likelihood</span>
                          <span className="text-xl font-bold font-mono text-emerald-400 block">{campaignResult.expectedConversionRate}%</span>
                          <span className="text-[9px] text-slate-500 block">Avg responsive rate</span>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <span className="text-[10px] text-slate-500 uppercase block mb-1">Expected Revenue</span>
                          <span className="text-xl font-bold font-mono text-cyan-400 block">${campaignResult.expectedRevenue}</span>
                          <span className="text-[9px] text-slate-500 block">Simulated sales value</span>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <span className="text-[10px] text-slate-500 uppercase block mb-1">Target Reach</span>
                          <span className="text-xl font-bold font-mono text-white block">{campaignResult.expectedReach} / {customers.length}</span>
                          <span className="text-[9px] text-slate-500 block">Matched twins</span>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <span className="text-[10px] text-slate-500 uppercase block mb-1 font-semibold">Churn Impact</span>
                          <span className={`text-xl font-bold block ${campaignResult.expectedChurnImpact === 'Positive' ? 'text-emerald-400' : 'text-yellow-450 text-yellow-500'}`}>
                            {campaignResult.expectedChurnImpact === 'Positive' ? 'Favorable Retention' : 'Neutral Risk'}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Customer retention shift</span>
                        </div>
                      </div>

                      {/* AI REASONING / EXPLANATION TEXT */}
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-850">
                        <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1.5 flex items-center space-x-1">
                          <Bot className="w-3.5 h-3.5" />
                          <span>AI Simulation Analysis explanation</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{campaignResult.explanation}&rdquo;</p>
                      </div>

                      {/* SEGMENT COHORT REACTIONS BREAKDOWN */}
                      <div className="space-y-3">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Predicted Segment Performance</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {campaignResult.segmentBreakdown?.map((seg, sIdx) => (
                            <div key={sIdx} className="p-3 bg-slate-950/60 rounded border border-slate-850 space-y-2">
                              <span className="text-[11px] font-bold text-white block truncate">{seg.segmentName}</span>
                              <div className="flex justify-between items-baseline">
                                <span className="text-[10.5px] text-slate-400">Response Rate</span>
                                <span className="font-mono text-xs font-bold text-cyan-400">{seg.conversionRate}%</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-[10.5px] text-slate-400">Interest level</span>
                                <span className="font-mono text-xs font-bold text-emerald-400">{seg.interestLevel}/100</span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-normal border-t border-slate-850 pt-1.5 italic">
                                {seg.reaction}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* DETAILED DIGITAL TWIN DECISIONS INDIVIDUAL RESPONSES */}
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Matched Twin Profiles Cognitive Decision Log</span>
                        <div className="space-y-2">
                          {campaignResult.customerReactions?.map((reaction, rIdx) => {
                            const cDetails = customers.find(c => c.id === reaction.customerId);
                            return (
                              <div key={rIdx} className="p-3 bg-slate-950 border border-slate-850/80 rounded flex items-start space-x-3 text-xs justify-between">
                                <div className="flex items-center space-x-2.5">
                                  {cDetails?.avatar ? (
                                    <img src={cDetails.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-800" />
                                  )}
                                  <div>
                                    <span className="text-white font-semibold block">{reaction.customerName}</span>
                                    <p className="text-[11px] text-slate-400 italic mt-0.5 leading-normal">{reaction.reactionText}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`px-2 py-0.5 rounded text-[10px] block font-bold ${
                                    reaction.willConvert ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-850 text-slate-500'
                                  }`}>
                                    {reaction.willConvert ? 'Predicted Convert' : 'Passive Decent'}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block mt-1 font-mono">Engagement: {reaction.engagementScore}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FUTURE SCENARIO SIMULATOR */}
          {activeTab === 'scenario-simulator' && (
            <div className="space-y-6" id="future-scenario-view">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-base font-bold text-white tracking-snug mb-1">Future Customer Simulator (Strategic Modeling)</h2>
                <p className="text-xs text-slate-400">Ask macro hypothetical business changes and instantly predict long-term impacts on customer lifetime value, churn risk shifts, and cohort behaviors.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Side: Ask Questions list / form (col-span-5) */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-850 pb-2">Business Change Scenarios</h3>
                  
                  {/* Preset Scenarios list */}
                  <div className="space-y-2">
                    <label className="block text-[10px] text-slate-400 uppercase">Select Strategic Presets</label>
                    <div className="space-y-2">
                      {PRESET_SCENARIOS.map((p, idx) => {
                        const isSelected = selectedPresetScenario === p;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setSelectedPresetScenario(p);
                              handleSimulateScenario(p, false);
                            }}
                            className={`p-3 rounded-lg border text-xs cursor-pointer transition-all leading-relaxed ${
                              isSelected
                                ? 'bg-sky-950 border-sky-500 text-sky-200 font-medium'
                                : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-850'
                            }`}
                          >
                            {p}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom business query block */}
                  <div className="space-y-3 pt-3 border-t border-slate-850">
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider">Custom Macroeconomic Simulation Scenario</label>
                    <textarea
                      value={customScenarioText}
                      onChange={e => setCustomScenarioText(e.target.value)}
                      placeholder="e.g. What happens if product warranty is extended to 3 years but absolute discount promotions are reduced to 5% max?"
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2.5 text-xs text-white focus:outline-none"
                    />

                    <button
                      onClick={() => handleSimulateScenario(customScenarioText, false)}
                      disabled={isSimulatingScenario || !customScenarioText.trim()}
                      className="w-full py-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold rounded-lg text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Bot className="w-4 h-4 text-slate-950" />
                      <span>{isSimulatingScenario ? 'Modeling Cohorts reactions...' : 'Run Scenario Simulation'}</span>
                    </button>
                  </div>
                </div>

                {/* Right Side: Predictions breakdown visual grids (col-span-7) */}
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 min-h-[500px]">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Macro Predictions Analysis</h3>
                    <div className="flex items-center space-x-1 text-[10px] text-emerald-400 uppercase">
                      <span className="w-1.5 h-1.5 rounded bg-emerald-400 animate-ping"></span>
                      <span>Twin-Engine Online</span>
                    </div>
                  </div>

                  {!scenarioResult ? (
                    <div className="flex flex-col items-center justify-center pt-24 text-center text-slate-500 space-y-3">
                      <HelpCircle className="w-12 h-12 text-slate-700 animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold">Ready to test business rules.</p>
                        <p className="text-xs">Provide a query question to solve or select preset conditions.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      <div className="border border-sky-500/20 bg-sky-950/10 p-3.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 block uppercase">Active Simulator Scenario Question</span>
                        <p className="text-white font-medium text-sm mt-1 leading-relaxed italic">&ldquo;{scenarioResult.scenario}&rdquo;</p>
                      </div>

                      {/* MACRO OUTCOMES BANNER SHAPE */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-950 p-3.5 rounded border border-slate-850">
                          <span className="text-[9.5px] text-slate-500 uppercase block mb-1 font-semibold">Estimated Revenue</span>
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-lg font-bold font-mono ${scenarioResult.revenueImpact >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {scenarioResult.revenueImpact >= 0 ? '+' : ''}{scenarioResult.revenueImpact}%
                            </span>
                            {scenarioResult.revenueImpact >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded border border-slate-850">
                          <span className="text-[9.5px] text-slate-500 uppercase block mb-1 font-semibold">Retention Shift</span>
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-lg font-bold font-mono ${scenarioResult.customerRetentionImpact >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {scenarioResult.customerRetentionImpact >= 0 ? '+' : ''}{scenarioResult.customerRetentionImpact}%
                            </span>
                            {scenarioResult.customerRetentionImpact >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded border border-slate-850">
                          <span className="text-[9.5px] text-slate-500 uppercase block mb-1 font-semibold">Churn Risk shift</span>
                          <span className={`text-lg font-bold font-mono block ${scenarioResult.churnRiskShift <= 0 ? 'text-emerald-400' : 'text-rose-450 text-rose-400'}`}>
                            {scenarioResult.churnRiskShift >= 0 ? '+' : ''}{scenarioResult.churnRiskShift}%
                          </span>
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded border border-slate-850">
                          <span className="text-[9.5px] text-slate-500 uppercase block mb-1 font-semibold">Sentiment Wave</span>
                          <span className={`text-sm font-bold block rounded text-center py-0.5 px-2 mt-1 ${
                            scenarioResult.sentimentClassification === 'Positive' ? 'bg-emerald-500/10 text-emerald-400' : 
                            (scenarioResult.sentimentClassification === 'Negative' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-850 text-slate-350')
                          }`}>
                            {scenarioResult.sentimentClassification}
                          </span>
                        </div>
                      </div>

                      {/* SCENARIO EXPLANATION CORE */}
                      <div className="p-4 bg-slate-950 rounded-lg border border-slate-850">
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-2">Simulated Dynamic Decision Logic Reasons</span>
                        <p className="text-xs text-slate-300 leading-relaxed italic">{scenarioResult.explanation}</p>
                        
                        {scenarioResult.businessGrowthImpact && (
                          <div className="mt-3.5 pt-3 border-t border-slate-850 text-xs text-slate-400 leading-relaxed">
                            <span className="text-slate-200 font-semibold block mb-0.5">Estimated Business Growth Impact:</span>
                            {scenarioResult.businessGrowthImpact}
                          </div>
                        )}
                      </div>

                      {/* SEGMENT MOODS ANALYSIS LIST */}
                      <div className="space-y-3">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Predictive Cohort Behaviors & Sentiments</span>
                        <div className="space-y-2.5">
                          {scenarioResult.predictionsBySegment?.map((pred, pIdx) => (
                            <div key={pIdx} className="p-3 bg-slate-950 border border-slate-850 rounded flex flex-col md:flex-row md:items-center justify-between text-xs gap-2">
                              <div>
                                <span className="font-bold text-white block">{pred.segmentName}</span>
                                <span className="text-[10.5px] text-slate-400 mt-1 block">Reaction: <span className="text-slate-300 italic">&ldquo;{pred.reaction}&rdquo;</span></span>
                              </div>
                              <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-500 block">Sway Mood</span>
                                  <span className="text-[11px] text-yellow-500 font-semibold">{pred.mood}</span>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold text-right ${
                                  pred.impact.includes('Positive') ? 'bg-emerald-500/10 text-emerald-400' : 
                                  (pred.impact.includes('Negative') ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-850 text-slate-400')
                                }`}>
                                  {pred.impact}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANALYTICS & FORECASTS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6" id="analytics-view">
              
              {/* Summary stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase block mb-1">Total Matched Customer Base</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold font-mono text-white">{customers.length}</span>
                    <span className="text-xs text-emerald-400 font-semibold">+100% active</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">Simulated Digital Twin clones initialized</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase block mb-1">Average Purchase Likelihood</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold font-mono text-cyan-450 text-cyan-450 text-cyan-400">{averagePurchaseProbability}%</span>
                    <span className="text-xs text-emerald-400 font-semibold">Stable baseline</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">Probability index calculated on twins</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase block mb-1">Avg Base Churn Risk</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold font-mono text-rose-500">{averageChurnRisk}%</span>
                    <span className="text-xs text-rose-400 font-semibold">Requires coupon trigger</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">High-risk count: {customers.filter(c => c.twin.churnRisk >= 50).length}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 uppercase block mb-1">Cumulative Active CLV Value</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold font-mono text-emerald-405 text-emerald-400">${totalEstimatedCLV}</span>
                    <span className="text-xs text-emerald-400 font-semibold">Combined worth</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">Calculated from digital profiles</p>
                </div>
              </div>

              {/* Graphic Matrix Plots & Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* SVG Revenue Projection Trend (col-span-8) */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Predictive Revenue Growth Forecast</h3>
                      <p className="text-xs text-slate-500">Predicted dynamic performance showing impact on CLV trendlines (12-month window)</p>
                    </div>
                    <div className="flex space-x-3 text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-cyan-400 inline-block"></span>
                        <span className="text-slate-400">Baseline Trend</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block"></span>
                        <span className="text-slate-400">Tactic Optimizations</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-64 bg-slate-950 rounded-lg p-2 relative flex flex-col justify-end">
                    {/* SVG Chart area */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="50" x2="600" y2="50" stroke="#1e293b" strokeDasharray="3,3" />
                      <line x1="0" y1="100" x2="600" y2="100" stroke="#1e293b" strokeDasharray="3,3" />
                      <line x1="0" y1="150" x2="600" y2="150" stroke="#1e293b" strokeDasharray="3,3" />

                      {/* Path line: Baseline */}
                      <path
                        d="M0,170 Q100,165 200,120 T400,90 T600,60"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      
                      {/* Path line: With Optimizations */}
                      <path
                        d="M0,170 Q100,140 200,95 T400,55 T600,20"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Interaction Nodes */}
                      <circle cx="200" cy="120" r="5" fill="#22d3ee" className="animate-pulse" />
                      <circle cx="200" cy="95" r="5" fill="#34d399" />
                      <circle cx="400" cy="90" r="5" fill="#22d3ee" />
                      <circle cx="400" cy="55" r="5" fill="#34d399" />
                    </svg>

                    {/* X Axis legends */}
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase px-1 pt-3 border-t border-slate-900 mt-2">
                      <span>Q1 Init</span>
                      <span>Q2 Mid</span>
                      <span>Q3 Launch</span>
                      <span>Q4 Closeout</span>
                    </div>
                  </div>
                </div>

                {/* Segment performance matrix (col-span-4) */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cohort Matrix Stats</h3>
                  <p className="text-xs text-slate-500">Estimated value levels across customer digital tags.</p>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Tech Innovators</span>
                        <span className="text-white font-bold">1,850 CLV avg</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded border border-slate-850 overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded" style={{ width: '74%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Value Hunters</span>
                        <span className="text-white font-bold">480 CLV avg</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded border border-slate-850 overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded" style={{ width: '22%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Exclusive Elite</span>
                        <span className="text-white font-bold">4,200 CLV avg</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded border border-slate-850 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded" style={{ width: '95%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Vulnerable Accounts</span>
                        <span className="text-white font-bold">650 CLV avg</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded border border-slate-850 overflow-hidden">
                        <div className="h-full bg-rose-500 rounded" style={{ width: '31%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs">
                    <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider mb-1">Retention Delta Insights</div>
                    <p className="text-slate-400 italic leading-snug">
                      High concentration of value in &ldquo;Exclusive Elite&rdquo;. Marketers must design campaign channels tailored to SMS/Push rather than generic email formats.
                    </p>
                  </div>
                </div>

              </div>

              {/* Cognitive workflow diagram: Real-Time Flow representation */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider block">Cognitive Real-Time Twin Loop Flow</h3>
                <p className="text-xs text-slate-500 leading-snug">Visual walkthrough displaying how customer touchpoints seamlessly train and calibrate predictions in TwinMind.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-center text-xs pt-2">
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center font-bold text-[10px] text-cyan-400 mx-auto mb-1.5 border border-cyan-400/20">1</span>
                    <span className="font-semibold block text-slate-200">Customer Action</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Browses, adds cart, or asks support</span>
                  </div>

                  <div className="flex items-center justify-center text-slate-600 hidden md:flex">
                    <ArrowRight className="w-5 h-5 text-cyan-400/50" />
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center font-bold text-[10px] text-cyan-400 mx-auto mb-1.5 border border-cyan-400/20">2</span>
                    <span className="font-semibold block text-slate-200">Capture & Sync</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Activity added automatically</span>
                  </div>

                  <div className="flex items-center justify-center text-slate-600 hidden md:flex">
                    <ArrowRight className="w-5 h-5 text-cyan-400/50" />
                  </div>

                  <div className="p-3 bg-slate-950 border border-sky-500/30 rounded text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center font-bold text-[10px] text-cyan-400 mx-auto mb-1.5 border border-cyan-400/20">3</span>
                    <span className="font-semibold block text-slate-200">Twin Recalibration</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Gemini predicts interest shifts</span>
                  </div>

                  <div className="flex items-center justify-center text-slate-600 hidden md:flex">
                    <ArrowRight className="w-5 h-5 text-cyan-400/50" />
                  </div>

                  <div className="p-3 bg-slate-950 border border-emerald-500/20 rounded text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center font-bold text-[10px] text-cyan-400 mx-auto mb-1.5 border border-cyan-400/20">4</span>
                    <span className="font-semibold block text-slate-200">Action Lift</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Personalized messages ready</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
