<template>
  <div class="register-container">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow">
            <div class="card-body p-4">
              <div class="text-center mb-4">
                <i class="fas fa-user-plus fa-3x text-primary mb-3"></i>
                <h2>Create Account</h2>
                <p class="text-muted">Join Process Flow Manager</p>
              </div>

              <div v-if="error" class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ error }}
              </div>

              <form @submit.prevent="handleRegister">
                <div class="mb-3">
                  <label for="name" class="form-label">Full Name *</label>
                  <input
                    type="text"
                    class="form-control"
                    id="name"
                    v-model="form.name"
                    required
                    :disabled="loading"
                  >
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label">Email *</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    v-model="form.email"
                    required
                    :disabled="loading"
                  >
                </div>

                <div class="mb-3">
                  <label for="department" class="form-label">Department</label>
                  <input
                    type="text"
                    class="form-control"
                    id="department"
                    v-model="form.department"
                    :disabled="loading"
                  >
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Password *</label>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    v-model="form.password"
                    required
                    minlength="6"
                    :disabled="loading"
                  >
                  <div class="form-text">Minimum 6 characters</div>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-100 mb-3"
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="fas fa-user-plus me-2"></i>
                  Create Account
                </button>
              </form>

              <div class="text-center">
                <p class="mb-0">
                  Already have an account?
                  <router-link to="/login" class="text-decoration-none">
                    Sign in here
                  </router-link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'Register',
  data() {
    return {
      form: {
        name: '',
        email: '',
        password: '',
        department: ''
      }
    }
  },
  computed: {
    ...mapState(['loading', 'error'])
  },
  methods: {
    ...mapActions(['register']),
    async handleRegister() {
      try {
        await this.register(this.form)
        this.$router.push('/')
      } catch (error) {
        // Error is handled by the store
      }
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
  border: none;
  border-radius: 10px;
}

.form-control {
  border-radius: 8px;
  padding: 12px;
}

.btn {
  border-radius: 8px;
  padding: 12px;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.7;
}
</style>