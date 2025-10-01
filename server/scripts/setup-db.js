require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Project, State, Transition, Comment, StateIOTerm } = require('../models');
const { syncStateTerms, recalculateStateAggregations } = require('../services/stateIoService');

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

      const ensureTerm = async (label, description = '') => {
        const [term] = await StateIOTerm.findOrCreate({
          where: { label },
          defaults: {
            description,
            createdBy: sampleUser.id,
            updatedBy: sampleUser.id
          }
        });
        return term;
      };

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
        inputConditions: '',
        outputResults: ''
      });

      const state2 = await State.create({
        name: 'Processing State',
        description: 'Main processing activities',
        projectId: sampleProject.id,
        ownerId: sampleUser.id,
        department: 'Demo Department',
        inputConditions: '',
        outputResults: ''
      });

      const systemStartup = await ensureTerm('System startup completed');
      const userAuthenticated = await ensureTerm('User authenticated');
      const sessionEstablished = await ensureTerm('User session established');
      const processingResources = await ensureTerm('Processing resources available');
      const processingCompleted = await ensureTerm('Processing completed');
      const resultsGenerated = await ensureTerm('Results generated');

      await syncStateTerms(state1, {
        inputTermIds: [systemStartup.id, userAuthenticated.id],
        outputTermIds: [sessionEstablished.id, processingResources.id]
      });

      await syncStateTerms(state2, {
        inputTermIds: [sessionEstablished.id, processingResources.id],
        outputTermIds: [processingCompleted.id, resultsGenerated.id]
      });

      await recalculateStateAggregations([state1.id, state2.id]);

      await Transition.create({
        fromStateId: state1.id,
        toStateId: state2.id,
        eventName: 'Start Processing',
        eventDescription: 'User initiates the main process',
        projectId: sampleProject.id,
        createdBy: sampleUser.id
      });

      // --- Request-to-Answer型プロセス サンプルデータ投入（BPMN準拠） --- 
      const rtaProject = await Project.create({
        name: 'Request-to-Answer サンプル',
        description: '問い合わせ受付から回答までのEnd to End業務フロー例（BPMN準拠）',
        createdBy: sampleUser.id
      });

      // 状態定義（BPMN図に忠実に6状態）
      const rtaStates = await Promise.all([
        State.create({
          name: 'Requested',
          description: 'ユーザーが問い合わせフォームからリクエストを送信した直後の状態。',
          projectId: rtaProject.id,
          ownerId: sampleUser.id,
          department: 'カスタマーサポート',
          inputConditions: '',
          outputResults: '',
          diagramMeta: JSON.stringify({ x: 100, y: 200, color: '#2196f3', label: 'Requested', type: 'start' })
        }),
        State.create({
          name: 'UnderReview',
          description: '受付担当者またはオペレーターがリクエスト内容を確認している状態。',
          projectId: rtaProject.id,
          ownerId: sampleUser.id,
          department: 'カスタマーサポート',
          inputConditions: '',
          outputResults: '',
          diagramMeta: JSON.stringify({ x: 300, y: 200, color: '#4caf50', label: 'UnderReview', type: 'process' })
        }),
        State.create({
          name: 'InfoRequested',
          description: 'オペレーターがユーザーに追加情報を依頼し、ユーザーからの返信待ちの状態。',
          projectId: rtaProject.id,
          ownerId: sampleUser.id,
          department: 'カスタマーサポート',
          inputConditions: '',
          outputResults: '',
          diagramMeta: JSON.stringify({ x: 500, y: 100, color: '#ff9800', label: 'InfoRequested', type: 'decision' })
        }),
        State.create({
          name: 'InfoProvided',
          description: 'ユーザーが追加情報を提供し、オペレーターが再度内容確認できる状態。',
          projectId: rtaProject.id,
          ownerId: sampleUser.id,
          department: 'カスタマーサポート',
          inputConditions: '',
          outputResults: '',
          diagramMeta: JSON.stringify({ x: 700, y: 100, color: '#ffeb3b', label: 'InfoProvided', type: 'input' })
        }),
        State.create({
          name: 'Answered',
          description: 'オペレーターが回答を作成し、ユーザーへ回答通知を送信した状態。',
          projectId: rtaProject.id,
          ownerId: sampleUser.id,
          department: 'カスタマーサポート',
          inputConditions: '',
          outputResults: '',
          diagramMeta: JSON.stringify({ x: 500, y: 300, color: '#9c27b0', label: 'Answered', type: 'output' })
        }),
        State.create({
          name: 'Closed',
          description: 'ユーザーが回答内容を確認し、プロセスが完了した状態。',
          projectId: rtaProject.id,
          ownerId: sampleUser.id,
          department: 'カスタマーサポート',
          inputConditions: '',
          outputResults: '',
          diagramMeta: JSON.stringify({ x: 700, y: 300, color: '#607d8b', label: 'Closed', type: 'end' })
        })
      ]);

      // 状態ID取得
      const [requested, underReview, infoRequested, infoProvided, answered, closed] = rtaStates;

      const requestSubmitted = await ensureTerm('Request submitted');
      const requestLogged = await ensureTerm('Request logged in system');
      const reviewCompleted = await ensureTerm('Content review completed');
      const additionalInfoNeeded = await ensureTerm('Additional information required');
      const additionalInfoRequested = await ensureTerm('Additional information requested from customer');
      const additionalInfoProvided = await ensureTerm('Additional information provided by customer');
      const answerPrepared = await ensureTerm('Answer prepared');
      const answerSent = await ensureTerm('Answer sent to customer');
      const processArchived = await ensureTerm('Process archived');

      await syncStateTerms(requested, {
        inputTermIds: [requestSubmitted.id],
        outputTermIds: [requestLogged.id]
      });

      await syncStateTerms(underReview, {
        inputTermIds: [requestLogged.id],
        outputTermIds: [answerPrepared.id, additionalInfoNeeded.id]
      });

      await syncStateTerms(infoRequested, {
        inputTermIds: [additionalInfoNeeded.id],
        outputTermIds: [additionalInfoRequested.id]
      });

      await syncStateTerms(infoProvided, {
        inputTermIds: [additionalInfoRequested.id],
        outputTermIds: [additionalInfoProvided.id]
      });

      await syncStateTerms(answered, {
        inputTermIds: [additionalInfoProvided.id, answerPrepared.id],
        outputTermIds: [answerSent.id]
      });

      await syncStateTerms(closed, {
        inputTermIds: [answerSent.id],
        outputTermIds: [processArchived.id]
      });

      await recalculateStateAggregations(rtaStates.map(state => state.id));

      // 遷移定義（BPMN図に忠実な分岐・ループ含む）
      await Promise.all([
        Transition.create({
          fromStateId: requested.id,
          toStateId: underReview.id,
          eventName: 'Accept Request',
          eventDescription: '受付担当がリクエストを受理',
          projectId: rtaProject.id,
          createdBy: sampleUser.id,
          diagramMeta: JSON.stringify({ label: '受付', color: '#2196f3', type: 'edge' })
        }),
        Transition.create({
          fromStateId: underReview.id,
          toStateId: infoRequested.id,
          eventName: 'Request More Info',
          eventDescription: '追加情報が必要',
          projectId: rtaProject.id,
          createdBy: sampleUser.id,
          diagramMeta: JSON.stringify({ label: '追加情報依頼', color: '#ff9800', type: 'edge' })
        }),
        Transition.create({
          fromStateId: infoRequested.id,
          toStateId: infoProvided.id,
          eventName: 'Provide Info',
          eventDescription: 'ユーザーが追加情報を提供',
          projectId: rtaProject.id,
          createdBy: sampleUser.id,
          diagramMeta: JSON.stringify({ label: '追加情報提供', color: '#ffeb3b', type: 'edge' })
        }),
        Transition.create({
          fromStateId: infoProvided.id,
          toStateId: underReview.id,
          eventName: 'Resume Review',
          eventDescription: '追加情報をもとに再確認',
          projectId: rtaProject.id,
          createdBy: sampleUser.id,
          diagramMeta: JSON.stringify({ label: '再確認', color: '#4caf50', type: 'edge' })
        }),
        Transition.create({
          fromStateId: underReview.id,
          toStateId: answered.id,
          eventName: 'Create Answer',
          eventDescription: '回答作成完了',
          projectId: rtaProject.id,
          createdBy: sampleUser.id,
          diagramMeta: JSON.stringify({ label: '回答作成', color: '#9c27b0', type: 'edge' })
        }),
        Transition.create({
          fromStateId: answered.id,
          toStateId: closed.id,
          eventName: 'Confirm Answer',
          eventDescription: 'ユーザーが回答を確認し完了',
          projectId: rtaProject.id,
          createdBy: sampleUser.id,
          diagramMeta: JSON.stringify({ label: '完了', color: '#607d8b', type: 'edge' })
        })
      ]);
      console.log('✅ Request-to-Answer型プロセス サンプルデータ投入完了（BPMN準拠）');

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