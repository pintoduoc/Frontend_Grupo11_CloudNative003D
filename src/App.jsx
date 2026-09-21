import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Catalog from './pages/Catalog';
import Reports from './pages/Reports';
import Audit from './pages/Audit';

import './App.css';

// Función auxiliar para extraer el rol desde el token de Azure
export const obtenerRol = (accounts) => {
  if (accounts.length > 0 && accounts[0].idTokenClaims) {
    const claims = accounts[0].idTokenClaims;
    // Dependiendo de cómo configuraste el User Flow, el rol puede venir en 'roles' o 'extension_Rol'
    if (claims.rol && claims.rol.length > 0) return claims.rol[0];
    if (claims.extension_Rol) return claims.extension_Rol;
  }
  // Rol por defecto en caso de que el token no traiga el claim durante las pruebas
  return 'Recepcionista'; 
};

function RutaProtegida({ rolesPermitidos, children }) {
  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();
  
  if (!isAuthenticated) {
    return (
      <main className="dashboard">
        <h2>No autenticado</h2>
        <p>Por favor, inicia sesión para acceder a esta sección.</p>
      </main>
    );
  }

  const rol = obtenerRol(accounts);

  if (!rol || !rolesPermitidos.includes(rol)) {
    return (
      <main className="dashboard">
        <h2>Acceso denegado</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
      </main>
    );
  }

  return children;
}

function Navegacion() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const rol = obtenerRol(accounts);

  const cerrarSesion = () => {
    // Llama al método de logout de MSAL
    instance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
  };

  return (
    <header>
      <h1>AndesStay</h1>

      {isAuthenticated && (
        <nav>
          <Link to="/dashboard">Dashboard</Link>

          {(rol === 'Admin' || rol === 'Recepcionista' || rol === 'Huésped') && (
            <Link to="/reservations">Reservas</Link>
          )}

          {(rol === 'Admin' || rol === 'Recepcionista') && (
            <Link to="/catalog">Catálogo</Link>
          )}

          {rol === 'Admin' && (
            <Link to="/reports">Reportería</Link>
          )}

          {(rol === 'Admin' || rol === 'Auditor') && (
            <Link to="/audit">Auditoría</Link>
          )}

          <button onClick={cerrarSesion}>Cerrar sesión</button>
        </nav>
      )}
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navegacion />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/reservations" element={
          <RutaProtegida rolesPermitidos={['Admin', 'Recepcionista', 'Huésped']}>
            <Reservations />
          </RutaProtegida>
        } />
        
        <Route path="/catalog" element={
          <RutaProtegida rolesPermitidos={['Admin', 'Recepcionista']}>
            <Catalog />
          </RutaProtegida>
        } />
        
        <Route path="/reports" element={
          <RutaProtegida rolesPermitidos={['Admin']}>
            <Reports />
          </RutaProtegida>
        } />
        
        <Route path="/audit" element={
          <RutaProtegida rolesPermitidos={['Admin', 'Auditor']}>
            <Audit />
          </RutaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;