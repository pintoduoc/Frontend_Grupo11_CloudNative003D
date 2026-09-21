import { useMsal } from "@azure/msal-react";
import { obtenerRol } from "../App";
import { useState, useEffect } from 'react';
import { fetchWithToken } from "../api"; // Importamos nuestro interceptor seguro

function Catalog() {
  const { accounts } = useMsal();
  const rol = obtenerRol(accounts);

  // Estados de la vista
  const [alojamientos, setAlojamientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  // Estado del formulario (Adaptado al modelo del backend)
  const [nuevoAlojamiento, setNuevoAlojamiento] = useState({
    nombre: '',
    direccion: '', // Nuevo campo obligatorio en el backend
    tipo: 'HABITACION', // Valor por defecto del Enum
    capacidad: '',
    precio: '' // Ahora se llama precio en el backend
  });

  // =====================================================
  // 1. CARGAR ALOJAMIENTOS (GET /api/catalog)
  // =====================================================
  const cargarAlojamientos = async () => {
    try {
      setCargando(true);
      // Llama al API Gateway -> BFF -> ms-andesstay-catalog
      const data = await fetchWithToken("/api/catalog");
      setAlojamientos(data);
    } catch (error) {
      setMensajeError("Error al cargar el catálogo de habitaciones.");
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  // Se ejecuta al montar el componente
  useEffect(() => {
    cargarAlojamientos();
  }, []);

  // =====================================================
  // MANEJAR CAMBIOS DEL FORMULARIO
  // =====================================================
  const manejarCambio = (e) => {
    setNuevoAlojamiento({
      ...nuevoAlojamiento,
      [e.target.name]: e.target.value
    });
    setMensajeError('');
  };

  // =====================================================
  // 2. CREAR ALOJAMIENTO (POST /api/catalog)
  // =====================================================
  const crearAlojamiento = async (e) => {
    e.preventDefault();
    setMensajeError('');

    if (Number(nuevoAlojamiento.capacidad) <= 0 || Number(nuevoAlojamiento.precio) <= 0) {
      setMensajeError('La capacidad y la tarifa deben ser mayores que 0.');
      return;
    }

    try {
      // Preparamos el payload exacto que espera Spring Boot
      const payload = {
        nombre: nuevoAlojamiento.nombre,
        direccion: nuevoAlojamiento.direccion,
        tipo: nuevoAlojamiento.tipo, // "HABITACION" o "CABANA"
        capacidad: Number(nuevoAlojamiento.capacidad),
        disponibilidad: true, // Por defecto disponible al crear
        precio: Number(nuevoAlojamiento.precio)
      };

      await fetchWithToken("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // Recargar la lista desde la base de datos
      await cargarAlojamientos();

      // Limpiar y cerrar formulario
      setNuevoAlojamiento({ nombre: '', direccion: '', tipo: 'HABITACION', capacidad: '', precio: '' });
      setMostrarFormulario(false);
    } catch (error) {
      setMensajeError("Error al crear el alojamiento en la nube.");
    }
  };

  // =====================================================
  // 3. CAMBIAR DISPONIBILIDAD (PUT /api/catalog/disponibilidad/{id})
  // =====================================================
  const cambiarDisponibilidad = async (id, disponibilidadActual) => {
    try {
      const nuevaDisponibilidad = !disponibilidadActual;
      
      await fetchWithToken(`/api/catalog/disponibilidad/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Enviamos el valor booleano en el cuerpo como lo espera el backend
        body: JSON.stringify(nuevaDisponibilidad) 
      });

      await cargarAlojamientos();
    } catch (error) {
      alert("No se pudo actualizar la disponibilidad.");
    }
  };

  // =====================================================
  // 4. ELIMINAR ALOJAMIENTO (DELETE /api/catalog/id/{id})
  // =====================================================
  const eliminarAlojamiento = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este alojamiento?');
    if (!confirmar) return;

    try {
      await fetchWithToken(`/api/catalog/id/${id}`, {
        method: "DELETE"
      });
      
      await cargarAlojamientos();
    } catch (error) {
      alert("No se pudo eliminar el alojamiento.");
    }
  };

  return (
    <main className="catalog">
      {/* ENCABEZADO */}
      <section className="page-header">
        <div>
          <h2>Catálogo</h2>
          <p>Gestiona los alojamientos disponibles en AndesStay</p>
        </div>
        <button onClick={() => { setMostrarFormulario(!mostrarFormulario); setMensajeError(''); }}>
          {mostrarFormulario ? 'Cerrar' : 'Nuevo alojamiento'}
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
          <h2>Crear nuevo alojamiento</h2>
          <form onSubmit={crearAlojamiento}>
            <label>Nombre</label>
            <input type="text" name="nombre" placeholder="Ej: Cabaña Valle Verde" value={nuevoAlojamiento.nombre} onChange={manejarCambio} required />

            <label>Dirección (Obligatorio en base de datos)</label>
            <input type="text" name="direccion" placeholder="Ej: Calle Los Andes 123" value={nuevoAlojamiento.direccion} onChange={manejarCambio} required />

            <label>Tipo</label>
            <select name="tipo" value={nuevoAlojamiento.tipo} onChange={manejarCambio}>
              <option value="HABITACION">Habitación</option>
              <option value="CABANA">Cabaña</option>
            </select>

            <label>Capacidad</label>
            <input type="number" name="capacidad" min="1" placeholder="Ej: 4" value={nuevoAlojamiento.capacidad} onChange={manejarCambio} required />

            <label>Tarifa por noche</label>
            <input type="number" name="precio" min="1" placeholder="Ej: 75000" value={nuevoAlojamiento.precio} onChange={manejarCambio} required />

            <button type="submit">Crear alojamiento</button>
          </form>
        </section>
      )}

      {/* LISTA DE ALOJAMIENTOS */}
      <section className="catalog-grid">
        {cargando ? (
          <p>Cargando catálogo desde la nube...</p>
        ) : alojamientos.length === 0 ? (
          <p>No hay alojamientos registrados.</p>
        ) : (
          alojamientos.map((alojamiento) => (
            <article className="catalog-card" key={alojamiento.id}>
              <h3>{alojamiento.nombre}</h3>
              <p><strong>Ubicación:</strong> {alojamiento.direccion}</p>
              <p><strong>Tipo:</strong> {alojamiento.tipo === 'CABANA' ? 'Cabaña' : 'Habitación'}</p>
              <p><strong>Capacidad:</strong> {alojamiento.capacidad} huéspedes</p>
              <p><strong>Tarifa:</strong> ${Number(alojamiento.precio).toLocaleString('es-CL')} por noche</p>

              <span className={alojamiento.disponibilidad ? 'availability available' : 'availability occupied'}>
                {alojamiento.disponibilidad ? 'DISPONIBLE' : 'OCUPADA'}
              </span>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                <button onClick={() => cambiarDisponibilidad(alojamiento.id, alojamiento.disponibilidad)}>
                  {alojamiento.disponibilidad ? 'Marcar ocupada' : 'Marcar disponible'}
                </button>
                <button onClick={() => eliminarAlojamiento(alojamiento.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default Catalog;