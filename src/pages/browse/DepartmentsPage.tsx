import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import FolderCard from '../../components/browse/FolderCard';
import { apiClient } from '../../api/client';
import { Branch } from '../../types';
import { isMaterialType, MATERIAL_TYPES } from '../../content/browse';
import { browsePaths } from '../../utils/browsePaths';

const DepartmentsPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validType = isMaterialType(type);
  const config = validType ? MATERIAL_TYPES[type] : null;

  useEffect(() => {
    if (!validType) return;
    apiClient
      .getBranches()
      .then(setBranches)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [validType]);

  if (!validType || !config) {
    return <Navigate to="/resources" replace />;
  }

  return (
    <BrowseShell
      crumbs={[
        { label: config.folderLabel }
      ]}
      eyebrow={config.folderLabel}
      title="Departments"
      description="Select your engineering branch to see semesters and subjects available for this material type."
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 text-brand-orange animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center py-12">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((branch) => (
            <FolderCard
              key={branch.id}
              to={browsePaths.branch(type, branch.slug)}
              title={branch.name}
              description={branch.short_name ? `${branch.short_name} · ${branch.program_name || 'Engineering'}` : undefined}
              meta="Department"
            />
          ))}
        </div>
      )}
    </BrowseShell>
  );
};

export default DepartmentsPage;
