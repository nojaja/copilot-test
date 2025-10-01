<template>
  <div class="io-term-edit">
    <div class="container py-4">
      <div class="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 class="h3 mb-1">
            <i class="fas fa-clipboard-list me-2 text-primary" />
            {{ isNew ? 'Add IO Term' : 'Edit IO Term' }}
          </h1>
          <p class="text-muted mb-0">
            StateのIN/OUTで利用される用語マスタを{{ isNew ? '新規登録' : '更新' }}します。
          </p>
        </div>
        <router-link
          :to="{ name: 'DeliverablesView', params: { id: projectId } }"
          class="btn btn-outline-secondary"
        >
          <i class="fas fa-arrow-left me-1" />
          Back to Deliverables
        </router-link>
      </div>

      <div class="row justify-content-center">
        <div class="col-lg-8 col-xl-6">
          <div class="card shadow-sm">
            <div class="card-body">
              <form @submit.prevent="handleSubmit">
                <div class="mb-3">
                  <label
                    for="io-term-label"
                    class="form-label"
                  >
                    用語名 <span class="text-danger">*</span>
                  </label>
                  <input
                    id="io-term-label"
                    v-model.trim="form.label"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': validationErrors.label }"
                    maxlength="255"
                    required
                    placeholder="例: 顧客情報"
                    :disabled="loading || saving"
                  >
                  <div class="invalid-feedback">
                    {{ validationErrors.label }}
                  </div>
                </div>

                <div class="mb-3">
                  <label
                    for="io-term-description"
                    class="form-label"
                  >
                    説明
                  </label>
                  <textarea
                    id="io-term-description"
                    v-model.trim="form.description"
                    class="form-control"
                    :class="{ 'is-invalid': validationErrors.description }"
                    rows="4"
                    maxlength="2000"
                    placeholder="利用用途や取扱いルールなどを記述できます"
                    :disabled="loading || saving"
                  />
                  <div class="invalid-feedback">
                    {{ validationErrors.description }}
                  </div>
                </div>

                <div
                  v-if="errorMessage"
                  class="alert alert-danger"
                >
                  {{ errorMessage }}
                </div>

                <div class="d-flex justify-content-end gap-2">
                  <router-link
                    :to="{ name: 'DeliverablesView', params: { id: projectId } }"
                    class="btn btn-outline-secondary"
                  >
                    Cancel
                  </router-link>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="saving || loading"
                  >
                    <i
                      v-if="saving || loading"
                      class="fas fa-spinner fa-spin me-1"
                    />
                    {{ isNew ? 'Create Term' : 'Save Changes' }}
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
  name: 'IOTermEdit',
  data() {
    return {
      form: {
        label: '',
        description: ''
      },
      saving: false,
      loading: false,
      errorMessage: '',
      validationErrors: {}
    }
  },
  computed: {
    projectId() {
      return this.$route.params.id
    },
    ioTermId() {
      return this.$route.params.ioTermId || null
    },
    isNew() {
      return !this.ioTermId
    }
  },
  async created() {
    if (!this.isNew) {
      await this.loadTerm()
    }
  },
  methods: {
    ...mapActions(['fetchIOTerm', 'createIOTerm', 'updateIOTerm', 'fetchIOTerms']),
    async loadTerm() {
      try {
        this.loading = true
        const term = await this.fetchIOTerm(this.ioTermId)
        this.form.label = term.label || ''
        this.form.description = term.description || ''
      } catch (error) {
        console.error('Failed to load IO term detail:', error)
        this.errorMessage = 'IO termを読み込めませんでした。すでに削除された可能性があります。'
      } finally {
        this.loading = false
      }
    },
    async handleSubmit() {
      this.errorMessage = ''
      this.validationErrors = {}

      if (!this.validateForm()) {
        return
      }

      const payload = {
        label: this.form.label,
        description: this.form.description || undefined
      }

      try {
        this.saving = true
        if (this.isNew) {
          await this.createIOTerm(payload)
        } else {
          await this.updateIOTerm({ id: this.ioTermId, data: payload })
        }
        await this.fetchIOTerms({ limit: 200 })
        this.$router.push({ name: 'DeliverablesView', params: { id: this.projectId } })
      } catch (error) {
        const apiMessage = error.response?.data?.error
        this.errorMessage = apiMessage || 'IO termの保存に失敗しました。'
      } finally {
        this.saving = false
      }
    },
    validateForm() {
      const errors = {}
      if (!this.form.label) {
        errors.label = '用語名は必須です。'
      }
      if (this.form.label && this.form.label.length > 255) {
        errors.label = '用語名は255文字以内で入力してください。'
      }
      if (this.form.description && this.form.description.length > 2000) {
        errors.description = '説明は2000文字以内で入力してください。'
      }
      this.validationErrors = errors
      return Object.keys(errors).length === 0
    }
  }
}
</script>

<style scoped>
.io-term-edit {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.card {
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
</style>
