import { Project, ProjectType } from '@/lib/types/project';
import { TaskPriority } from '@/lib/types/task';

interface ProjectCardProps {
  project: Project;
  tasks: Array<{ priority: TaskPriority }>;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProjectCard({ project, tasks, onEdit, onDelete }: ProjectCardProps) {
  const priorityCounts = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<TaskPriority, number>);

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <h3 className="text-lg font-semibold">{project.name}</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{project.type === ProjectType.MAIN ? 'Proyecto Principal' : 'Subproyecto'}</span>
          <span>{project.status}</span>
        </div>
      </div>

      {project.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {project.description}
        </p>
      )}

      {Object.entries(priorityCounts).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(priorityCounts).map(([priority]) => (
            <span
              key={priority}
              className={
                'text-xs px-2 py-1 rounded-md border ' +
                (priority === 'LOW' ? 'bg-green-50 text-green-700 border-green-200' :
                  priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-red-50 text-red-700 border-red-200')
              }
            >
              {priority}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span>Última actualización: {new Date(project.updatedAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-blue-500 hover:text-blue-600"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-600"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
