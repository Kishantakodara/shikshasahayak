import React, { useState } from 'react';
import { 
  Settings, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck,
  Layers,
  GraduationCap
} from 'lucide-react';
import { getSiteControlState, saveSiteControlState, SiteControlState } from '../../utils/siteControl';

const ManageSettingsUI: React.FC = () => {
  const [siteConfig, setSiteConfig] = useState<SiteControlState>(getSiteControlState());

  const handleToggleFeature = (key: keyof SiteControlState) => {
    const updated = saveSiteControlState({ [key]: !siteConfig[key] });
    setSiteConfig(updated);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-primary" />
            Website Content & Display Controls
          </h2>
          <p className="text-sm text-muted mt-1 font-semibold">
            Control global feature switches and section visibility across the public website.
          </p>
        </div>
      </div>

      {/* Global Site Feature Toggles */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-text flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Global Website Section Visibility Switches
            </h3>
            <p className="text-xs text-muted font-semibold mt-0.5">
              Instantly enable or hide entire sections on the public website with a single click.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Syllabus Section Toggle */}
          <div className="bg-surface-secondary/60 border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-sm text-text">
                <BookOpen className="h-4 w-4 text-blue-500" /> Syllabus Section
              </div>
              <p className="text-[11px] text-muted">Show GTU syllabus cards site-wide</p>
            </div>
            <button
              onClick={() => handleToggleFeature('showSyllabus')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                siteConfig.showSyllabus ? 'bg-primary' : 'bg-gray-300 dark:bg-navy-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  siteConfig.showSyllabus ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* PYQ Section Toggle */}
          <div className="bg-surface-secondary/60 border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-sm text-text">
                <FileText className="h-4 w-4 text-purple-500" /> PYQ Question Papers
              </div>
              <p className="text-[11px] text-muted">Show PYQ archives & solution downloads</p>
            </div>
            <button
              onClick={() => handleToggleFeature('showPyqs')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                siteConfig.showPyqs ? 'bg-primary' : 'bg-gray-300 dark:bg-navy-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  siteConfig.showPyqs ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Study Notes Toggle */}
          <div className="bg-surface-secondary/60 border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-sm text-text">
                <Layers className="h-4 w-4 text-emerald-500" /> Study Notes & Formulas
              </div>
              <p className="text-[11px] text-muted">Show handwritten notes & unit guides</p>
            </div>
            <button
              onClick={() => handleToggleFeature('showNotes')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                siteConfig.showNotes ? 'bg-primary' : 'bg-gray-300 dark:bg-navy-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  siteConfig.showNotes ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Official GTU Syllabus PDF Banner */}
          <div className="bg-surface-secondary/60 border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-sm text-text">
                <Sparkles className="h-4 w-4 text-amber-500" /> GTU Official PDF Card
              </div>
              <p className="text-[11px] text-muted">Show verified S3 PDF viewer banner</p>
            </div>
            <button
              onClick={() => handleToggleFeature('showGtuSyllabusBanner')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                siteConfig.showGtuSyllabusBanner ? 'bg-primary' : 'bg-gray-300 dark:bg-navy-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  siteConfig.showGtuSyllabusBanner ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* AI Tutor Toggle */}
          <div className="bg-surface-secondary/60 border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-sm text-text">
                <HelpCircle className="h-4 w-4 text-cyan-500" /> AI Tutor Assistant
              </div>
              <p className="text-[11px] text-muted">Enable AI tutoring & solution helper</p>
            </div>
            <button
              onClick={() => handleToggleFeature('showAiTutor')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                siteConfig.showAiTutor ? 'bg-primary' : 'bg-gray-300 dark:bg-navy-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  siteConfig.showAiTutor ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* GATE 2027 Hub Toggle */}
          <div className="bg-surface-secondary/60 border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-sm text-text">
                <GraduationCap className="h-4 w-4 text-indigo-500" /> GATE 2027 Hub
              </div>
              <p className="text-[11px] text-muted">Show IIT Madras GATE portal</p>
            </div>
            <button
              onClick={() => handleToggleFeature('showGateHub')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                siteConfig.showGateHub ? 'bg-primary' : 'bg-gray-300 dark:bg-navy-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  siteConfig.showGateHub ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSettingsUI;
