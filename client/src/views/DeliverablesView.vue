<template>
  <div class="deliverables-view">
    <div class="container-fluid mt-4">
      <div
        v-if="isLoading"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="currentProject">
        <!-- Header -->
        <div class="row mb-4 align-items-start">
          <div class="col-12 col-lg-7">
            <h1 class="h3 mb-1 d-flex align-items-center gap-2">
              <i class="fas fa-clipboard-list text-primary" />
              Deliverables View
            </h1>
            <p class="text-muted mb-0">
              {{ currentProject.name }} のStatesに紐づくIN/OUTマスタデータ一覧です。
            </p>
          </div>
          <div class="col-12 col-lg-5 d-flex justify-content-lg-end justify-content-start mt-3 mt-lg-0">
            <StateHeaderButtons :project-id="currentProject.id" />
          </div>
        </div>

        <!-- Summary cards -->
        <div class="row g-3 mb-4">
          <div class="col-12 col-sm-6 col-xl-4">
            <div class="summary-card bg-primary text-white">
              <div class="summary-label">
                登録済み用語
              </div>
              <div class="summary-value">
                {{ stats.totalTerms }}
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-xl-4">
            <div class="summary-card bg-success text-white">
              <div class="summary-label">
                利用中（Stateに紐付）
              </div>
              <div class="summary-value">
                {{ stats.inUse }}
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-xl-4">
            <div class="summary-card bg-secondary text-white">
              <div class="summary-label">
                未使用
              </div>
              <div class="summary-value">
                {{ stats.unused }}
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="card mb-4 shadow-sm">
          <div class="card-body">
            <div class="row g-3 align-items-end">
              <div class="col-12 col-md-6 col-lg-4">
                <label
                  for="deliverables-search"
                  class="form-label text-muted mb-1"
                >
                  キーワード検索
                </label>
                <input
                  id="deliverables-search"
                  v-model.trim="searchText"
                  type="search"
                  class="form-control"
                  placeholder="用語名または説明文を検索"
                >
              </div>
              <div class="col-12 col-md-6 col-lg-4">
                <label
                  for="deliverables-filter"
                  class="form-label text-muted mb-1"
                >
                  利用状況
                </label>
                <select
                  id="deliverables-filter"
                  v-model="usageFilter"
                  class="form-select"
                >
                  <option value="all">
                    すべて表示
                  </option>
                  <option value="in-use">
                    利用中のみ
                  </option>
                  <option value="unused">
                    未使用のみ
                  </option>
                </select>
              </div>
              <div class="col-12 col-lg-4">
                <div class="alert alert-light border mb-0">
                  <small class="text-muted">
                    本画面ではSTATE IN/OUTに使用する用語マスタを管理できます。
                    各行の編集ボタンから詳細を更新してください。
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="card shadow-sm">
          <div class="card-header bg-white">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-list-ul me-2 text-primary" />
                IO Terms ({{ filteredTerms.length }})
              </h5>
              <div class="d-flex align-items-center gap-2">
                <router-link
                  :to="{ name: 'IOTermEdit', params: { id: projectId } }"
                  class="btn btn-sm btn-primary"
                >
                  <i class="fas fa-plus me-1" />
                  新規作成
                </router-link>
                <span class="badge bg-light text-muted">
                  {{ filteredTerms.length }} / {{ ioTerms.length }} terms
                </span>
              </div>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th scope="col">
                    用語名
                  </th>
                  <th
                    scope="col"
                    class="w-40"
                  >
                    説明
                  </th>
                  <th
                    scope="col"
                    class="text-center"
                  >
                    利用数
                  </th>
                  <th
                    scope="col"
                    class="text-nowrap"
                  >
                    最終更新
                  </th>
                  <th
                    scope="col"
                    class="text-end"
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="term in filteredTerms"
                  :key="term.id"
                >
                  <td>
                    <div class="fw-semibold">
                      {{ term.label }}
                    </div>
                    <div class="text-muted small">
                      ID: {{ term.id }}
                    </div>
                  </td>
                  <td>
                    <p class="mb-0 text-muted">
                      {{ term.description || '—' }}
                    </p>
                  </td>
                  <td class="text-center">
                    <span
                      class="badge"
                      :class="term.usageCount > 0 ? 'bg-success' : 'bg-secondary'"
                    >
                      {{ term.usageCount }}
                    </span>
                  </td>
                  <td class="text-muted small">
                    <i class="far fa-clock me-1" />
                    {{ formatDate(term.updatedAt || term.createdAt) }}
                  </td>
                  <td class="text-end">
                    <router-link
                      :to="editLink(term.id)"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="fas fa-edit me-1" />
                      Edit
                    </router-link>
                  </td>
                </tr>
                <tr v-if="!filteredTerms.length && !isLoading">
                  <td
                    class="text-center text-muted"
                    colspan="5"
                  >
                    該当する用語がありません。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        v-else
        class="alert alert-info"
      >
        プロジェクト情報が取得できませんでした。アクセス権限をご確認ください。
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import StateHeaderButtons from '../components/StateHeaderButtons.vue'

