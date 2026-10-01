import { useNavigate } from "react-router-dom";
import PerformanceDashboard from "./PerformanceDashboard.jsx";

export default function DistrictManagerPerformanceReport() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return <PerformanceDashboard onLogout={logout} />;
}
