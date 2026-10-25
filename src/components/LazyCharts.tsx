import React, { lazy, Suspense } from 'react';

const AreaChartComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.AreaChart as any })));
const AreaComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.Area as any })));
const BarChartComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.BarChart as any })));
const BarComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.Bar as any })));
const LineChartComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.LineChart as any })));
const LineComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.Line as any })));
const XAxisComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.XAxis as any })));
const YAxisComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.YAxis as any })));
const CartesianGridComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.CartesianGrid as any })));
const TooltipComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.Tooltip as any })));
const ResponsiveContainerComponent = lazy<any>(() => import('recharts').then(m => ({ default: m.ResponsiveContainer as any })));

const Fallback: React.FC = () => (
  <div className="w-full h-full min-h-[200px] bg-surface-secondary/50 rounded-xl animate-pulse flex items-center justify-center text-xs text-muted">
    Loading Chart...
  </div>
);

export const AreaChart: React.FC<any> = (props) => <Suspense fallback={<Fallback />}><AreaChartComponent {...props} /></Suspense>;
export const Area: React.FC<any> = (props) => <Suspense fallback={null}><AreaComponent {...props} /></Suspense>;
export const BarChart: React.FC<any> = (props) => <Suspense fallback={<Fallback />}><BarChartComponent {...props} /></Suspense>;
export const Bar: React.FC<any> = (props) => <Suspense fallback={null}><BarComponent {...props} /></Suspense>;
export const LineChart: React.FC<any> = (props) => <Suspense fallback={<Fallback />}><LineChartComponent {...props} /></Suspense>;
export const Line: React.FC<any> = (props) => <Suspense fallback={null}><LineComponent {...props} /></Suspense>;
export const XAxis: React.FC<any> = (props) => <Suspense fallback={null}><XAxisComponent {...props} /></Suspense>;
export const YAxis: React.FC<any> = (props) => <Suspense fallback={null}><YAxisComponent {...props} /></Suspense>;
export const CartesianGrid: React.FC<any> = (props) => <Suspense fallback={null}><CartesianGridComponent {...props} /></Suspense>;
export const Tooltip: React.FC<any> = (props) => <Suspense fallback={null}><TooltipComponent {...props} /></Suspense>;
export const ChartTooltip: React.FC<any> = (props) => <Suspense fallback={null}><TooltipComponent {...props} /></Suspense>;
export const ResponsiveContainer: React.FC<any> = (props) => <Suspense fallback={<Fallback />}><ResponsiveContainerComponent {...props} /></Suspense>;