export default {
  name: 'DeliverablesView',
  components: {
    StateHeaderButtons
  },
  data() {
    return {
      searchText: '',
      usageFilter: 'all',
      isLoading: false
    }
  },
  computed: {
    ...mapGetters(['currentProject', 'projectStates', 'ioTerms']),
    projectId() {
      return this.$route.params.id
    },
    stats() {
      const base = Array.isArray(this.ioTerms) ? this.ioTerms : []
      const inUse = base.filter(term => (term.usageCount || 0) > 0).length
      const total = base.length
      const unused = total - inUse
      return {
        totalTerms: total,
        inUse,
        unused
      }
    },
    filteredTerms() {
      let list = Array.isArray(this.ioTerms) ? [...this.ioTerms] : []
      const keyword = this.searchText.trim().toLowerCase()

      if (keyword) {
        list = list.filter((term) => {
          const targets = [term.label, term.description]
          return targets.some(value => (value || '').toLowerCase().includes(keyword))
        })
      }

      if (this.usageFilter === 'in-use') {
        list = list.filter(term => (term.usageCount || 0) > 0)
      } else if (this.usageFilter === 'unused') {
        list = list.filter(term => (term.usageCount || 0) === 0)
      }

      return list.sort((a, b) => a.label.localeCompare(b.label))
    }
  },
  watch: {
    projectId: {
      immediate: true,
      handler(newId, oldId) {
        if (!newId) return
        if (oldId && newId !== oldId) {
          this.searchText = ''
          this.usageFilter = 'all'
        }
        this.ensureProjectData(newId)
        this.loadTerms()
      }
    }
  },
  methods: {
    ...mapActions(['fetchProject', 'fetchIOTerms']),
    async ensureProjectData(projectId) {
      try {
        const needsRefresh =
          !this.currentProject ||
          this.currentProject.id !== projectId ||
          !Array.isArray(this.projectStates) ||
          this.projectStates.length === 0

        if (needsRefresh) {
          await this.fetchProject(projectId)
        }
      } catch (error) {
        console.error('Failed to load project for deliverables view:', error)
      }
    },
    async loadTerms(params = {}) {
      try {
        this.isLoading = true
        await this.fetchIOTerms({ limit: 200, ...params })
      } catch (error) {
        console.error('Failed to fetch IO terms for deliverables view:', error)
      } finally {
        this.isLoading = false
      }
    },
    formatDate(value) {
      if (!value) return '-'
      try {
        return new Date(value).toLocaleString()
      } catch (error) {
        return value
      }
    },
    editLink(id) {
      return { name: 'IOTermEdit', params: { id: this.projectId, ioTermId: id } }
    }
  }
}
</script>

<style scoped>
.deliverables-view {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 3rem;
}

.summary-card {
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.summary-label {
  font-size: 0.9rem;
  opacity: 0.85;
}

.summary-value {
  font-size: 1.75rem;
  font-weight: 700;
}

.table td {
  vertical-align: top;
}

.badge {
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
}

.w-35 {
  width: 35%;
}

@media (max-width: 992px) {
  .w-35 {
    width: auto;
  }
}
</style>
