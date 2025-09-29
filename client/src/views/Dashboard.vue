<template>
  <div class="dashboard">
    <div class="container-fluid mt-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h1 class="h3 mb-1">Dashboard</h1>
              <p class="text-muted mb-0">Manage your process flow projects</p>
            </div>
            <button class="btn btn-primary" @click="showCreateModal = true">
              <i class="fas fa-plus me-2"></i>
              New Project
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h4 class="mb-1">{{ projects.length }}</h4>
                  <p class="mb-0">Total Projects</p>
                </div>
                <i class="fas fa-project-diagram fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h4 class="mb-1">{{ activeProjects }}</h4>
                  <p class="mb-0">Active Projects</p>
                </div>
                <i class="fas fa-check-circle fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h4 class="mb-1">{{ averageCompletion }}%</h4>
                  <p class="mb-0">Avg Completion</p>
                </div>
                <i class="fas fa-chart-line fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h4 class="mb-1">{{ totalStates }}</h4>
                  <p class="mb-0">Total States</p>
                </div>
                <i class="fas fa-sitemap fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects List -->
      <div class="row">
        <div class="col">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-list me-2"></i>
                Projects
              </h5>
            </div>
            <div class="card-body p-0">
              <div v-if="loading" class="text-center p-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              <div v-else-if="projects.length === 0" class="text-center p-4 text-muted">
                <i class="fas fa-folder-open fa-3x mb-3"></i>
                <p>No projects found. Create your first project to get started!</p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Project Name</th>
                      <th>Creator</th>
                      <th>States</th>
                      <th>Completion</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="project in projects" :key="project.id">
                      <td>
                        <div>
                          <strong>{{ project.name }}</strong>
                          <br>
                          <small class="text-muted">{{ project.description || 'No description' }}</small>
                        </div>
                      </td>
                      <td>{{ project.creator?.name }}</td>
                      <td>
                        <span class="badge bg-secondary">
                          {{ project.statistics?.totalStates || 0 }}
                        </span>
                      </td>
                      <td>
                        <div class="progress" style="height: 20px;">
                          <div
                            class="progress-bar"
                            :class="getProgressBarClass(project.statistics?.completionRate)"
                            :style="{ width: (project.statistics?.completionRate || 0) + '%' }"
                          >
                            {{ project.statistics?.completionRate || 0 }}%
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge" :class="getStatusClass(project.status)">
                          {{ project.status }}
                        </span>
                      </td>
                      <td>{{ formatDate(project.updatedAt) }}</td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <router-link
                            :to="`/project/${project.id}/states`"
                            class="btn btn-outline-primary btn-sm"
                          >
                            <i class="fas fa-eye"></i>
                          </router-link>
                          <router-link
                            :to="`/project/${project.id}/matrix`"
                            class="btn btn-outline-info btn-sm"
                          >
                            <i class="fas fa-table"></i>
                          </router-link>
                          <router-link
                            :to="`/project/${project.id}/diagram`"
                            class="btn btn-outline-success btn-sm"
                          >
                            <i class="fas fa-project-diagram"></i>
                          </router-link>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <div
      class="modal fade"
      :class="{ show: showCreateModal }"
      :style="{ display: showCreateModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Project</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <form @submit.prevent="createProject">
            <div class="modal-body">
              <div class="mb-3">
                <label for="projectName" class="form-label">Project Name *</label>
                <input
                  type="text"
                  class="form-control"
                  id="projectName"
                  v-model="newProject.name"
                  required
                >
              </div>
              <div class="mb-3">
                <label for="projectDescription" class="form-label">Description</label>
                <textarea
                  class="form-control"
                  id="projectDescription"
                  rows="3"
                  v-model="newProject.description"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showCreateModal = false">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!newProject.name">
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div v-if="showCreateModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'Dashboard',
  data() {
    return {
      showCreateModal: false,
      newProject: {
        name: '',
        description: ''
      }
    }
  },
  computed: {
    ...mapState(['loading', 'error']),
    ...mapGetters(['allProjects']),
    projects() {
      return this.allProjects
    },
    activeProjects() {
      return this.projects.filter(p => p.status === 'active').length
    },
    averageCompletion() {
      if (this.projects.length === 0) return 0
      const total = this.projects.reduce((sum, p) => sum + (p.statistics?.completionRate || 0), 0)
      return Math.round(total / this.projects.length)
    },
    totalStates() {
      return this.projects.reduce((sum, p) => sum + (p.statistics?.totalStates || 0), 0)
    }
  },
  async created() {
    await this.fetchProjects()
  },
  methods: {
    ...mapActions(['fetchProjects', 'createProject']),
    async createProject() {
      try {
        await this.$store.dispatch('createProject', this.newProject)
        this.showCreateModal = false
        this.newProject = { name: '', description: '' }
      } catch (error) {
        // Error handled by store
      }
    },
    getProgressBarClass(completion) {
      if (completion >= 80) return 'bg-success'
      if (completion >= 50) return 'bg-warning'
      return 'bg-danger'
    },
    getStatusClass(status) {
      switch (status) {
        case 'active': return 'bg-success'
        case 'completed': return 'bg-primary'
        case 'archived': return 'bg-secondary'
        default: return 'bg-secondary'
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.dashboard {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 2rem;
}

.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.progress {
  border-radius: 10px;
}

.btn-group .btn {
  border-radius: 4px;
  margin-right: 2px;
}

.modal.show {
  background-color: rgba(0,0,0,0.5);
}

.opacity-75 {
  opacity: 0.75;
}
</style>