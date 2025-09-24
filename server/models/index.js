const User = require('./User');
const Project = require('./Project');
const State = require('./State');
const Transition = require('./Transition');
const Comment = require('./Comment');

// User associations
User.hasMany(Project, { foreignKey: 'createdBy', as: 'createdProjects' });
User.hasMany(State, { foreignKey: 'ownerId', as: 'ownedStates' });
User.hasMany(State, { foreignKey: 'lastModifiedBy', as: 'modifiedStates' });
User.hasMany(Transition, { foreignKey: 'createdBy', as: 'createdTransitions' });
User.hasMany(Comment, { foreignKey: 'authorId', as: 'authoredComments' });
User.hasMany(Comment, { foreignKey: 'resolvedBy', as: 'resolvedComments' });

// Project associations
Project.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Project.hasMany(State, { foreignKey: 'projectId', as: 'states' });
Project.hasMany(Transition, { foreignKey: 'projectId', as: 'transitions' });
Project.hasMany(Comment, { foreignKey: 'projectId', as: 'comments' });

// State associations
State.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
State.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
State.belongsTo(User, { foreignKey: 'lastModifiedBy', as: 'lastModifier' });
State.hasMany(Transition, { foreignKey: 'fromStateId', as: 'outgoingTransitions' });
State.hasMany(Transition, { foreignKey: 'toStateId', as: 'incomingTransitions' });
State.hasMany(Comment, { 
  foreignKey: 'targetId', 
  as: 'comments',
  scope: { targetType: 'state' }
});

// Transition associations
Transition.belongsTo(State, { foreignKey: 'fromStateId', as: 'fromState' });
Transition.belongsTo(State, { foreignKey: 'toStateId', as: 'toState' });
Transition.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Transition.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Transition.hasMany(Comment, { 
  foreignKey: 'targetId', 
  as: 'comments',
  scope: { targetType: 'transition' }
});

// Comment associations
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Comment.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolver' });
Comment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Comment.belongsTo(Comment, { foreignKey: 'parentCommentId', as: 'parentComment' });
Comment.hasMany(Comment, { foreignKey: 'parentCommentId', as: 'replies' });

module.exports = {
  User,
  Project,
  State,
  Transition,
  Comment
};