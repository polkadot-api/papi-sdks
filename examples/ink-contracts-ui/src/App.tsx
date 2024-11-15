import { Route, Routes } from "react-router-dom"
import { HomePage } from "./pages/Home"

export default function App() {
  return (
    <div className="w-full max-w-screen-lg h-screen bg-background flex flex-col">
      <Routes>
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  )
}
