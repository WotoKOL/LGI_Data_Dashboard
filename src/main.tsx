import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { initializeDashboardAuth, redirectToLogin } from "./lib/auth"

if (initializeDashboardAuth()) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} else {
  redirectToLogin("未获取到登录信息，请从 LGI 后台重新进入")
}
