// ============================================================
// SHIKSHA SAHAYAK OS - TEACHER PUBLISH MATERIAL MODAL COMPONENT
// ============================================================

import React, { useState } from "react";
import { TeacherSubjectAssignmentSpec } from "../../types/teacher-portal";
import { AcademicResourceType } from "../../types/study-material";
import { Upload, FileText, CheckCircle, X } from "lucide-react";

interface PublishMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: TeacherSubjectAssignmentSpec | null;
  onPublish: (payload: {
    title: string;
    description: string;
    resourceType: AcademicResourceType;
    fileUrl: string;
    unitId?: string;
  }) => Promise<void>;
}

export const PublishMaterialModal: React.FC<PublishMaterialModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onPublish,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<AcademicResourceType>("notes");
  const [fileUrl, setFileUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) return;

    setIsPublishing(true);
    await onPublish({
      title,
      description,
      resourceType,
      fileUrl,
    });
    setIsPublishing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B132B] text-white border border-slate-700/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-xl text-[#FF6B35]">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Publish Material Resource</h2>
            <p className="text-xs text-slate-400">
              Class {assignment.className} • {assignment.subjectId.toUpperCase()} (Sem {assignment.semester})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Resource Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 2 CPU Scheduling Complete Notes"
              className="w-full bg-[#1C2541] border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Resource Type</label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as AcademicResourceType)}
              className="w-full bg-[#1C2541] border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B35]"
            >
              <option value="notes">Lecture Notes</option>
              <option value="pyq">Previous Year Question Paper (PYQ)</option>
              <option value="syllabus">Syllabus Document</option>
              <option value="assignment">Class Assignment</option>
              <option value="lab_manual">Lab Manual</option>
              <option value="reference">Reference Material</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Resource / Document URL *</label>
            <input
              type="url"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://storage.padhakuportal.com/materials/..."
              className="w-full bg-[#1C2541] border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional guidance for students..."
              className="w-full bg-[#1C2541] border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPublishing}
              className="px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e05a2b] text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-[#FF6B35]/20 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {isPublishing ? "Publishing..." : "Publish Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
