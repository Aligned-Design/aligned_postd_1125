import { useWorkspace } from "@/contexts/WorkspaceContext";

interface WorkspacePageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
}

export function WorkspacePageHeader({
  title,
  description,
  icon,
  action,
}: WorkspacePageHeaderProps) {
  const { currentWorkspace } = useWorkspace();

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-white/60">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            {icon && <span className="text-3xl">{icon}</span>}
            <div>
              <h1 className="text-3xl font-black text-slate-900">{title}</h1>
              <p className="text-xs text-slate-600 font-medium mt-1">
                {currentWorkspace.logo} {currentWorkspace.name}
              </p>
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
        {description && <p className="text-sm text-slate-600 mt-2">{description}</p>}
      </div>
    </div>
  );
}
