// ============================================================
// SHIKSHA SAHAYAK OS: CURRICULUM CMS HUB
// Single Source of Truth for Academic Hierarchy Below Subject
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Plus,
  Upload,
  Download,
  Folder,
  FolderOpen,
  FileText,
  Book,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  ArrowRight,
  X,
  Building2,
  Calendar,
  AlertCircle,
  Zap,
  ShieldCheck,
  MoveVertical,
} from 'lucide-react';
import { AdminContentShell, KPICardItem } from './AdminContentShell';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { toast } from 'sonner';
import { AdminSubjectWorkspace } from './AdminSubjectWorkspace';

interface HierarchyNode {
  id: string;
  name: string;
  type: 'university' | 'branch' | 'semester' | 'subject' | 'unit' | 'topic';
  code?: string;
  unitNo?: number;
  topicNo?: number;
  subjectId?: string;
  unitId?: string;
  description?: string;
  topicsCount?: number;
  materialsCount?: number;
  pyqsCount?: number;
  children?: HierarchyNode[];
  lastUpdated?: string;
}

interface AdminCurriculumCMSHubProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
}

export const AdminCurriculumCMSHub: React.FC<AdminCurriculumCMSHubProps> = ({
  onNavigateToTab,
}) => {
  const [workspaceSubjectId, setWorkspaceSubjectId] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<HierarchyNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTreeQuery, setSearchTreeQuery] = useState('');

  // Unit and Topic sub-items for selected node
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [topicsList, setTopicsList] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Modals
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [unitForm, setUnitForm] = useState({ unitNo: '1', title: '', description: '' });

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  const [topicForm, setTopicForm] = useState({ topicNo: '1.1', title: '', description: '' });

  // Overview KPIs
  const [overviewKpis, setOverviewKpis] = useState({
    universities: 1,
    branches: 0,
    semesters: 0,
    subjects: 0,
    units: 0,
    topics: 0,
  });

  const loadHierarchy = async () => {
    setIsLoading(true);
    try {
      const [overview, subjectsData, branchesData] = await Promise.all([
        academicManagementClient.getOverview(),
        academicManagementClient.getSubjects(),
        academicManagementClient.getBranches(),
      ]);

      if (overview?.kpis) {
        setOverviewKpis({
          universities: overview.kpis.universities?.total || 1,
          branches: overview.kpis.branches?.total || 0,
          semesters: overview.kpis.semesters?.total || 0,
          subjects: overview.kpis.subjects?.total || 0,
          units: overview.kpis.units || 0,
          topics: overview.kpis.topics || 0,
        });
      }

      // Construct interactive Tree starting from GTU
      const gtuNode: HierarchyNode = {
        id: 'univ_gtu',
        name: 'Gujarat Technological University (GTU)',
        type: 'university',
        code: 'GTU',
        children: [],
      };

      // 1. Initialize branchMap with all authoritative GTU branches
      const branchMap: Record<string, { branchName: string; branchShort: string; subjects: any[] }> = {};

      if (Array.isArray(branchesData) && branchesData.length > 0) {
        branchesData.forEach((b: any) => {
          branchMap[b.id] = {
            branchName: b.name,
            branchShort: b.shortName || b.code || b.name,
            subjects: [],
          };
        });
      }

      // 2. Populate subjects into their corresponding branch bucket
      if (Array.isArray(subjectsData) && subjectsData.length > 0) {
        subjectsData.forEach((sub: any) => {
          const bKey = sub.branchId || sub.branchShort || sub.branchName || 'ENGG';
          if (!branchMap[bKey]) {
            branchMap[bKey] = {
              branchName: sub.branchName || 'Engineering',
              branchShort: sub.branchShort || sub.branchCode || 'ENGG',
              subjects: [],
            };
          }
          branchMap[bKey].subjects.push(sub);
        });
      }

      // 3. For every branch, deterministically generate all 8 Semesters
      gtuNode.children = Object.entries(branchMap).map(([bId, bVal]) => {
        // Group subjects by Semester number
        const semMap: Record<number, any[]> = {};
        bVal.subjects.forEach((s) => {
          const sem = Number(s.semester || 1);
          if (!semMap[sem]) semMap[sem] = [];
          semMap[sem].push(s);
        });

        return {
          id: `branch_${bId}`,
          name: `${bVal.branchName} (${bVal.branchShort})`,
          type: 'branch' as const,
          code: bVal.branchShort,
          children: [1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
            const sList = semMap[semNum] || [];
            return {
              id: `sem_${bId}_${semNum}`,
              name: `Semester ${semNum}`,
              type: 'semester' as const,
              children: sList.map((s) => ({
                id: s.id,
                name: s.name,
                type: 'subject' as const,
                code: s.code,
                subjectId: s.id,
                topicsCount: s.unitsCount || 0,
                materialsCount: s.materialsCount || 0,
                pyqsCount: s.pyqsCount || 0,
                description: `Subject Offering: ${s.code || 'N/A'} • Sem ${s.semester}`,
              })),
            };
          }),
        };
      });

      setTreeData(gtuNode);

      // Auto-expand GTU and first branch
      const autoExpanded: Record<string, boolean> = { univ_gtu: true };
      if (gtuNode.children && gtuNode.children[0]) {
        autoExpanded[gtuNode.children[0].id] = true;
        if (gtuNode.children[0].children && gtuNode.children[0].children[0]) {
          autoExpanded[gtuNode.children[0].children[0].id] = true;
          // Select first subject by default
          if (gtuNode.children[0].children[0].children && gtuNode.children[0].children[0].children[0]) {
            handleSelectNode(gtuNode.children[0].children[0].children[0]);
          }
        }
      }
      setExpandedNodes(autoExpanded);
    } catch (e) {
      console.error('Error fetching curriculum hierarchy:', e);
      toast.error('Failed to load curriculum tree');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHierarchy();
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleSelectNode = async (node: HierarchyNode) => {
    setSelectedNode(node);
    if (node.type === 'subject') {
      setIsLoadingDetails(true);
      try {
        const [uData, tData] = await Promise.all([
          academicManagementClient.getUnits(node.id),
          academicManagementClient.getTopics({ subjectId: node.id }),
        ]);
        setUnitsList(Array.isArray(uData) ? uData : []);
        setTopicsList(Array.isArray(tData) ? tData : []);
      } catch (e) {
        console.error('Error fetching units for subject:', e);
        setUnitsList([]);
        setTopicsList([]);
      } finally {
        setIsLoadingDetails(false);
      }
    } else if (node.type === 'unit') {
      setIsLoadingDetails(true);
      try {
        const tData = await academicManagementClient.getTopics({ unitId: node.id });
        setTopicsList(Array.isArray(tData) ? tData : []);
      } catch (e) {
        console.error('Error fetching topics for unit:', e);
        setTopicsList([]);
      } finally {
        setIsLoadingDetails(false);
      }
    }
  };

  // Unit Actions
  const handleOpenAddUnit = (unitToEdit?: any) => {
    if (unitToEdit) {
      setEditingUnit(unitToEdit);
      setUnitForm({
        unitNo: unitToEdit.unit_no?.toString() || '1',
        title: unitToEdit.title || '',
        description: unitToEdit.description || '',
      });
    } else {
      setEditingUnit(null);
      const nextUnitNo = (unitsList.length + 1).toString();
      setUnitForm({ unitNo: nextUnitNo, title: '', description: '' });
    }
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || (selectedNode.type !== 'subject' && !selectedNode.subjectId)) {
      toast.error('Please select a subject in the tree first');
      return;
    }

    const subId = selectedNode.type === 'subject' ? selectedNode.id : selectedNode.subjectId!;
    try {
      await academicManagementClient.saveUnit({
        id: editingUnit?.id,
        subjectId: subId,
        unitNo: Number(unitForm.unitNo),
        title: unitForm.title.trim(),
        description: unitForm.description.trim() || undefined,
      });

      toast.success(editingUnit ? 'Unit updated successfully' : 'Unit added to curriculum');
      setIsUnitModalOpen(false);
      // Reload units
      const uData = await academicManagementClient.getUnits(subId);
      setUnitsList(Array.isArray(uData) ? uData : []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save unit');
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit and all its topics?')) return;
    try {
      await academicManagementClient.deleteUnit(unitId);
      toast.success('Unit deleted successfully');
      setUnitsList((prev) => prev.filter((u) => u.id !== unitId));
      setTopicsList((prev) => prev.filter((t) => t.unit_id !== unitId));
    } catch (err: any) {
      toast.error('Failed to delete unit');
    }
  };

  // Topic Actions
  const handleOpenAddTopic = (unitId?: string, topicToEdit?: any) => {
    if (topicToEdit) {
      setEditingTopic(topicToEdit);
      setTopicForm({
        topicNo: topicToEdit.topic_no?.toString() || '1.1',
        title: topicToEdit.title || '',
        description: topicToEdit.description || '',
      });
    } else {
      setEditingTopic(null);
      setTopicForm({ topicNo: '1.1', title: '', description: '' });
    }
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent, unitId: string) => {
    e.preventDefault();
    try {
      await academicManagementClient.saveTopic({
        id: editingTopic?.id,
        unitId,
        topicNo: Number(topicForm.topicNo) || 1,
        title: topicForm.title.trim(),
        description: topicForm.description.trim() || undefined,
      });

      toast.success(editingTopic ? 'Topic updated successfully' : 'Topic added to curriculum');
      setIsTopicModalOpen(false);
      // Reload topics
      const subId = selectedNode?.type === 'subject' ? selectedNode.id : selectedNode?.subjectId;
      const tData = await academicManagementClient.getTopics({ subjectId: subId });
      setTopicsList(Array.isArray(tData) ? tData : []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save topic');
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    try {
      await academicManagementClient.deleteTopic(topicId);
      toast.success('Topic removed from curriculum');
      setTopicsList((prev) => prev.filter((t) => t.id !== topicId));
    } catch (err: any) {
      toast.error('Failed to delete topic');
    }
  };

  // Tree Render Recursive Helper
  const renderTreeNode = (node: HierarchyNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isSelected = selectedNode?.id === node.id;

    // Filter tree by search
    if (searchTreeQuery) {
      const matchSelf = node.name.toLowerCase().includes(searchTreeQuery.toLowerCase()) ||
        (node.code && node.code.toLowerCase().includes(searchTreeQuery.toLowerCase()));
      const matchChild = node.children?.some(c => 
        c.name.toLowerCase().includes(searchTreeQuery.toLowerCase()) ||
        c.children?.some(sc => sc.name.toLowerCase().includes(searchTreeQuery.toLowerCase()))
      );
      if (!matchSelf && !matchChild) return null;
    }

    const Icon =
      node.type === 'university'
        ? Building2
        : node.type === 'branch'
        ? Layers
        : node.type === 'semester'
        ? Calendar
        : node.type === 'subject'
        ? Book
        : node.type === 'unit'
        ? Folder
        : FileText;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            handleSelectNode(node);
          }}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-xl transition cursor-pointer text-xs ${
            isSelected
              ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20'
              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
          }`}
          style={{ paddingLeft: `${Math.max(8, level * 14)}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="text-slate-500 hover:text-white"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          <Icon
            className={`w-3.5 h-3.5 shrink-0 ${
              node.type === 'university'
                ? 'text-orange-400'
                : node.type === 'branch'
                ? 'text-blue-400'
                : node.type === 'semester'
                ? 'text-purple-400'
                : 'text-emerald-400'
            }`}
          />

          <span className="truncate flex-1">{node.name}</span>

          {node.code && (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">
              {node.code}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const kpis: KPICardItem[] = [
    {
      label: 'ACADEMIC BRANCHES',
      value: overviewKpis.branches || 1,
      icon: Layers,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      subtext: 'Engineering faculties',
    },
    {
      label: 'SUBJECT OFFERINGS',
      value: overviewKpis.subjects || 0,
      icon: Book,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      subtext: 'Master academic courses',
    },
    {
      label: 'CURRICULUM UNITS',
      value: unitsList.length || overviewKpis.units || 0,
      icon: Folder,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      subtext: 'Hierarchical unit structures',
    },
    {
      label: 'INDEXED TOPICS',
      value: topicsList.length || overviewKpis.topics || 0,
      icon: Sparkles,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      subtext: 'Ready for AI Content Factory',
    },
  ];

  if (workspaceSubjectId) {
    return (
      <AdminSubjectWorkspace
        subjectId={workspaceSubjectId}
        onBack={() => setWorkspaceSubjectId(null)}
      />
    );
  }

  return (
    <AdminContentShell
      title="Curriculum CMS"
      description="Single Source of Truth for academic hierarchy below Subject. Creating units and topics here immediately indexes them for Content Factory generation and student study discovery."
      breadcrumb={['ShikshaSahayak Admin', 'Content Management', 'Curriculum CMS']}
      primaryAction={{
        label: 'Add Unit',
        icon: Plus,
        onClick: () => {
          if (!selectedNode || (selectedNode.type !== 'subject' && !selectedNode.subjectId)) {
            toast.error('Please select a Subject from the left tree first');
            return;
          }
          handleOpenAddUnit();
        },
      }}
      kpis={kpis}
      onRefresh={loadHierarchy}
      isLoading={isLoading}
    >
      {/* Split-Pane Hierarchy View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[560px]">
        {/* LEFT PANE: Academic Tree (4 cols) */}
        <div className="lg:col-span-4 bg-[#0F172A] rounded-2xl border border-slate-800 p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Database className="w-4 h-4 text-orange-400" />
                <span>ACADEMIC TREE</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">GTU SSoT</span>
            </div>

            {/* Tree Search */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search branch, sem, subject..."
                value={searchTreeQuery}
                onChange={(e) => setSearchTreeQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Tree Container */}
            <div className="overflow-y-auto max-h-[460px] space-y-1 pr-1 font-sans">
              {treeData ? (
                renderTreeNode(treeData)
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">Loading tree structure...</div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between font-mono">
            <span>GTU Hierarchy</span>
            <span>Univ → Branch → Sem → Subject</span>
          </div>
        </div>

        {/* RIGHT PANE: Entity Inspector & Topics Management (8 cols) */}
        <div className="lg:col-span-8 bg-[#0F172A] rounded-2xl border border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-5">
              {/* Selected Node Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-orange-400 uppercase tracking-wider font-bold">
                    <span>{selectedNode.type}</span>
                    {selectedNode.code && <span>• {selectedNode.code}</span>}
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-0.5">{selectedNode.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedNode.description || 'Academic entity in ShikshaSahayak Curriculum'}
                  </p>
                </div>

                {/* Subject / Unit Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedNode.type === 'subject' && (
                    <>
                      <button
                        onClick={() => setWorkspaceSubjectId(selectedNode.id)}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Open Subject Workspace</span>
                      </button>
                      <button
                        onClick={() => handleOpenAddUnit()}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-orange-400" />
                        <span>Add Unit</span>
                      </button>
                    </>
                  )}

                  {onNavigateToTab && selectedNode.type === 'subject' && (
                    <button
                      onClick={() => onNavigateToTab('content-factory', { subjectId: selectedNode.id })}
                      className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold rounded-xl border border-purple-500/20 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Content Factory</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Branch View: Show all 8 Semesters */}
              {selectedNode.type === 'branch' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span>Curriculum Semesters (8 Semesters)</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      8 Semesters Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(selectedNode.children || []).map((semNode) => {
                      const count = semNode.children?.length || 0;
                      return (
                        <div
                          key={semNode.id}
                          onClick={() => handleSelectNode(semNode)}
                          className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/60 transition cursor-pointer flex flex-col justify-between group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-white group-hover:text-orange-400 transition">
                              {semNode.name}
                            </span>
                            <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-mono font-bold text-xs">
                              {semNode.name.replace('Semester ', '')}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px]">
                            <span className={count > 0 ? "text-orange-400 font-bold" : "text-slate-500"}>
                              {count} {count === 1 ? 'Subject' : 'Subjects'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Semester View: Show Subjects in this Semester */}
              {selectedNode.type === 'semester' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Book className="w-4 h-4 text-orange-400" />
                      <span>Subjects in {selectedNode.name}</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedNode.children?.length || 0} Subject Offerings
                    </span>
                  </div>

                  {selectedNode.children && selectedNode.children.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedNode.children.map((subNode) => (
                        <div
                          key={subNode.id}
                          onClick={() => handleSelectNode(subNode)}
                          className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div>
                            <span className="text-[10px] font-mono text-orange-400 font-bold block">
                              {subNode.code || 'CODE'}
                            </span>
                            <h5 className="font-bold text-xs text-white group-hover:text-orange-400 transition">
                              {subNode.name}
                            </h5>
                            <span className="text-[10px] text-slate-400">
                              {subNode.topicsCount || 0} Units • {subNode.materialsCount || 0} Notes
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                      <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">No subjects cataloged for {selectedNode.name} yet</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        This semester is active and ready for curriculum subject offerings and unit mappings.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Subject View: Units & Topics Accordion */}
              {selectedNode.type === 'subject' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-400" />
                      <span>Curriculum Units & Topics Breakdown</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {unitsList.length} Units • {topicsList.length} Topics
                    </span>
                  </div>

                  {isLoadingDetails ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Loading curriculum units & topics...
                    </div>
                  ) : unitsList.length > 0 ? (
                    <div className="space-y-3">
                      {unitsList.map((unit) => {
                        const unitTopics = topicsList.filter((t) => t.unit_id === unit.id);
                        return (
                          <div
                            key={unit.id}
                            className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden"
                          >
                            {/* Unit Title Bar */}
                            <div className="p-3.5 bg-slate-900 flex items-center justify-between border-b border-slate-800/80">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-mono font-bold text-xs">
                                  {unit.unit_no}
                                </span>
                                <div>
                                  <h5 className="font-bold text-xs text-white">
                                    Unit {unit.unit_no}: {unit.title}
                                  </h5>
                                  {unit.description && (
                                    <p className="text-[10px] text-slate-400">{unit.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenAddTopic(unit.id)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-700"
                                >
                                  <Plus className="w-3 h-3 text-orange-400" />
                                  <span>Add Topic</span>
                                </button>

                                <button
                                  onClick={() => handleOpenAddUnit(unit)}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                                  title="Edit Unit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteUnit(unit.id)}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                                  title="Delete Unit"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Topics List */}
                            <div className="p-3 space-y-2">
                              {unitTopics.length > 0 ? (
                                unitTopics.map((topic) => (
                                  <div
                                    key={topic.id}
                                    className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition group"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-[10px] font-mono text-purple-400 font-bold">
                                        #{topic.topic_no}
                                      </span>
                                      <div>
                                        <p className="text-xs font-bold text-slate-200 group-hover:text-orange-400 transition">
                                          {topic.title}
                                        </p>
                                        {topic.description && (
                                          <p className="text-[10px] text-slate-500">
                                            {topic.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      {onNavigateToTab && (
                                        <button
                                          onClick={() =>
                                            onNavigateToTab('content-factory', {
                                              subjectId: selectedNode.id,
                                              topicId: topic.id,
                                              topicTitle: topic.title,
                                            })
                                          }
                                          className="px-2 py-0.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded border border-purple-500/20 transition cursor-pointer flex items-center gap-1"
                                          title="Generate study content for this topic"
                                        >
                                          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                          <span>Generate</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleOpenAddTopic(unit.id, topic)}
                                        className="p-1 text-slate-500 hover:text-white transition"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>

                                      <button
                                        onClick={() => handleDeleteTopic(topic.id)}
                                        className="p-1 text-slate-500 hover:text-red-400 transition"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="py-3 text-center text-slate-500 text-[11px] font-mono">
                                  No topics added yet. Click "+ Add Topic" above.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                      <Folder className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">No units defined for this subject</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Click "+ Add Unit" above to build the curriculum hierarchy.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500">
              <Database className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-400">Select an entity from the tree</p>
              <p className="text-xs text-slate-500 mt-1">
                Choose any Branch, Semester, or Subject on the left to inspect units and topics.
              </p>
            </div>
          )}

          {/* SSoT Explanation Footnote */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Single Source of Truth: D1 subject_units & subject_topics</span>
            <span>Changes persist immediately to Content Factory</span>
          </div>
        </div>
      </div>

      {/* 2. Educational Footer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>HIERARCHY SSoT</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Curriculum CMS is the single source of truth for all unit and topic definitions under subjects.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>CONTENT FACTORY BRIDGE</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every topic created here is instantly selectable inside Content Factory for generating AI notes.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>STUDENT DISCOVERY</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Students navigate content through this exact tree structure on the public student portal.
          </p>
        </div>
      </div>

      {/* 3. Add / Edit Unit Modal */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {editingUnit ? 'Edit Curriculum Unit' : 'Add Curriculum Unit'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Subject: {selectedNode?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Unit Number *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={unitForm.unitNo}
                  onChange={(e) => setUnitForm({ ...unitForm, unitNo: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Unit Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Introduction to OSI & TCP/IP Model"
                  value={unitForm.title}
                  onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description / Objective
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of concepts covered in this unit..."
                  value={unitForm.description}
                  onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-orange-500/20"
                >
                  {editingUnit ? 'Save Changes' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add / Edit Topic Modal */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {editingTopic ? 'Edit Topic' : 'Add Curriculum Topic'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Immediately indexes for Content Factory
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                const targetUnit = unitsList[0]?.id;
                if (!targetUnit) {
                  toast.error('No unit available');
                  return;
                }
                handleSaveTopic(e, targetUnit);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Topic Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1.1 or 2.3"
                  value={topicForm.topicNo}
                  onChange={(e) => setTopicForm({ ...topicForm, topicNo: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. OSI Reference Model 7 Layers Architecture"
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Topic Description / Key Concepts
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific syllabus focus areas..."
                  value={topicForm.description}
                  onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-purple-500/20"
                >
                  {editingTopic ? 'Save Changes' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminContentShell>
  );
};
