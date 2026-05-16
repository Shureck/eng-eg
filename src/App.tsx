import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Train from "./pages/Train";
import Weak from "./pages/Weak";
import Exam from "./pages/Exam";
import Lightning from "./pages/Lightning";
import SearchPage from "./pages/Search";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/train" element={<Train />} />
        <Route path="/weak" element={<Weak />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/lightning" element={<Lightning />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
