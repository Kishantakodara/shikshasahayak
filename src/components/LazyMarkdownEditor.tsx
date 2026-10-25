import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const MDEditorComponent = lazy(() => import('@uiw/react-md-editor'));
const MDViewerComponent = lazy(() => import('@uiw/react-md-editor').then(m => ({ default: m.default.Markdown })));

export const LazyMDEditor: React.FC<any> = (props) => (
  <Suspense fallback={
    <div className="w-full h-48 bg-surface-secondary border border-border rounded-xl flex flex-col items-center justify-center p-4 text-muted text-xs">
      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
      <span>Loading Markdown Editor...</span>
    </div>
  }>
    <MDEditorComponent {...props} />
  </Suspense>
);

export const LazyMDMarkdown: React.FC<any> = (props) => (
  <Suspense fallback={
    <div className="w-full p-4 text-sm text-muted animate-pulse">
      Loading content...
    </div>
  }>
    <MDViewerComponent {...props} />
  </Suspense>
);

export default LazyMDEditor;
