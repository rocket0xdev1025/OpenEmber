import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Create } from "./pages/Create";
import { Docs } from "./pages/Docs";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { Trade } from "./pages/Trade";

function LaunchRedirect() {
  const [params] = useSearchParams();
  const search = params.toString();
  return <Navigate to={search ? `/create?${search}` : "/create"} replace />;
}

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/launch" element={<LaunchRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
