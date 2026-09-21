import { useMsal } from "@azure/msal-react";
import { obtenerRol } from "../App";
import { useState, useEffect } from 'react';
import { fetchWithToken } from "../api";

function Dashboard() {
  const { accounts } = useMsal();
  const rol = obtenerRol(accounts);

  const [reservas, setReservas] = useState([]);
  const [alojamientos, setAlojamientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // =====================================================
  // CARGAR DATOS DESDE LOS MICROSERVICIOS
  // =====================================================
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        // Hacemos ambas peticiones al API Gateway en paralelo
        const [dataReservas, dataAlojamientos] = await Promise.all([
          fetchWithToken("/api/reservations"),
          fetchWithToken("/api/catalog")
        ]);
        setReservas(dataReservas);
        setAlojamientos(dataAlojamientos);
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  // =====================================================
  // CALCULAR DATOS CON EL MODELO DEL BACKEND
  // =====================================================

  const reservasHoy = reservas.length;

  const checkinPendientes = reservas.filter(
    (reserva) => reserva.estado === 'CHECKIN_PENDIENTE'
  ).length;

  // El backend usa EN_ESTADIA sin tilde
  const ocupacionActiva = reservas.filter(
    (reserva) => reserva.estado === 'EN_ESTADIA'
  ).length;

  const checkoutPendientes = reservas.filter(
    (reserva) => reserva.estado === 'EN_ESTADIA'
  ).length;

  // Calcular porcentaje de ocupación (disponibilidad === false significa ocupado)
  const porcentajeOcupacion = alojamientos.length > 0
      ? Math.round(
          (
            alojamientos.filter(
              (alojamiento) => alojamiento.disponibilidad === false
            ).length / alojamientos.length
          ) * 100
        )
      : 0;

  if (cargando) {
    return (
      <main className="dashboard">
        <section className="dashboard-header">
          <h2>Cargando métricas...</h2>
          <p>Obteniendo información desde la nube.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard">

      {/* =================================================
          ENCABEZADO
          ================================================= */}
      <section className="dashboard-header">
        <h2>Dashboard</h2>
        <p>
          Bienvenido a AndesStay. Rol actual: <strong>{rol}</strong>
        </p>
      </section>

      {/* =================================================
          ADMIN
          ================================================= */}
      {rol === 'Admin' && (
        <>
          <section className="kpis">
            <article className="kpi-card">
              <h3>Reservas registradas</h3>
              <strong>{reservasHoy}</strong>
            </article>
            <article className="kpi-card">
              <h3>Ocupación activa</h3>
              <strong>{porcentajeOcupacion}%</strong>
            </article>
            <article className="kpi-card">
              <h3>Check-in pendientes</h3>
              <strong>{checkinPendientes}</strong>
            </article>
            <article className="kpi-card">
              <h3>Check-out pendientes</h3>
              <strong>{checkoutPendientes}</strong>
            </article>
          </section>

          <section className="dashboard-section">
            <h2>Resumen de operaciones</h2>
            <div className="reservation-list">
              <article>
                <h3>Reservas</h3>
                <p>Actualmente existen <strong>{reservasHoy}</strong> reservas registradas.</p>
              </article>
              <article>
                <h3>Check-in pendientes</h3>
                <p>Hay <strong>{checkinPendientes}</strong> reservas esperando check-in.</p>
              </article>
              <article>
                <h3>Ocupación activa</h3>
                <p>Hay <strong>{ocupacionActiva}</strong> reservas actualmente en estadía.</p>
              </article>
            </div>
          </section>
        </>
      )}

      {/* =================================================
          RECEPCIONISTA
          ================================================= */}
      {rol === 'Recepcionista' && (
        <>
          <section className="kpis">
            <article className="kpi-card">
              <h3>Reservas registradas</h3>
              <strong>{reservasHoy}</strong>
            </article>
            <article className="kpi-card">
              <h3>Check-in pendientes</h3>
              <strong>{checkinPendientes}</strong>
            </article>
            <article className="kpi-card">
              <h3>En estadía</h3>
              <strong>{ocupacionActiva}</strong>
            </article>
            <article className="kpi-card">
              <h3>Check-out pendientes</h3>
              <strong>{checkoutPendientes}</strong>
            </article>
          </section>

          <section className="dashboard-section">
            <h2>Operaciones del día</h2>
            <div className="reservation-list">
              <article>
                <h3>Próximas llegadas</h3>
                <p>Hay <strong>{checkinPendientes}</strong> reservas con check-in pendiente.</p>
              </article>
              <article>
                <h3>Huéspedes en estadía</h3>
                <p>Actualmente hay <strong>{ocupacionActiva}</strong> reservas en estadía.</p>
              </article>
            </div>
          </section>
        </>
      )}

      {/* =================================================
          HUÉSPED
          ================================================= */}
      {rol === 'Huésped' && (
        <section className="dashboard-section">
          <h2>Mis reservas</h2>
          <div className="reservation-list">
            {reservas.length === 0 ? (
              <article>
                <h3>No tienes reservas</h3>
                <p>Todavía no existen reservas registradas.</p>
              </article>
            ) : (
              reservas.map((reserva) => (
                <article key={reserva.id}>
                  <h3>Reserva #{reserva.id}</h3>
                  <p>
                    {/* Ajustado a los nombres del backend */}
                    {reserva.nombreHabitacion} {' · '} {reserva.cantidadHuespedes} huéspedes
                  </p>
                  <span
                    className={`status ${
                      reserva.estado === 'CONFIRMADA' ? 'confirmed' :
                      reserva.estado === 'CHECKIN_PENDIENTE' ? 'pending' :
                      reserva.estado === 'EN_ESTADIA' ? 'stay' :
                      reserva.estado === 'CANCELADA' ? 'cancelled' : 'created'
                    }`}
                  >
                    {reserva.estado}
                  </span>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {/* =================================================
          AUDITOR
          ================================================= */}
      {rol === 'Auditor' && (
        <section className="dashboard-section">
          <h2>Seguimiento de operaciones</h2>
          <div className="reservation-list">
            <article>
              <h3>Timeline de reservas</h3>
              <p>Consulta los eventos registrados de las reservas.</p>
            </article>
            <article>
              <h3>Auditoría</h3>
              <p>Revisa quién creó, confirmó o modificó una reserva.</p>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}

export default Dashboard;