import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { apiClient } from '../api/client';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  BookOpen, 
  Tag, 
  Building,
  ExternalLink
} from 'lucide-react';
import { getGtuOfficialSyllabusUrl, getCurrentAcademicYear } from '../utils/gtuSyllabus';
import AuthorByline from '../components/common/AuthorByline';
import SeoContentBlock from '../components/ads/SeoContentBlock';

const AcademicStudyMaterialView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const data = await apiClient.getAcademicStudyMaterial(id as string);
        setMaterial(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">Loading...</div>;
  if (!material) return <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">Study material not found.</div>;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-300 font-sans pb-20">
      {/* Header / Cover Image */}
      <div className="relative h-[40vh] min-h-[300px] w-full bg-slate-900">
        <img src={material.cover_image_url} alt={material.title} className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end pb-12 max-w-5xl mx-auto px-6 lg:px-8">
          <Link to="/AyushAn0607/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 w-fit">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {material.branch_name}
            </span>
            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Semester {material.semester}
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {material.subject_name}
            </span>
            {material.subject_code && (
              <a
                href={getGtuOfficialSyllabusUrl(material.subject_code)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                Official GTU Syllabus <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-6 max-w-4xl">
            {material.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" /> {material.faculty_name || 'Admin'}
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" /> {material.university} ({material.academic_year})
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {new Date(material.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> {material.views || 0} views
            </div>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
        
        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="bg-[#1E293B] rounded-2xl p-6 md:p-8 border border-slate-700/50 shadow-xl" data-color-mode="dark">
            <MDEditor.Markdown 
              source={material.content} 
              style={{ backgroundColor: 'transparent' }}
              className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-a:text-[#6366F1] hover:prose-a:text-blue-400"
            />
          </div>
          
          <div className="mt-8 flex items-center gap-3">
            <Tag className="h-5 w-5 text-slate-500" />
            <div className="flex flex-wrap gap-2">
              {material.tags && material.tags.split(',').map((tag: string) => (
                <span key={tag} className="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg text-sm border border-slate-700">
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Sticky Download) */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 space-y-6">
            
            <div className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] rounded-2xl p-6 border border-slate-700/50 shadow-xl">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Download PDF</h3>
              <p className="text-sm text-slate-400 mb-6">Get the complete high-quality PDF version of this study material for offline studying.</p>
              
              <a href={material.pdf_url} target="_blank" rel="noreferrer" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group">
                <Download className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
                Download PDF
              </a>
              
              <div className="mt-4 text-center">
                <span className="text-xs font-medium text-slate-500 flex items-center justify-center gap-1">
                  Downloaded {material.downloads} times
                </span>
              </div>
            </div>

            <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Related Study Materials</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <Link to="#" key={item} className="flex gap-4 group">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700 group-hover:border-slate-500 transition-colors">
                      <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=150&auto=format&fit=crop" alt="Related" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors leading-tight mb-1">Operating Systems - Memory Management</h4>
                      <p className="text-xs text-slate-500">Sem 4 • IT</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>

        <AuthorByline 
          authorName={material.author || "ShikshaSahayak Engineering Editorial Staff"}
          reviewerName="GTU Academic Subject Moderator Panel"
          updatedDate={material.date || `Academic Session ${getCurrentAcademicYear()}`}
          readTime="7 min read"
        />

        <SeoContentBlock title={`Academic Guide & Study Strategy for ${material.title}`}>
          <div className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            <h4 className="text-base font-bold text-navy-900 dark:text-white">1. Document Purpose & Curriculum Scope</h4>
            <p>
              This comprehensive academic study resource titled <strong>{material.title}</strong> has been structured to support undergraduate engineering students under Gujarat Technological University (GTU). Grounded in the prescribed NEP 2020 syllabus guidelines, it provides concise unit breakdowns, mathematical proofs, circuit diagrams, and key algorithm pseudocodes.
            </p>
            <p>
              Reviewing this document in conjunction with the official GTU course circular enables students to prepare systematically for mid-term internal examinations, viva-voce assessments, and final end-semester theory papers (70 Marks ESE).
            </p>

            <h4 className="text-base font-bold text-navy-900 dark:text-white mt-6">2. Strategic Revision & Examination Tips</h4>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li><strong>Focus on 7-Mark Long Questions:</strong> Identify recurring descriptive concepts and practice neat labeled block diagrams.</li>
              <li><strong>Numerical & Formula Consistency:</strong> Cross-reference intermediate equations with standard GTU reference textbooks.</li>
              <li><strong>Verify Scope Against Official GTU Syllabus:</strong> Use our integrated syllabus viewer to confirm module boundary limits.</li>
            </ul>

            <h4 className="text-base font-bold text-navy-900 dark:text-white mt-6">3. Academic Quality Assurance</h4>
            <p>
              Every document hosted on ShikshaSahayak undergoes strict moderation to ensure technical accuracy and academic alignment. For questions or corrections, contact our editorial team at <a href="mailto:team@shikshasahayak.org" className="text-brand-orange underline font-semibold">team@shikshasahayak.org</a>.
            </p>
          </div>
        </SeoContentBlock>
      </div>
    </div>
  );
};

export default AcademicStudyMaterialView;
