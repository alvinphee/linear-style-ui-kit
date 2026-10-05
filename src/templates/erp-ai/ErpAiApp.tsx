import ErpApp from '../erp/ErpApp'
import { WITH_AI } from '../erp/edition'

// The ERP + AI template: #/templates/erp-ai. The ERP template with the AI
// assistant built in: a prompt box and an AI briefing on the launchpad, a
// full-page Assistant whose chats sit in the sidebar, the same chats in the
// Ask AI side panel, and a Start page setting (launchpad or Assistant).
// All of it is the ERP's own code (src/templates/erp), switched on here.
export default function ErpAiApp() {
  return <ErpApp edition={WITH_AI} />
}
