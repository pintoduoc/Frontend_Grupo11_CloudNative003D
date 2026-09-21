import { useMsal } from "@azure/msal-react";
import { obtenerRol } from "../App";
import { useState, useEffect } from 'react';
import { fetchWithToken } from "../api"; // Importamos el interceptor seguro

function Reservations() {
  const { accounts } = useMsal();
  const rol = obtenerRol(accounts);

  const puedeGestionarEstados = rol === 'Admin' || rol === 'Recepcionista';

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(true);

  // Estado para la lista de reservas traídas de la nube
  const [reservas, setReservas] = useState([]);

  // Estado del formulario alineado al modelo de Spring Boot
  const [nuevaReserva, setNuevaReserva] = useState({
    nombreHuesped: '',
    nombreHabitacion: '',
    fechaInicio: '',
    fechaTermino: '',
    cantidadHuespedes: ''
  });

  // =====================================================
  // 1. CARGAR RESERVAS DESDE EL BACKEND (GET /api/reservations)
  // =====================================================
  const cargarReservas = async () => {
    try {
      setCargando(true);
      const data = await fetchWithToken("/api/reservations");
      setReservas(data);
    } catch (error) {
      setMensajeError("Error al cargar las reservas desde la nube.");
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarReservas();
  }, []);

  // =====================================================
  // OBTENER FECHA ACTUAL (Para validaciones del form)
  // =====================================================
  const obtenerFechaHoy = () => {
    const ahora = new Date();
    const diferenciaZona = ahora.getTimezoneOffset() * 60000;
    return new Date(ahora.getTime() - diferenciaZona).toISOString().split('T')[0];
  };

  // =====================================================
  // MANEJAR CAMBIOS DEL FORMULARIO
  // =====================================================
  const manejarCambio = (e) => {
    setNuevaReserva({
      ...nuevaReserva,
      [e.target.name]: e.target.value
    });
    setMensajeError('');
  };

  // =====================================================
  // 2. CREAR RESERVA (POST /api/reservations)
  // =====================================================
  const crearReserva = async (e) => {
    e.preventDefault();
    setMensajeError('');

    const hoy = obtenerFechaHoy();

    if (nuevaReserva.fechaInicio < hoy) {
      setMensajeError('La fecha de entrada no puede ser anterior a la fecha actual.');
      return;
    }

    if (nuevaReserva.fechaTermino <= nuevaReserva.fechaInicio) {
      setMensajeError('La fecha de salida debe ser posterior a la fecha de entrada.');
      return;
    }

    try {
      // Payload alineado con Reserva.java
      const payload = {
        estado: "CREADA", // Estado inicial
        nombreHabitacion: nuevaReserva.nombreHabitacion,
        nombreHuesped: nuevaReserva.nombreHuesped,
        detalles: `Reserva creada por ${rol}`, // Campo opcional
        cantidadHuespedes: Number(nuevaReserva.cantidadHuespedes),
        // Convertimos las fechas a formato ISO para que Spring Boot las procese correctamente
        fechaInicio: new Date(`${nuevaReserva.fechaInicio}T00:00:00`).toISOString(),
        fechaTermino: new Date(`${nuevaReserva.fechaTermino}T00:00:00`).toISOString()
      };

      await fetchWithToken("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // Recargamos la tabla
      await cargarReservas();

      // Limpiamos y cerramos
      setNuevaReserva({ nombreHuesped: '', nombreHabitacion: '', fechaInicio: '', fechaTermino: '', cantidadHuespedes: '' });
      setMostrarFormulario(false);
    } catch (error) {
      setMensajeError("Error al crear la reserva en la nube.");
    }
  };

  // =====================================================
  // 3. CAMBIAR ESTADO (PUT /api/reservations/estado/{id})
  // =====================================================
  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      // El controlador de Spring Boot espera un PUT con el estado en el cuerpo
      await fetchWithToken(`/api/reservations/estado/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Enviamos el string entre comillas, ej: "CONFIRMADA"
        body: `"${nuevoEstado}"` 
      });

      await cargarReservas();
    } catch (error) {
      alert("No se pudo actualizar el estado de la reserva.");
    }
  };

  // =====================================================
  // 4. CANCELAR / ELIMINAR RESERVA (DELETE /api/reservations/id/{id})
  // =====================================================
  const cancelarReserva = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas cancelar esta reserva?');
    if (!confirmar) return;

    try {
      // Podrías cambiar el estado a CANCELADA, o eliminar el registro como lo hace este método
      await fetchWithToken(`/api/reservations/id/${id}`, {
        method: "DELETE"
      });
      await cargarReservas();
    } catch (error) {
      alert("No se pudo cancelar la reserva.");
    }
  };

  // =====================================================
  // MOSTRAR FECHA FORMATEADA
  // =====================================================
  const mostrarFecha = (fechaString) => {
    if (!fechaString) return '';
    // Extrae la porción de la fecha del ISO string (ej. "2026-09-20T00:00:00.000+00:00")
    const datePart = fechaString.split('T')[0]; 
    const partes = datePart.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // =====================================================
  // CLASE DEL ESTADO
  // =====================================================
  const obtenerClaseEstado = (estado) => {
    switch(estado) {
      case 'CONFIRMADA': return 'confirmed';
      case 'CHECKIN_PENDIENTE': return 'pending';
      case 'EN_ESTADIA': return 'stay'; // Ajustado sin tilde
      case 'CHECKOUT': return 'confirmed';
      case 'CANCELADA': return 'cancelled';
      default: return 'created';
    }
  };

  return (
    <main className="reservations">
      {/* ENCABEZADO */}
      <section className="page-header">
        <div>
          <h2>Reservas</h2>
          <p>Gestiona las reservas de AndesStay</p>
        </div>
        <button onClick={() => { setMostrarFormulario(!mostrarFormulario); setMensajeError(''); }}>
          {mostrarFormulario ? 'Cerrar' : 'Nueva reserva'}
        </button>
      </section>

      {/* MENSAJE DE ERROR */}
      {mensajeError && (
        <section className="reservation-form">
          <p style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '12px', borderRadius: '6px', margin: 0 }}>
            {mensajeError}
          </p>
        </section>
      )}

      {/* FORMULARIO */}
      {mostrarFormulario && (
        <section className="reservation-form">
          <h2>Crear nueva reserva</h2>
          <form onSubmit={crearReserva}>
            <label>Huésped</label>
            <input type="text" name="nombreHuesped" value={nuevaReserva.nombreHuesped} onChange={manejarCambio} required />

            <label>Alojamiento</label>
            <input type="text" name="nombreHabitacion" value={nuevaReserva.nombreHabitacion} onChange={manejarCambio} required />

            <label>Fecha de entrada</label>
            <input type="date" name="fechaInicio" value={nuevaReserva.fechaInicio} onChange={manejarCambio} min={obtenerFechaHoy()} required />

            <label>Fecha de salida</label>
            <input type="date" name="fechaTermino" value={nuevaReserva.fechaTermino} onChange={manejarCambio} min={nuevaReserva.fechaInicio || obtenerFechaHoy()} required />

            <label>Cantidad de huéspedes</label>
            <input type="number" name="cantidadHuespedes" min="1" value={nuevaReserva.cantidadHuespedes} onChange={manejarCambio} required />

            <button type="submit">Crear reserva</button>
          </form>
        </section>
      )}

      {/* TABLA */}
      <section className="reservation-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Huésped</th>
              <th>Alojamiento</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Huéspedes</th>
              <th>Estado</th>
              {puedeGestionarEstados && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="8">Cargando reservas desde la nube...</td></tr>
            ) : reservas.length === 0 ? (
              <tr><td colSpan="8">No hay reservas registradas.</td></tr>
            ) : (
              reservas.map((reserva) => (
                <tr key={reserva.id}>
                  <td>#{reserva.id}</td>
                  <td>{reserva.nombreHuesped}</td>
                  <td>{reserva.nombreHabitacion}</td>
                  <td>{mostrarFecha(reserva.fechaInicio)}</td>
                  <td>{mostrarFecha(reserva.fechaTermino)}</td>
                  <td>{reserva.cantidadHuespedes}</td>
                  <td>
                    <span className={`status ${obtenerClaseEstado(reserva.estado)}`}>
                      {reserva.estado}
                    </span>
                  </td>

                  {/* ACCIONES */}
                  {puedeGestionarEstados && (
                    <td>
                      {reserva.estado === 'CREADA' && (
                        <button onClick={() => cambiarEstado(reserva.id, 'CONFIRMADA')}>
                          Confirmar
                        </button>
                      )}

                      {reserva.estado === 'CONFIRMADA' && (
                        <button onClick={() => cambiarEstado(reserva.id, 'CHECKIN_PENDIENTE')}>
                          Preparar check-in
                        </button>
                      )}

                      {reserva.estado === 'CHECKIN_PENDIENTE' && (
                        <button onClick={() => cambiarEstado(reserva.id, 'EN_ESTADIA')}>
                          Realizar check-in
                        </button>
                      )}

                      {reserva.estado === 'EN_ESTADIA' && (
                        <button onClick={() => cambiarEstado(reserva.id, 'CHECKOUT')}>
                          Realizar check-out
                        </button>
                      )}

                      {(reserva.estado === 'CREADA' || reserva.estado === 'CONFIRMADA') && (
                        <button onClick={() => cancelarReserva(reserva.id)}>
                          Cancelar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default Reservations;