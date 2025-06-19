import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Project: a
    .model({
      name: a.string().required(),
      description: a.string(),
      color: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Agregar la relación inversa
      tasks: a.hasMany('Task', 'projectId'),
    })
    .authorization((allow) => [allow.owner()]),

  Task: a
    .model({
      title: a.string().required(),
      description: a.string(),
      status: a.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
      priority: a.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
      dueDate: a.datetime(),
      projectId: a.id(),
      project: a.belongsTo('Project', 'projectId'),
      assignedTo: a.string(),
      tags: a.string().array(),
      estimatedHours: a.float(),
      actualHours: a.float(),
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
  },
});
