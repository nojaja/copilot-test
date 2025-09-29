require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Project, State, Transition, Comment } = require('../models');

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('Synchronizing models...');
    await sequelize.sync({ force: process.env.NODE_ENV === 'development' });
    console.log('✅ Database models synchronized');


    // Create sample data for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating sample data...');

      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 12);
      const sampleUser = await User.create({
        name: 'Demo User',
        email: 'demo@example.com',
        password: hashedPassword, // password123
        department: 'Demo Department',
        role: 'admin'
      });

      const sampleProject = await Project.create({
        name: 'Sample Process Flow',
        description: 'A demonstration project showing the process flow management capabilities',
        createdBy: sampleUser.id
      });

      const state1 = await State.create({
        name: 'Initial State',
        description: 'The starting point of our process',
        projectId: sampleProject.id,
        ownerId: sampleUser.id,
        department: 'Demo Department',
        inputConditions: 'System startup, user authentication completed',
        outputResults: 'User session established, welcome dashboard displayed'
      });

      const state2 = await State.create({
        name: 'Processing State',
        description: 'Main processing activities',
        projectId: sampleProject.id,
        ownerId: sampleUser.id,
        department: 'Demo Department',
        inputConditions: 'Valid user input received, system resources available',
        outputResults: 'Process completed, results generated'
      });

      await Transition.create({
        fromStateId: state1.id,
        toStateId: state2.id,
        eventName: 'Start Processing',
        eventDescription: 'User initiates the main process',
        projectId: sampleProject.id,
        createdBy: sampleUser.id
      });

      console.log('✅ Sample data created');
      console.log(`Demo login: demo@example.com / password123`);

      // ここから登録データの確認
      console.log('--- 登録データ確認 ---');
      const users = await User.findAll();
      const projects = await Project.findAll();
      const states = await State.findAll();
      const transitions = await Transition.findAll();
      // コメントはサンプル作成していないので省略

      console.log('【User】', users.map(u => u.toJSON()));
      console.log('【Project】', projects.map(p => p.toJSON()));
      console.log('【State】', states.map(s => s.toJSON()));
      console.log('【Transition】', transitions.map(t => t.toJSON()));
      console.log('--- 登録データ確認ここまで ---');
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;