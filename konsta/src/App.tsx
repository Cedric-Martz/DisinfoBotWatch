import { App, Page, Navbar, Block, Card, List, ListItem, Segmented, SegmentedButton, Badge } from 'konsta/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = '/api';

interface Stats {
  total_bots: number;
  total_tweets: number;
  unique_accounts: number;
  avg_tweets_per_bot: number;
}

interface TopAccount {
  author: string;
  tweet_count: number;
  account_type?: string;
  account_category?: string;
}

interface Distribution {
  account_type: string;
  account_category: string;
  count: number;
}

function MyApp() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [topAccounts, setTopAccounts] = useState<TopAccount[]>([]);
  const [distribution, setDistribution] = useState<Distribution[]>([]);
  const [topN, setTopN] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadTopAccounts();
    loadDistribution();
  }, []);

  useEffect(() => {
    if (activeTab === 'accounts') {
      loadTopAccounts();
    }
  }, [topN, activeTab]);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  const loadTopAccounts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/top-accounts`);
      setTopAccounts(response.data);
    } catch (error) {
      console.error('Error loading top accounts:', error);
    }
  };

  const loadDistribution = async () => {
    try {
      const response = await axios.get(`${API_BASE}/account-distribution`);
      setDistribution(response.data);
    } catch (error) {
      console.error('Error loading distribution:', error);
    }
  };

  const getTypeDistribution = () => {
    const typeGroups: { [key: string]: number } = {};
    distribution.forEach(item => {
      const type = item.account_type || 'Unknown';
      typeGroups[type] = (typeGroups[type] || 0) + (item.count || 0);
    });
    return Object.entries(typeGroups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const getCategoryDistribution = () => {
    const categoryGroups: { [key: string]: number } = {};
    distribution.forEach(item => {
      const category = item.account_category || 'Unknown';
      categoryGroups[category] = (categoryGroups[category] || 0) + (item.count || 0);
    });
    return Object.entries(categoryGroups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const COLORS = ['#6366f1', '#ec4899', '#0891b2', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9', '#a855f7', '#3b82f6'];

  return (
    <App theme="ios" dark={true}>
      <Page>
        <Navbar
          title="DisinfoBotWatch"
          subtitle="Russian Troll Bot Network Analysis"
          className="bg-gradient-to-r from-indigo-500 to-pink-500"
        />

        <Block className="space-y-4">
          <Segmented strong>
            <SegmentedButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </SegmentedButton>
            <SegmentedButton
              active={activeTab === 'accounts'}
              onClick={() => setActiveTab('accounts')}
            >
              Top Bots
            </SegmentedButton>
            <SegmentedButton
              active={activeTab === 'distribution'}
              onClick={() => setActiveTab('distribution')}
            >
              Distribution
            </SegmentedButton>
            <SegmentedButton
              active={activeTab === 'network'}
              onClick={() => setActiveTab('network')}
            >
              Network
            </SegmentedButton>
          </Segmented>

          {activeTab === 'overview' && stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="text-center">
                  <div className="text-5xl mb-2">🤖</div>
                  <div className="text-3xl font-bold text-indigo-500">{stats.total_bots.toLocaleString()}</div>
                  <div className="text-gray-400">Total Bots</div>
                </Card>
                <Card className="text-center">
                  <div className="text-5xl mb-2">📝</div>
                  <div className="text-3xl font-bold text-pink-500">{stats.total_tweets.toLocaleString()}</div>
                  <div className="text-gray-400">Total Tweets</div>
                </Card>
                <Card className="text-center">
                  <div className="text-5xl mb-2">👥</div>
                  <div className="text-3xl font-bold text-cyan-500">{stats.unique_accounts.toLocaleString()}</div>
                  <div className="text-gray-400">Unique Accounts</div>
                </Card>
                <Card className="text-center">
                  <div className="text-5xl mb-2">📊</div>
                  <div className="text-3xl font-bold text-amber-500">{stats.avg_tweets_per_bot.toLocaleString()}</div>
                  <div className="text-gray-400">Avg Tweets/Bot</div>
                </Card>
              </div>

              <Card>
                <h2 className="text-xl font-bold mb-4 text-indigo-400">About This Dataset</h2>
                <p className="mb-4">
                  This dataset contains tweets from accounts identified as part of the Russian Internet Research Agency (IRA).
                  All accounts are <strong>confirmed bot accounts</strong> used for coordinated disinformation campaigns.
                </p>
                <List nested>
                  <ListItem title="Account metadata (type, category, region, language)" />
                  <ListItem title="Tweet patterns and retweet ratios" />
                  <ListItem title="Coordinated posting behavior" />
                  <ListItem title="Mention networks and interactions" />
                </List>
              </Card>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-indigo-400">Top Active Bot Accounts</h2>
                  <select
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1"
                  >
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                    <option value={30}>Top 30</option>
                    <option value={50}>Top 50</option>
                  </select>
                </div>
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={topAccounts.slice(0, topN)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9ca3af" />
                      <YAxis dataKey="author" type="category" width={150} stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                      <Bar dataKey="tweet_count" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <List nested>
                  {topAccounts.slice(0, topN).map((account, idx) => (
                    <ListItem
                      key={idx}
                      title={account.author}
                      after={<Badge>{account.tweet_count.toLocaleString()}</Badge>}
                      subtitle={`${account.account_type || '-'} | ${account.account_category || '-'}`}
                    />
                  ))}
                </List>
              </Card>
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="space-y-4">
              <Card>
                <h3 className="text-lg font-bold mb-4 text-indigo-400">By Account Type</h3>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={getTypeDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getTypeDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold mb-4 text-indigo-400">By Account Category</h3>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={getCategoryDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getCategoryDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'network' && (
            <Card>
              <h2 className="text-xl font-bold mb-4 text-indigo-400">Bot Network Graph</h2>
              <div className="bg-gray-800 rounded-lg" style={{ height: '600px' }}>
                <iframe
                  src="/api/network-html"
                  className="w-full h-full border-0 rounded-lg"
                  title="Network Visualization"
                />
              </div>
              <p className="text-center text-gray-400 mt-4">
                Drag to pan | Scroll to zoom | Hover for details
              </p>
            </Card>
          )}
        </Block>
      </Page>
    </App>
  );
}

export default MyApp;
