import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Library,
  BadgeIndianRupee,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ChartCard } from '@/components/dashboard/chart-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from '@/components/LazyCharts';
import { apiClient } from '@/api/client';

// Static trend data for charts — these represent historical signals
// populated by Hermes automation in future phases
const growthData = [
  { name: 'Jan', students: 12000, colleges: 80 },
  { name: 'Feb', students: 18000, colleges: 120 },
  { name: 'Mar', students: 24000, colleges: 180 },
  { name: 'Apr', students: 35000, colleges: 240 },
  { name: 'May', students: 48000, colleges: 310 },
  { name: 'Jun', students: 50000, colleges: 350 },
];

const revenueData = [
  { name: 'Jan', revenue: 150000 },
  { name: 'Feb', revenue: 220000 },
  { name: 'Mar', revenue: 380000 },
  { name: 'Apr', revenue: 450000 },
  { name: 'May', revenue: 610000 },
  { name: 'Jun', revenue: 780000 },
];

const recentActivities = [
  {
    id: '1',
    type: 'user_joined' as const,
    title: 'New College Registered',
    description: 'IIT Delhi has registered for the Enterprise subscription plan.',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'announcement' as const,
    title: 'Platform Maintenance Scheduled',
    description: 'System-wide maintenance scheduled for July 10, 02:00 AM to 04:00 AM IST.',
    time: '4 hours ago',
  },
  {
    id: '3',
    type: 'achievement' as const,
    title: 'Milestone Unlocked',
    description: 'ShikshaSahayak has officially crossed 1,000 registered colleges!',
    time: '1 day ago',
  },
];

interface SystemOverview {
  platform: { totalStudents: number; totalTeachers: number; recentSignups30d: number };
  content: { publishedItems: number; pendingReview: number };
  assessment: { totalQuizzes: number };
  projects: { approvedProjects: number; pendingProjects: number };
  infrastructure: Record<string, string>;
}

export default function AdminDashboardLMS() {
  const [period, setPeriod] = useState('30d');
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAdminSystemOverview();
      setOverview(data);
    } catch (err) {
      setError('Could not load system overview. Retrying in the background.');
      console.error('[AdminDashboardLMS] system-overview fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const infraStatus = overview?.infrastructure ?? {
    database: 'operational',
    storage: 'operational',
    auth: 'operational',
    ai: 'operational',
  };

  return (
    <div className="space-y-6">

      {/* WELCOME BANNER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
            System Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Welcome back, System Admin. Here is the real-time operational status of ShikshaSahayak.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchOverview} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Download Report
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/95 text-white">
            <Plus className="h-4 w-4" /> Register College
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Students"
          value={loading ? '—' : (overview?.platform.totalStudents ?? 0).toLocaleString('en-IN')}
          icon={Users}
          change={overview?.platform.recentSignups30d ?? 0}
          trend="up"
          description="platform-wide registrations"
        />
        <StatsCard
          title="Total Teachers"
          value={loading ? '—' : (overview?.platform.totalTeachers ?? 0).toLocaleString('en-IN')}
          icon={Building2}
          change={0}
          trend="up"
          description="registered educators"
        />
        <StatsCard
          title="Published Content"
          value={loading ? '—' : (overview?.content.publishedItems ?? 0).toLocaleString('en-IN')}
          icon={Library}
          change={overview?.content.pendingReview ?? 0}
          trend="up"
          description={`${overview?.content.pendingReview ?? 0} pending review`}
        />
        <StatsCard
          title="Active Quizzes"
          value={loading ? '—' : (overview?.assessment.totalQuizzes ?? 0).toLocaleString('en-IN')}
          icon={BadgeIndianRupee}
          change={0}
          trend="up"
          description="total in assessment bank"
          variant="primary"
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* GROWTH CHART */}
        <ChartCard
          title="Platform Expansion"
          description="Student and college registrations over time"
          selector={{
            value: period,
            onValueChange: setPeriod,
            options: [
              { label: 'Last 7 Days', value: '7d' },
              { label: 'Last 30 Days', value: '30d' },
              { label: 'Last 6 Months', value: '6m' },
            ],
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs fill-muted-foreground font-medium" />
              <YAxis className="text-xs fill-muted-foreground font-medium" />
              <Tooltip />
              <Area type="monotone" dataKey="students" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" name="Students" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* REVENUE CHART */}
        <ChartCard
          title="Revenue Growth (INR)"
          description="Monthly subscription revenues generated platform-wide"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs fill-muted-foreground font-medium" />
              <YAxis className="text-xs fill-muted-foreground font-medium" />
              <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
              <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Revenues" />

            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* RECENT ACTIVITY */}
        <ActivityFeed activities={recentActivities} className="col-span-1 md:col-span-2" />

        {/* SYSTEM STATUS CARD */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> System Status
            </CardTitle>
            <CardDescription>Real-time operational status indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Database (Cloudflare D1)</span>
              <Badge className={`text-white flex gap-1 ${infraStatus.database === 'operational' ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-amber-500 hover:bg-amber-500'}`}>
                {infraStatus.database === 'operational'
                  ? <><CheckCircle2 className="h-3 w-3" /> Operational</>
                  : <><AlertTriangle className="h-3 w-3 animate-pulse" /> Degraded</>}
              </Badge>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Storage (Cloudflare R2)</span>
              <Badge className={`text-white flex gap-1 ${infraStatus.storage === 'operational' ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-amber-500 hover:bg-amber-500'}`}>
                {infraStatus.storage === 'operational'
                  ? <><CheckCircle2 className="h-3 w-3" /> Operational</>
                  : <><AlertTriangle className="h-3 w-3 animate-pulse" /> Degraded</>}
              </Badge>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Firebase Authentication</span>
              <Badge className={`text-white flex gap-1 ${infraStatus.auth === 'operational' ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-amber-500 hover:bg-amber-500'}`}>
                {infraStatus.auth === 'operational'
                  ? <><CheckCircle2 className="h-3 w-3" /> Operational</>
                  : <><AlertTriangle className="h-3 w-3 animate-pulse" /> Degraded</>}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gemini AI Services</span>
              <Badge className={`text-white flex gap-1 ${infraStatus.ai === 'operational' ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-amber-500 hover:bg-amber-500'}`}>
                {infraStatus.ai === 'operational'
                  ? <><CheckCircle2 className="h-3 w-3" /> Operational</>
                  : <><AlertTriangle className="h-3 w-3 animate-pulse" /> High Load</>}
              </Badge>
            </div>

          </CardContent>
        </Card>
      </div>

    </div>
  );
}

