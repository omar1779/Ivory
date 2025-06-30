import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Note: a
    .model({
      title: a.string().required(),
      content: a.string().required(),
      tags: a.string().array(),
      folder: a.string(),
      isPinned: a.boolean().default(false),
      isArchived: a.boolean().default(false),
      owner: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime()
    })
    .authorization((allow) => [allow.owner()]),

  Project: a
    .model({
      name: a.string().required(),
      description: a.string(),
      color: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      status: a.enum(['ACTIVE', 'ARCHIVED']),
      parentProjectId: a.string(),
      // Relación con subproyectos
      subProjects: a.hasMany('Project', 'parentProjectId'),
      // Relación con la tarea padre
      parentProject: a.belongsTo('Project', 'parentProjectId'),
      // Relación con tareas
      tasks: a.hasMany('Task', 'projectId'),
      // Relación con recordatorios
      reminders: a.hasMany('Reminder', 'projectId'),
    })
    .authorization((allow) => [allow.owner()]),

  Task: a
    .model({
      title: a.string().required(),
      description: a.string(),
      status: a.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
      priority: a.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
      dueDate: a.datetime(),
      projectId: a.string(),
      project: a.belongsTo('Project', 'projectId'),
      assignedTo: a.string(),
      tags: a.string().array(),
      estimatedHours: a.float(),
      actualHours: a.float(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relación con recordatorios
      reminders: a.hasMany('Reminder', 'taskId'),
    })
    .authorization((allow) => [allow.owner()]),

  Reminder: a
    .model({
      taskId: a.string(),
      projectId: a.string(),
      task: a.belongsTo('Task', 'taskId'),
      project: a.belongsTo('Project', 'projectId'),
      date: a.datetime().required(),
      type: a.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ONE_TIME']),
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
