import { createStore } from 'vuex'
import axios from 'axios'

export default createStore({
  state: {
    user: null,
    token: null,
    projects: [],
    currentProject: null,
    states: [],
    transitions: [],
    loading: false,
    error: null
  },
  
  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user,
    allProjects: state => state.projects,
    currentProject: state => state.currentProject,
    projectStates: state => state.states,
    projectTransitions: state => state.transitions
  },
  
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    
    SET_ERROR(state, error) {
      state.error = error
    },
    
    SET_AUTH(state, { token, user }) {
      state.token = token
      state.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },
    
    CLEAR_AUTH(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
    },
    
    SET_PROJECTS(state, projects) {
      state.projects = projects
    },
    
    ADD_PROJECT(state, project) {
      state.projects.unshift(project)
    },
    
    UPDATE_PROJECT(state, updatedProject) {
      const index = state.projects.findIndex(p => p.id === updatedProject.id)
      if (index !== -1) {
        state.projects.splice(index, 1, updatedProject)
      }
      if (state.currentProject && state.currentProject.id === updatedProject.id) {
        state.currentProject = updatedProject
      }
    },
    
    SET_CURRENT_PROJECT(state, project) {
      state.currentProject = project
    },
    
    SET_STATES(state, states) {
      state.states = states
    },
    
    ADD_STATE(state, state_item) {
      state.states.push(state_item)
    },
    
    UPDATE_STATE(state, updatedState) {
      const index = state.states.findIndex(s => s.id === updatedState.id)
      if (index !== -1) {
        state.states.splice(index, 1, updatedState)
      }
    },
    
    REMOVE_STATE(state, stateId) {
      state.states = state.states.filter(s => s.id !== stateId)
    },
    
    SET_TRANSITIONS(state, transitions) {
      state.transitions = transitions
    },
    
    ADD_TRANSITION(state, transition) {
      state.transitions.push(transition)
    },
    
    REMOVE_TRANSITION(state, transitionId) {
      state.transitions = state.transitions.filter(t => t.id !== transitionId)
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        commit('SET_LOADING', true)
        const response = await axios.post('/auth/login', credentials, { withCredentials: true })
        commit('SET_AUTH', response.data)
        commit('SET_ERROR', null)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.error || 'Login failed')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async register({ commit }, userData) {
      try {
        commit('SET_LOADING', true)
        const response = await axios.post('/auth/register', userData)
        commit('SET_AUTH', response.data)
        commit('SET_ERROR', null)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.error || 'Registration failed')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    logout({ commit }) {
      commit('CLEAR_AUTH')
    },
    
    async fetchProjects({ commit }) {
      try {
        commit('SET_LOADING', true)
        const response = await axios.get('/projects')
        commit('SET_PROJECTS', response.data)
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.error || 'Failed to fetch projects')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async createProject({ commit }, projectData) {
      try {
        const response = await axios.post('/projects', projectData)
        commit('ADD_PROJECT', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.error || 'Failed to create project')
        throw error
      }
    },
    
    async fetchProject({ commit }, projectId) {
      try {
        commit('SET_LOADING', true)
        const response = await axios.get(`/projects/${projectId}`)
        commit('SET_CURRENT_PROJECT', response.data)
        commit('SET_STATES', response.data.states || [])
        commit('SET_TRANSITIONS', response.data.transitions || [])
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.error || 'Failed to fetch project')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async createState({ commit }, stateData) {
      try {
        const response = await axios.post('/states', stateData)
        commit('ADD_STATE', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.error || 'Failed to create state')
        throw error
      }
    },
    
    async updateState({ commit }, { id, data }) {
      try {
        const response = await axios.put(`/states/${id}`, data)
        commit('UPDATE_STATE', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.error || 'Failed to update state')
        throw error
      }
    },

    async searchIOTerms(_, { query, limit = 20 }) {
      const response = await axios.get('/io-terms', {
        params: {
          search: query,
          limit
        }
      })
      return response.data
    },

    async createIOTerm({ commit }, payload) {
      try {
        const response = await axios.post('/io-terms', payload)
        commit('SET_ERROR', null)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.error || 'Failed to create IO term')
        throw error
      }
    },

    async updateIOTerm({ commit }, { id, data }) {
      try {
        const response = await axios.put(`/io-terms/${id}`, data)
        commit('SET_ERROR', null)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.error || 'Failed to update IO term')
        throw error
      }
    }
  }
})