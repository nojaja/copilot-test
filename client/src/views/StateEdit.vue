<template>
  <div class="state-edit">
    <div class="container mt-4">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-edit me-2" />
                {{ isNew ? 'Create New State' : 'Edit State' }}
              </h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="saveState">
                <div class="mb-3">
                  <label
                    for="name"
                    class="form-label"
                  >State Name *</label>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    class="form-control"
                    required
                  >
                </div>
                <div class="mb-3">
                  <label
                    for="description"
                    class="form-label"
                  >Description</label>
                  <textarea
                    id="description"
                    v-model="form.description"
                    class="form-control"
                    rows="3"
                  />
                </div>

                <div class="mb-3">
                  <label
                    for="department"
                    class="form-label"
                  >Department</label>
                  <input
                    id="department"
                    v-model="form.department"
                    type="text"
                    class="form-control"
                  >
                </div>

                <div class="mb-3">
                  <IOTermSelector
                    label="Input Conditions (IN)"
                    placeholder="条件や前提を検索して追加..."
                    :selected-terms="form.inputTerms"
                    @update:selected-terms="updateInputTerms"
                    @request-create="openCreateModal('input', $event)"
                  />
                </div>

                <div class="mb-3">
                  <IOTermSelector
                    label="Output Results (OUT)"
                    placeholder="成果物や完了条件を検索して追加..."
                    :selected-terms="form.outputTerms"
                    @update:selected-terms="updateOutputTerms"
                    @request-create="openCreateModal('output', $event)"
                  />
                </div>

                <div class="d-flex justify-content-between">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    @click="$router.back()"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                  >
                    <i class="fas fa-save me-2" />
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

  <div v-if="modal.open">
    <div class="modal-backdrop fade show" />
    <div
      class="modal d-block"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ modal.type === 'input' ? 'Input Conditions (IN)' : 'Output Results (OUT)' }} マスタを追加
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            />
          </div>
          <form @submit.prevent="submitNewTerm">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">ラベル *</label>
                <input
                  v-model="modal.label"
                  type="text"
                  class="form-control"
                  required
                  maxlength="255"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">説明</label>
                <textarea
                  v-model="modal.description"
                  class="form-control"
                  rows="3"
                  maxlength="2000"
                />
              </div>
              <div
                v-if="modalError"
                class="alert alert-danger"
                role="alert"
              >
                {{ modalError }}
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeModal"
              >
                キャンセル
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="modalSubmitting"
              >
                <span
                  v-if="modalSubmitting"
                  class="spinner-border spinner-border-sm me-2"
                />
                登録
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { mapGetters, mapActions } from 'vuex'
import IOTermSelector from '../components/IOTermSelector.vue'

export default {
  name: 'StateEdit',
  components: {
    IOTermSelector
  },
  data() {
    return {
      form: {
        name: '',
        description: '',
        department: '',
        inputTerms: [],
        outputTerms: []
      },
      formInitialized: false,
      modal: {
        open: false,
        type: 'input',
        label: '',
        description: ''
      },
      modalSubmitting: false,
      modalError: ''
    }
  },
  computed: {
    isNew() {
      return this.$route.params.id === 'new' || !this.$route.params.id
    },
    ...mapGetters(['projectStates'])
  },
  watch: {
    projectStates: {
      handler() {
        if (!this.isNew) {
          this.initializeForm()
        }
      },
      deep: true
    },
    '$route.params.id': {
      handler() {
        if (this.isNew) {
          this.resetForm()
        } else {
          this.formInitialized = false
          this.initializeForm()
        }
      },
      immediate: true
    }
  },
  created() {
    if (!this.isNew) {
      this.initializeForm()
    }
  },
  methods: {
    ...mapActions(['createState', 'updateState', 'fetchProject', 'createIOTerm']),
    async initializeForm() {
      const projectId = this.$route.params.projectId
      const stateId = this.$route.params.id

      if (!projectId || stateId === 'new') return

      if (!this.projectStates.length && projectId) {
        await this.fetchProject(projectId)
      }

      const state = this.projectStates.find(s => String(s.id) === String(stateId))
      if (!state || this.formInitialized) {
        return
      }

      this.form = {
        name: state.name || '',
        description: state.description || '',
        department: state.department || '',
        inputTerms: (state.inputTerms || []).map((term, index) => ({
          ...term,
          order: term.order ?? index
        })),
        outputTerms: (state.outputTerms || []).map((term, index) => ({
          ...term,
          order: term.order ?? index
        }))
      }
      this.formInitialized = true
    },
    resetForm() {
      this.form = {
        name: '',
        description: '',
        department: '',
        inputTerms: [],
        outputTerms: []
      }
      this.formInitialized = this.isNew
    },
    updateInputTerms(terms) {
      this.form.inputTerms = terms.map((term, index) => ({ ...term, order: index }))
    },
    updateOutputTerms(terms) {
      this.form.outputTerms = terms.map((term, index) => ({ ...term, order: index }))
    },
    openCreateModal(type, initialQuery = '') {
      this.modal = {
        open: true,
        type,
        label: initialQuery || '',
        description: ''
      }
      this.modalError = ''
    },
    closeModal() {
      this.modal.open = false
      this.modalSubmitting = false
      this.modalError = ''
    },
    async submitNewTerm() {
      if (!this.modal.label.trim()) {
        this.modalError = 'ラベルを入力してください'
        return
      }

      this.modalSubmitting = true
      this.modalError = ''

      try {
        const term = await this.createIOTerm({
          label: this.modal.label.trim(),
          description: this.modal.description.trim() || undefined
        })

        if (this.modal.type === 'input') {
          const next = [...this.form.inputTerms, { ...term }]
          this.form.inputTerms = next.map((item, index) => ({ ...item, order: index }))
        } else {
          const next = [...this.form.outputTerms, { ...term }]
          this.form.outputTerms = next.map((item, index) => ({ ...item, order: index }))
        }

        this.closeModal()
      } catch (error) {
        this.modalError = error.response?.data?.error || 'マスタの作成に失敗しました'
      } finally {
        this.modalSubmitting = false
      }
    },
    async saveState() {
      try {
        const projectId = this.$route.params.projectId
        const payload = {
          name: this.form.name,
          description: this.form.description,
          department: this.form.department,
          inputTermIds: this.form.inputTerms.map(term => term.id),
          outputTermIds: this.form.outputTerms.map(term => term.id)
        }

        if (this.isNew) {
          await this.createState({
            ...payload,
            projectId
          })
        } else {
          await this.updateState({
            id: this.$route.params.id,
            data: payload
          })
        }
        this.$router.push(`/project/${projectId}`)
      } catch (error) {
        // エラーはstoreで処理
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