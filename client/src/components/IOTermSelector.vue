<template>
  <div class="io-term-selector">
    <label class="form-label d-flex align-items-center justify-content-between">
      <span>{{ label }}</span>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        @click="emitCreateRequest"
      >
        <i class="fas fa-plus me-1" />
        新規追加
      </button>
    </label>

    <div
      v-if="selectedTerms.length"
      class="selected-terms mb-2"
    >
      <span
        v-for="term in orderedSelected"
        :key="term.id"
        class="badge bg-primary text-light me-2 mb-2 d-inline-flex align-items-center"
      >
        <span>{{ term.label }}</span>
        <button
          type="button"
          class="btn-close btn-close-white ms-2"
          aria-label="Remove"
          @click="removeTerm(term.id)"
        />
      </span>
    </div>

    <div class="position-relative">
      <input
        v-model="query"
        type="text"
        class="form-control"
        :placeholder="placeholder"
        @focus="handleFocus"
        @input="handleInput"
        @keydown.down.prevent="moveSelection(1)"
        @keydown.up.prevent="moveSelection(-1)"
        @keydown.enter.prevent="handleEnter"
        @blur="scheduleDropdownClose"
      >

      <transition name="fade">
        <ul
          v-if="showDropdown"
          class="list-group suggestion-dropdown"
        >
          <li
            v-for="(term, index) in suggestions"
            :key="term.id"
            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            :class="{ active: index === highlightedIndex }"
            @mousedown.prevent="selectTerm(term)"
          >
            <div>
              <div class="fw-semibold">
                {{ term.label }}
              </div>
              <div
                v-if="term.description"
                class="small text-muted"
              >
                {{ term.description }}
              </div>
            </div>
            <span
              v-if="term.usageCount"
              class="badge bg-secondary"
            >
              {{ term.usageCount }}
            </span>
          </li>
          <li
            v-if="!suggestions.length && query"
            class="list-group-item text-muted small"
          >
            一致する候補がありません。Enterで新規追加できます。
          </li>
        </ul>
      </transition>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'IOTermSelector',
  props: {
    label: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      default: ''
    },
    selectedTerms: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:selected-terms', 'request-create'],
  data() {
    return {
      query: '',
      suggestions: [],
      showDropdown: false,
      searchTimeout: null,
      highlightedIndex: -1
    }
  },
  computed: {
    selectedIds() {
      return new Set(this.selectedTerms.map(term => term.id))
    },
    orderedSelected() {
      return [...this.selectedTerms].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }
  },
  methods: {
    ...mapActions(['searchIOTerms']),
    emitCreateRequest() {
      this.$emit('request-create', this.query.trim())
      this.hideDropdown()
    },
    handleFocus() {
      if (this.query) {
        this.fetchSuggestions()
      }
    },
    handleInput() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(this.fetchSuggestions, 250)
    },
    async fetchSuggestions() {
      const keyword = this.query.trim()
      if (!keyword) {
        this.suggestions = []
        this.showDropdown = false
        this.highlightedIndex = -1
        return
      }
      try {
        const results = await this.searchIOTerms({ query: keyword })
        this.suggestions = results.filter(result => !this.selectedIds.has(result.id))
        this.showDropdown = true
        this.highlightedIndex = this.suggestions.length ? 0 : -1
      } catch (error) {
        console.error('Failed to fetch IO term suggestions', error)
        this.suggestions = []
      }
    },
    selectTerm(term) {
      if (!term || this.selectedIds.has(term.id)) return
      const updated = [...this.selectedTerms, { ...term, order: this.selectedTerms.length }]
  this.$emit('update:selected-terms', updated)
      this.resetInput()
    },
    removeTerm(termId) {
      const updated = this.selectedTerms.filter(term => term.id !== termId)
  this.$emit('update:selected-terms', updated)
    },
    hideDropdown() {
      this.showDropdown = false
      this.highlightedIndex = -1
    },
    resetInput() {
      this.query = ''
      this.suggestions = []
      this.hideDropdown()
    },
    scheduleDropdownClose() {
      setTimeout(() => {
        this.hideDropdown()
      }, 200)
    },
    moveSelection(offset) {
      if (!this.showDropdown || !this.suggestions.length) return
      const next = (this.highlightedIndex + offset + this.suggestions.length) % this.suggestions.length
      this.highlightedIndex = next
    },
    handleEnter() {
      if (this.showDropdown && this.highlightedIndex >= 0) {
        const term = this.suggestions[this.highlightedIndex]
        this.selectTerm(term)
      } else if (this.query.trim()) {
        this.emitCreateRequest()
      }
    }
  }
}
</script>

<style scoped>
.io-term-selector {
  position: relative;
}

.suggestion-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  z-index: 20;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
