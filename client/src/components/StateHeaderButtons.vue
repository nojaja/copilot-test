<template>
  <div class="btn-group">
    <router-link
      :to="`/project/${projectId}/states`"
      class="btn"
      :class="stateBtnClass"
      exact
    >
      <i class="fas fa-list me-1" />
      State View
    </router-link>
    <router-link
      :to="`/project/${projectId}/matrix`"
      class="btn"
      :class="matrixBtnClass"
      exact
    >
      <i class="fas fa-table me-1" />
      Matrix View
    </router-link>
    <router-link
      :to="`/project/${projectId}/diagram`"
      class="btn"
      :class="diagramBtnClass"
      exact
    >
      <i class="fas fa-project-diagram me-1" />
      Diagram
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'StateHeaderButtons',
  props: {
    projectId: {
      type: [String, Number],
      required: true
    }
  },
  computed: {
    stateBtnClass() {
      const isActive = this.$route.path === `/project/${this.projectId}/states`
      return isActive ? 'btn-primary' : 'btn-outline-primary'
    },
    matrixBtnClass() {
      const isActive = this.$route.path === `/project/${this.projectId}/matrix`
      return isActive ? 'btn-info' : 'btn-outline-info'
    },
    diagramBtnClass() {
      const isActive = this.$route.path === `/project/${this.projectId}/diagram`
      return isActive ? 'btn-success' : 'btn-outline-success'
    }
  }
}
</script>
