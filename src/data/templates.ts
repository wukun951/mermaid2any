export type GraphThemeValue = 'default' | 'neutral' | 'forest' | 'dark'

export const graphThemes: Array<{ label: string; value: GraphThemeValue }> = [
  { label: 'Default', value: 'default' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Forest', value: 'forest' },
  { label: 'Dark', value: 'dark' },
]

export const editorThemes = [
  { label: 'Graphite', value: 'graphite' },
  { label: 'Paper', value: 'paper' },
]

export type DiagramTemplate = {
  code: string
  description: string
  id: string
  title: string
}

export const DEFAULT_TEMPLATE_ID = 'product-flow'

export const diagramTemplates: DiagramTemplate[] = [
  {
    id: 'product-flow',
    title: '需求审批流',
    description: '适合产品经理快速改成业务流程图',
    code: `flowchart TD
    A[需求进入池子] --> B{是否高优先级}
    B -->|是| C[安排本周评审]
    B -->|否| D[放入下轮规划]
    C --> E[设计方案]
    E --> F[开发排期]
    F --> G[上线复盘]`,
  },
  {
    id: 'release-sequence',
    title: '发布协作时序',
    description: '适合开发和测试梳理协作节奏',
    code: `sequenceDiagram
    autonumber
    participant PM as 产品经理
    participant DEV as 开发
    participant QA as 测试
    participant OPS as 运维

    PM->>DEV: 确认发布范围
    DEV->>QA: 提交候选版本
    QA-->>DEV: 回传验证结果
    DEV->>OPS: 提交上线申请
    OPS-->>PM: 发布完成通知`,
  },
  {
    id: 'system-state',
    title: '状态流转',
    description: '适合订单、任务、工单状态梳理',
    code: `stateDiagram-v2
    [*] --> Draft
    Draft --> Reviewing: 提交审核
    Reviewing --> Approved: 审核通过
    Reviewing --> Rejected: 退回修改
    Rejected --> Draft
    Approved --> Published
    Published --> [*]`,
  },
  {
    id: 'domain-class',
    title: '领域类图',
    description: '适合技术文档快速描述模型关系',
    code: `classDiagram
    class Project {
      +string name
      +string owner
      +publish()
    }
    class Diagram {
      +string source
      +render()
      +export()
    }
    class ExportJob {
      +string format
      +run()
    }
    Project "1" --> "*" Diagram
    Diagram "1" --> "*" ExportJob`,
  },
]
