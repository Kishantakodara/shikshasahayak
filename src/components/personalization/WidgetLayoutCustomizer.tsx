// ============================================================
// SHIKSHA SAHAYAK OS - DASHBOARD WIDGET LAYOUT CUSTOMIZER MODAL
// ============================================================

import React, { useState } from "react";
import { WidgetCustomizationSpec } from "../../types/student-personalization";
import { DashboardWidgetKey } from "../../config/constants";
import { LayoutGrid, Eye, EyeOff, Pin, ArrowUp, ArrowDown, Save, X } from "lucide-react";

interface WidgetLayoutCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  currentWidgets: WidgetCustomizationSpec[];
  onSaveWidgets: (widgets: WidgetCustomizationSpec[]) => Promise<void>;
}

export const WidgetLayoutCustomizer: React.FC<WidgetLayoutCustomizerProps> = ({
  isOpen,
  onClose,
  currentWidgets,
  onSaveWidgets,
}) => {
  const [widgets, setWidgets] = useState<WidgetCustomizationSpec[]>(currentWidgets);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const widgetLabels: Record<DashboardWidgetKey, string> = {
    recent_materials: "Recent Study Materials",
    continue_learning: "Continue Learning",
    subjects_grid: "Current Semester Subjects",
    previous_papers: "Previous Year Question Papers (PYQs)",
    announcements: "Announcements & Notices",
    bookmarks: "Bookmarked Resources",
    recommended_resources: "Recommended Resources",
    quick_actions: "Quick Shortcuts",
  };

  const moveWidget = (index: number, direction: "up" | "down") => {
    const newWidgets = [...widgets];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newWidgets.length) return;

    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;

    // Update positions
    newWidgets.forEach((w, idx) => {
      w.position = idx + 1;
    });

    setWidgets(newWidgets);
  };

  const togglePin = (index: number) => {
    const newWidgets = [...widgets];
    newWidgets[index].isPinned = !newWidgets[index].isPinned;
    setWidgets(newWidgets);
  };

  const toggleVisibility = (index: number) => {
    const newWidgets = [...widgets];
    newWidgets[index].isVisible = !newWidgets[index].isVisible;
    setWidgets(newWidgets);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveWidgets(widgets);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B132B] text-white border border-slate-700/60 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-xl text-[#FF6B35]">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Customize Dashboard Widgets</h2>
            <p className="text-xs text-slate-400">Reorder, pin, or hide widgets on your homepage</p>
          </div>
        </div>

        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {widgets.map((widget, index) => (
            <div
              key={widget.widgetKey}
              className={`flex items-center justify-between p-3 rounded-xl border transition ${
                widget.isVisible
                  ? "bg-[#1C2541]/70 border-slate-700/60 text-slate-200"
                  : "bg-slate-900/40 border-slate-800 text-slate-500"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => togglePin(index)}
                  className={`p-1.5 rounded-lg transition ${
                    widget.isPinned
                      ? "bg-[#FF6B35]/20 text-[#FF6B35]"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                  title={widget.isPinned ? "Pinned to top" : "Pin widget"}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-medium truncate">
                  {widgetLabels[widget.widgetKey] || widget.widgetKey}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => moveWidget(index, "up")}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveWidget(index, "down")}
                  disabled={index === widgets.length - 1}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleVisibility(index)}
                  className={`p-1.5 rounded-lg transition ${
                    widget.isVisible
                      ? "text-emerald-400 hover:bg-emerald-500/10"
                      : "text-slate-500 hover:bg-slate-800"
                  }`}
                  title={widget.isVisible ? "Visible" : "Hidden"}
                >
                  {widget.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-5 mt-4 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-[#FF6B35] hover:bg-[#e05a2b] text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-[#FF6B35]/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Layout"}
          </button>
        </div>
      </div>
    </div>
  );
};
