<template>
  <div class="process-matrix">
    <div class="container-fluid mt-4">
      <div class="row mb-4">
        <div class="col">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h1 class="h3 mb-1">Process Matrix</h1>
              <p class="text-muted mb-0">State transitions and IN/OUT overview</p>
            </div>
            <div class="d-flex flex-column align-items-end">
              <StateHeaderButtons :projectId="$route.params.id" />
              <div class="btn-group mt-2">
                <button class="btn btn-outline-success">
                  <i class="fas fa-download me-1"></i>
                  Export CSV
                </button>
                <button class="btn btn-outline-primary">
                  <i class="fas fa-file-export me-1"></i>
                  Export Markdown
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col">
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead class="table-dark">
                    <tr>
                      <th>State</th>
                      <th>Owner</th>
                      <th>Input Conditions (IN)</th>
                      <th>Output Results (OUT)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="state in projectStates" :key="state.id">
                      <td>
                        <strong>{{ state.name }}</strong>
                        <br>
                        <small class="text-muted">{{ state.description || 'No description' }}</small>
                      </td>
                      <td>
                        {{ state.owner?.name }}
                        <br>
                        <small class="text-muted">{{ state.department }}</small>
                      </td>
                      <td>
                        <div v-if="state.inputConditions" class="text-success">
                          {{ state.inputConditions }}
                        </div>
                        <div v-else class="text-danger">
                          <i class="fas fa-exclamation-triangle me-1"></i>
                          Missing input conditions
                        </div>
                      </td>
                      <td>
                        <div v-if="state.outputResults" class="text-success">
                          {{ state.outputResults }}
                        </div>
                        <div v-else class="text-danger">
                          <i class="fas fa-exclamation-triangle me-1"></i>
                          Missing output results
                        </div>
                      </td>
                      <td>
                        <span class="badge" :class="getStatusClass(state.status)">
                          {{ state.status }}
                        </span>
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
  </div>
</template>

<script>

import { mapGetters, mapActions } from 'vuex'
import StateHeaderButtons from '../components/StateHeaderButtons.vue'

export default {
  name: 'ProcessMatrix',
  components: {
    StateHeaderButtons
  },
  computed: {
    ...mapGetters(['projectStates'])
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId) this.fetchProject(newId)
      }
    }
  },
  mounted() {
    const id = this.$route.params.id
    if (id) this.fetchProject(id)
  },
  methods: {
    ...mapActions(['fetchProject']),
    getStatusClass(status) {
      switch (status) {
        case 'approved': return 'bg-success'
        case 'review': return 'bg-warning'
        case 'draft': return 'bg-secondary'
        default: return 'bg-secondary'
      }
    }
  }
}
</script>

<style scoped>
.process-matrix {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 2rem;
}

.table th {
  border-color: #495057;
}

.table td {
  vertical-align: middle;
}
</style>