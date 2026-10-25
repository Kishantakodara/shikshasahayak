import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Users,
  FileText,
  BookOpen,
  MoreVertical,
  Settings,
  Trash2,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { Class } from '../../types/teacher';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface ClassCardProps {
  classData: Class;
  onEdit?: (classData: Class) => void;
  onDelete?: (classData: Class) => void;
  onCopyJoinCode?: (joinCode: string) => void;
  onRegenerateCode?: (classData: Class) => void;
}

/**
 * ClassCard Component
 * 
 * Displays a single class with stats and quick actions
 */
export const ClassCard: React.FC<ClassCardProps> = ({
  classData,
  onEdit,
  onDelete,
  onCopyJoinCode,
  onRegenerateCode,
}) => {
  const [showActions, setShowActions] = React.useState(false);

  const handleCopyJoinCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCopyJoinCode) {
      onCopyJoinCode(classData.join_code);
    }
  };

  return (
    <Link to={`/teacher/classes/${classData.id}`} className="block group">
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
        {/* Rich Cover Header with Multi-Tone Gradient & Geometric Mesh */}
        <div
          className={cn(
            'h-36 relative p-4 flex flex-col justify-between overflow-hidden transition-all duration-300',
            classData.cover_image
              ? ''
              : 'bg-gradient-to-br from-navy-950 via-brand-orange/90 to-amber-500'
          )}
          style={
            classData.cover_image
              ? { backgroundImage: `url(${classData.cover_image})`, backgroundSize: 'cover' }
              : undefined
          }
        >
          {/* Subtle Geometric Mesh Pattern Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:14px_14px] opacity-15 pointer-events-none" />

          {/* Large Initial Watermark */}
          <div className="absolute -right-4 -bottom-6 text-7xl font-black text-white/10 font-display select-none pointer-events-none tracking-tighter uppercase">
            {classData.name.split(' ').map(w => w[0]).join('').slice(0, 3)}
          </div>

          {/* Top Row: Academic Semester Badge & Status Indicator */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-white border border-white/10">
              <BookOpen className="w-3.5 h-3.5 text-brand-orange" />
              <span>Sem {classData.semester || '1'}</span>
              {classData.section && <span className="text-white/60">• Sec {classData.section}</span>}
            </div>

            <Badge
              variant={classData.is_active ? 'default' : 'secondary'}
              className={cn(
                'text-[10px] font-bold px-2.5 py-0.5 shadow-md flex items-center gap-1 border border-white/20',
                classData.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {classData.is_active ? 'Active Class' : 'Archived'}
            </Badge>
          </div>

          {/* Bottom Row: Join Code Pill & Enrolled Students Indicator */}
          <div className="flex items-center justify-between relative z-10 mt-auto">
            {/* Join Code Copy Pill */}
            <div
              className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 cursor-pointer transition-all active:scale-95 group/code"
              onClick={handleCopyJoinCode}
              title="Click to copy student join code"
            >
              <span className="text-xs font-mono text-white font-extrabold tracking-wider">
                {classData.join_code}
              </span>
              <Copy className="h-3 w-3 text-brand-orange group-hover/code:scale-110 transition-transform" />
            </div>

            {/* Enrolled Students Badge */}
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-bold text-white border border-white/20">
              <Users className="w-3.5 h-3.5 text-white" />
              <span>{classData.max_students || 35} Students</span>
            </div>
          </div>
        </div>

        <CardContent className="p-5 space-y-3">
          {/* Class Name and Description */}
          <div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {classData.name}
            </h3>
            {classData.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {classData.description}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 text-xs">
            {classData.section && (
              <Badge variant="outline" className="font-medium">
                Section {classData.section}
              </Badge>
            )}
            {classData.semester && (
              <Badge variant="outline" className="font-medium">
                Sem {classData.semester}
              </Badge>
            )}
            {classData.academic_year && (
              <Badge variant="outline" className="font-medium">
                {classData.academic_year}
              </Badge>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Students</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {classData.student_count || 0}
              </p>
            </div>

            <div className="text-center border-l border-r dark:border-gray-700">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Tasks</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {classData.assignment_count || 0}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Files</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {classData.material_count || 0}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onEdit) onEdit(classData);
            }}
          >
            <Settings className="h-3.5 w-3.5 mr-1" />
            Settings
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowActions(!showActions);
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showActions && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowActions(false);
                  }}
                />

                {/* Actions Menu */}
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-navy-900 border dark:border-navy-800 rounded-lg shadow-lg z-50 py-1">
                  <button
                    className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-navy-800 flex items-center gap-2 text-brand-orange font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowActions(false);
                      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://beta.shikshasahayak.org';
                      const inviteLink = `${baseUrl}/login?joinCode=${encodeURIComponent(classData.join_code)}`;
                      navigator.clipboard.writeText(inviteLink);
                      toast.success('Student Invite Link copied to clipboard!');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Invite Link
                  </button>

                  <button
                    className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-navy-800 flex items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowActions(false);
                      if (onRegenerateCode) onRegenerateCode(classData);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate Join Code
                  </button>

                  <button
                    className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-navy-800 flex items-center gap-2 text-red-600 dark:text-red-400"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowActions(false);
                      if (onDelete) onDelete(classData);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Class
                  </button>
                </div>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
