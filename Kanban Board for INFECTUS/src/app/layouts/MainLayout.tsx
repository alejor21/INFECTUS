import { Outlet, useNavigate, useLocation } from 'react-router';
import { Sidebar } from '../components/Sidebar';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveMenu = () => {
    const path = location.pathname.slice(1);
    return path || 'tablero';
  };

  const handleMenuChange = (menu: string) => {
    if (menu === 'tablero') {
      navigate('/');
    } else {
      navigate(`/${menu}`);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-100">
      <Sidebar activeMenu={getActiveMenu()} onMenuChange={handleMenuChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
