<template>
  <div class="state-diagram">
    <div class="container-fluid mt-4">
      <div class="row mb-4">
        <div class="col">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h1 class="h3 mb-1">State Transition Diagram</h1>
              <p class="text-muted mb-0">Visual representation of process flow</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-outline-secondary">
                <i class="fas fa-expand-arrows-alt me-1"></i>
                Fit to Screen
              </button>
              <button class="btn btn-outline-info">
                <i class="fas fa-download me-1"></i>
                Export Image
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col">
          <div class="card">
            <div class="card-body">
              <div id="diagram-container" class="diagram-container">
                <div class="text-center text-muted py-5">
                  <i class="fas fa-project-diagram fa-3x mb-3"></i>
                  <p>Diagram will be rendered here using Mermaid.js</p>
                  <p class="small">This feature will show the complete state transition flow</p>
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
import { mapGetters } from 'vuex'

export default {
  name: 'StateTransitionDiagram',
  computed: {
    ...mapGetters(['projectStates', 'projectTransitions'])
  },
  mounted() {
    // Here we would integrate Mermaid.js to render the diagram
    this.renderDiagram()
  },
  methods: {
    renderDiagram() {
      // Placeholder for Mermaid.js integration
      console.log('States:', this.projectStates)
      console.log('Transitions:', this.projectTransitions)
    }
  }
}
</script>

<style scoped>
.state-diagram {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 2rem;
}

.diagram-container {
  min-height: 500px;
  background-color: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}
</style>