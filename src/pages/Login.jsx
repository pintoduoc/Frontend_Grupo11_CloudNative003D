import { useMsal } from "@azure/msal-react";
import { apiRequest } from "../authConfig"; // Asegúrate de tener este archivo creado previamente

function Login() {
  const { instance } = useMsal();

  const iniciarSesion = () => {
    instance.loginRedirect(apiRequest).catch((e) => console.error(e));
  };

  return (
    <main className="login">
      <div className="login-card">
        <h2>Bienvenido a AndesStay</h2>
        <p>Plataforma de reservas de hostales y cabañas</p>
        
        <button onClick={iniciarSesion}>
          Iniciar sesión con Microsoft
        </button>
      </div>
    </main>
  );
}

export default Login;