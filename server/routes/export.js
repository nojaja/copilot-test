const express = require('express');
const { State, Transition, User, Project } = require('../models');

const router = express.Router();

// Export project as Markdown
router.get('/markdown/:projectId', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId, {
      include: [
        {
          model: State,
          as: 'states',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['name', 'department']
            }
          ]
        },
        {
          model: Transition,
          as: 'transitions',
          include: [
            {
              model: State,
              as: 'fromState',
              attributes: ['name']
            },
            {
              model: State,
              as: 'toState',
              attributes: ['name']
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let markdown = `# ${project.name}\n\n`;
    if (project.description) {
      markdown += `${project.description}\n\n`;
    }

    markdown += `## States\n\n`;
    project.states.forEach(state => {
      markdown += `### ${state.name}\n`;
      if (state.description) {
        markdown += `${state.description}\n\n`;
      }
      markdown += `- **Owner**: ${state.owner.name} (${state.owner.department})\n`;
      if (state.inputConditions) {
        markdown += `- **Input Conditions**: ${state.inputConditions}\n`;
      }
      if (state.outputResults) {
        markdown += `- **Output Results**: ${state.outputResults}\n`;
      }
      markdown += `\n`;
    });

    markdown += `## Transitions\n\n`;
    markdown += `| From State | Event | To State | Conditions |\n`;
    markdown += `|-----------|-------|----------|------------|\n`;
    project.transitions.forEach(transition => {
      markdown += `| ${transition.fromState.name} | ${transition.eventName} | ${transition.toState.name} | ${transition.conditions || ''} |\n`;
    });

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Error exporting markdown:', error);
    res.status(500).json({ error: 'Failed to export markdown' });
  }
});

// Export project as CSV
router.get('/csv/:projectId', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId, {
      include: [
        {
          model: State,
          as: 'states',
          include: [
            {
              model: User,
              as: 'owner'
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let csv = 'State Name,Description,Owner,Department,Input Conditions,Output Results,Status\n';
    project.states.forEach(state => {
      const row = [
        `"${state.name}"`,
        `"${state.description || ''}"`,
        `"${state.owner.name}"`,
        `"${state.department || ''}"`,
        `"${state.inputConditions || ''}"`,
        `"${state.outputResults || ''}"`,
        `"${state.status}"`
      ].join(',');
      csv += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

module.exports = router;