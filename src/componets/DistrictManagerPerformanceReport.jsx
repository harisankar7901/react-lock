import { useNavigate } from "react-router-dom";
import PerformanceDashboard from "./PerformanceDashboard.jsx";

export default function DistrictManagerPerformanceReport() {
  const navigate = useNavigate();

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return <PerformanceDashboard onLogout={logout} />;
}
