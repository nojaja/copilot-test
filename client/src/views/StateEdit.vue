<template>
  <div class="state-edit">
    <div class="container mt-4">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-edit me-2"></i>
                {{ isNew ? 'Create New State' : 'Edit State' }}
              </h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="saveState">
                <div class="mb-3">
                  <label for="name" class="form-label">State Name *</label>
                  <input
                    type="text"
                    class="form-control"
                    id="name"
                    v-model="form.name"
                    required
                  >
                </div>

                <div class="mb-3">
                  <label for="description" class="form-label">Description</label>
                  <textarea
                    class="form-control"
                    id="description"
                    rows="3"
                    v-model="form.description"
                  ></textarea>
                </div>

                <div class="mb-3">
                  <label for="department" class="form-label">Department</label>
                  <input
                    type="text"
                    class="form-control"
                    id="department"
                    v-model="form.department"
                  >
                </div>

                <div class="mb-3">
                  <label for="inputConditions" class="form-label">Input Conditions (IN)</label>
                  <textarea
                    class="form-control"
                    id="inputConditions"
                    rows="4"
                    v-model="form.inputConditions"
                    placeholder="Describe the conditions and prerequisites needed to enter this state..."
                  ></textarea>
                </div>

                <div class="mb-3">
                  <label for="outputResults" class="form-label">Output Results (OUT)</label>
                  <textarea
                    class="form-control"
                    id="outputResults"
                    rows="4"
                    v-model="form.outputResults"
                    placeholder="Describe the outputs and results produced in this state..."
                  ></textarea>
                </div>

                <div class="d-flex justify-content-between">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    @click="$router.back()"
                  >
                    Cancel
                  </button>
                  <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save me-2"></i>
                    {{ isNew ? 'Create State' : 'Update State' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'StateEdit',
  data() {
    return {
      form: {
        name: '',
        description: '',
        department: '',
        inputConditions: '',
        outputResults: ''
      }
    }
  },
  computed: {
    isNew() {
      return this.$route.params.id === 'new' || !this.$route.params.id
    }
  },
  methods: {
    ...mapActions(['createState', 'updateState']),
    async saveState() {
      try {
        const projectId = this.$route.params.projectId
        
        if (this.isNew) {
          await this.createState({
            ...this.form,
            projectId
          })
        } else {
          await this.updateState({
            id: this.$route.params.id,
            data: this.form
          })
        }
        
        this.$router.push(`/project/${projectId}`)
      } catch (error) {
        // Error handled by store
      }
    }
  }
}
</script>

<style scoped>
.state-edit {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 2rem;
}

.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>