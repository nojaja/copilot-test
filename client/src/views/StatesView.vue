<template>
  <div class="states-view">
    <div class="container-fluid mt-4">
      <div class="row mb-4">
        <div class="col">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h1 class="h3 mb-1">
                States
              </h1>
              <p class="text-muted mb-0">
                State list and management
              </p>
            </div>
            <div class="d-flex align-items-center gap-2">
              <StateHeaderButtons :project-id="$route.params.id" />
              <router-link
                :to="`/project/${$route.params.id}/state/new`"
                class="btn btn-primary ms-2"
              >
                <i class="fas fa-plus me-1" />
                Add State
              </router-link>
            </div>
          </div>
        </div>
      </div>
      <!-- States list table or content here -->
      <div class="card">
        <div class="card-body">
          <p>ここにStatesリストや管理UIを実装してください。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import StateHeaderButtons from '../components/StateHeaderButtons.vue'

export default {
  name: 'StatesView',
  components: {
    StateHeaderButtons
  }
}
</script>

<style scoped>
.states-view {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 2rem;
}
</style>
