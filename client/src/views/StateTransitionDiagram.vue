<template>
  <div class="state-diagram">
    <div class="container-fluid mt-4">
      <div class="row mb-4">
        <div class="col">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h1 class="h3 mb-1">
                State Transition Diagram
              </h1>
              <p class="text-muted mb-0">
                Visual representation of process flow
              </p>
            </div>
            <div class="d-flex flex-column align-items-end">
              <StateHeaderButtons :project-id="$route.params.id" />
              <div class="btn-group mt-2">
                <button class="btn btn-outline-secondary">
                  <i class="fas fa-expand-arrows-alt me-1" />
                  Fit to Screen
                </button>
                <button class="btn btn-outline-info">
                  <i class="fas fa-download me-1" />
                  Export Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col">
          <div class="card">
            <div class="card-body">
              <div
                id="diagram-container"
                class="diagram-container"
              >
                <div class="text-center text-muted py-5">
                  <i class="fas fa-project-diagram fa-3x mb-3" />
                  <p>Diagram will be rendered here using Mermaid.js</p>
                  <p class="small">
                    This feature will show the complete state transition flow
                  </p>
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

import { mapGetters, mapActions } from 'vuex'
import mermaid from 'mermaid'
import StateHeaderButtons from '../components/StateHeaderButtons.vue'

export default {
  name: 'StateTransitionDiagram',
  components: {
    StateHeaderButtons
  },
  data() {
    return {
      renderTimeout: null,
      lastRenderedKey: null
    }
  },
  computed: {
    ...mapGetters(['projectStates', 'projectTransitions']),
    projectData() {
      return [this.projectStates, this.projectTransitions]
    }
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId) this.loadAndRender(newId)
      }
    },
    projectStates: {
      handler() {
        this.debouncedRenderDiagram()
      },
      deep: true
    },
    projectTransitions: {
      handler() {
        this.debouncedRenderDiagram()
      },
      deep: true
    }
  },

  mounted() {
    const id = this.$route.params.id
    if (id) this.loadAndRender(id)
    // 初回描画も必ず試みる
    this.debouncedRenderDiagram()
  },
  methods: {
    ...mapActions(['fetchProject']),
    async loadAndRender(id) {
      if (!id) return
      await this.fetchProject(id)
      // 描画はwatch経由で行う
    },
    debouncedRenderDiagram() {
      // 重複呼び出しを防ぐデバウンス処理
      clearTimeout(this.renderTimeout)
      this.renderTimeout = setTimeout(() => {
        this.renderDiagram()
      }, 100)
    },
    renderDiagram() {
      // Mermaid.jsで状態遷移図を描画
      const states = (this.projectStates || []).slice().sort((a, b) => (a.name > b.name ? 1 : -1))
      const stateIds = new Set(states.map(s => s.id))
      const transitions = (this.projectTransitions || []).slice().sort((a, b) => (a.eventName > b.eventName ? 1 : -1))
      const container = document.getElementById('diagram-container')
      
      // 重複描画を防ぐため、データのキーをチェック
      const dataKey = `${states.length}-${transitions.length}-${states.map(s => s.id).join(',')}`
      if (this.lastRenderedKey === dataKey) {
        console.log('Skipping duplicate render for same data')
        return
      }
      
      console.log('renderDiagram called', {
        statesLength: states.length,
        transitionsLength: transitions.length,
        containerExists: !!container,
        dataKey
      })
      
      if (!container) return // DOM未生成時は何もしない
      if (!states.length || !transitions.length) {
        console.log('Not enough data for diagram rendering')
        container.innerHTML = `<div class='text-center text-muted py-5'><i class='fas fa-project-diagram fa-3x mb-3'></i><p>Diagram will be rendered here using Mermaid.js</p><p class='small'>This feature will show the complete state transition flow</p></div>`
        return
      }
      
      this.lastRenderedKey = dataKey

      // ノード名: id or name
      const nodeId = s => `S${s.id}`
      // Mermaidノード定義
      const nodeDef = s => `${nodeId(s)}["${s.name}"]`
      // Mermaidエッジ定義（from/toがstatesに存在しない場合はスキップ）
      const edgeDef = t => {
        if (!stateIds.has(t.fromStateId) || !stateIds.has(t.toStateId)) return ''
        const from = nodeId(states.find(s => s.id === t.fromStateId))
        const to = nodeId(states.find(s => s.id === t.toStateId))
        const label = t.eventName ? `|${t.eventName}|` : ''
        return `${from} -->${label} ${to}`
      }

      let mermaidText = 'graph TD\n'
      mermaidText += states.map(nodeDef).join('\n') + '\n'
      mermaidText += transitions.map(edgeDef).filter(Boolean).join('\n') + '\n'

      console.log('Generated Mermaid text:', mermaidText)

      // Mermaid描画
      mermaid.initialize({ startOnLoad: false })
      // 既存内容クリア
      container.innerHTML = ''
      console.log('Starting Mermaid rendering...')
      // SVGを直接containerに描画
      mermaid.render('stateDiagram', mermaidText).then(({svg}) => {
        console.log('Mermaid render success, SVG length:', svg.length)
        container.innerHTML = svg
      }).catch(err => {
        console.error('Mermaid render error:', err)
        container.innerHTML = `<div class='text-danger'>Mermaid描画エラー: ${err?.message || err}</div>`
      })
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