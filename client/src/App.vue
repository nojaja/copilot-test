<template>
  <div id="app">
    <NavbarComponent v-if="isAuthenticated" />
    <main :class="{ 'with-navbar': isAuthenticated }">
      <router-view />
    </main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import NavbarComponent from './components/NavbarComponent.vue'

export default {
  name: 'App',
  components: {
    NavbarComponent
  },
  computed: {
    ...mapGetters(['isAuthenticated'])
  },
  async created() {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      this.$store.commit('SET_AUTH', { token, user: JSON.parse(user) })
      this.$http.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }
}
</script>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

main.with-navbar {
  padding-top: 60px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.btn {
  border-radius: 6px;
}

.form-control, .form-select {
  border-radius: 6px;
}

.alert {
  border-radius: 6px;
}
</style>