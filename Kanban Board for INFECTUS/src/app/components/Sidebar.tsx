import { 
  LayoutGrid, 
  Building2, 
  Shield, 
  Syringe, 
  FileText, 
  BarChart3, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

export function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const menuItems = [
    { id: 'tablero', label: 'Tablero General', icon: LayoutGrid },
    { id: 'instituciones', label: 'Instituciones', icon: Building2 },
    { id: 'proa', label: 'PROA', icon: Shield },
    { id: 'ias', label: 'IAS', icon: Syringe },
    { id: 'formularios', label: 'Formularios', icon: FileText },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">INFECTUS</h1>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onMenuChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 font-medium shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">
          Sistema de Gestión Clínica
        </p>
      </div>
    </div>
  );
}
