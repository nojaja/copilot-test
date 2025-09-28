<template>
  <div class="project-view">
    <div class="container-fluid mt-4">
      <div v-if="loading" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      
      <div v-else-if="currentProject">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h1 class="h3 mb-1">{{ currentProject.name }}</h1>
                <p class="text-muted mb-0">{{ currentProject.description || 'No description' }}</p>
              </div>
              <div class="btn-group">
                <router-link
                  :to="`/project/${currentProject.id}/state/new`"
                  class="btn btn-primary"
                >
                  <i class="fas fa-plus me-1"></i>
                  Add State
                </router-link>
                <router-link
                  :to="`/project/${currentProject.id}/matrix`"
                  class="btn btn-outline-info"
                >
                  <i class="fas fa-table me-1"></i>
                  Matrix View
                </router-link>
                <router-link
                  :to="`/project/${currentProject.id}/diagram`"
                  class="btn btn-outline-success"
                >
                  <i class="fas fa-project-diagram me-1"></i>
                  Diagram
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- States List -->
        <div class="row">
          <div class="col">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-sitemap me-2"></i>
                  States ({{ projectStates.length }})
                </h5>
              </div>
              <div class="card-body p-0">
                <div v-if="projectStates.length === 0" class="text-center p-4 text-muted">
                  <i class="fas fa-plus-circle fa-3x mb-3"></i>
                  <p>No states defined yet. Add the first state to get started!</p>
                  <router-link
                    :to="`/project/${currentProject.id}/state/new`"
                    class="btn btn-primary"
                  >
                    Add First State
                  </router-link>
                </div>
                <div v-else class="row g-3 p-3">
                  <div v-for="state in projectStates" :key="state.id" class="col-md-6 col-lg-4">
                    <div class="card h-100 state-card">
                      <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <h6 class="card-title mb-0">{{ state.name }}</h6>
                          <span class="badge" :class="getStatusClass(state.status)">
                            {{ state.status }}
                          </span>
                        </div>
                        <p class="card-text text-muted small">
                          {{ state.description || 'No description' }}
                        </p>
                        <div class="mb-2">
                          <small class="text-muted">
                            <i class="fas fa-user me-1"></i>
                            {{ state.owner?.name }}
                            <span v-if="state.department">({{ state.department }})</span>
                          </small>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <small class="text-muted">
                              <i class="fas fa-sign-in-alt me-1" :class="{ 'text-danger': !state.inputConditions }"></i>
                              IN: {{ state.inputConditions ? 'Complete' : 'Missing' }}
                            </small>
                            <br>
                            <small class="text-muted">
                              <i class="fas fa-sign-out-alt me-1" :class="{ 'text-danger': !state.outputResults }"></i>
                              OUT: {{ state.outputResults ? 'Complete' : 'Missing' }}
                            </small>
                          </div>
                          <router-link
                            :to="`/project/${currentProject.id}/state/${state.id}`"
                            class="btn btn-sm btn-outline-primary"
                          >
                            <i class="fas fa-edit"></i>
                          </router-link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'ProjectView',
  computed: {
    ...mapState(['loading', 'error']),
    ...mapGetters(['currentProject', 'projectStates'])
  },
  async created() {
    await this.fetchProject(this.$route.params.id)
  },
  methods: {
    ...mapActions(['fetchProject']),
    getStatusClass(status) {
      switch (status) {
        case 'approved': return 'bg-success'
        case 'review': return 'bg-warning'
        case 'draft': return 'bg-secondary'
        case 'archived': return 'bg-dark'
        default: return 'bg-secondary'
      }
    }
  }
}
</script>

<style scoped>
.project-view {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 2rem;
}

.state-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e9ecef;
}

.state-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>