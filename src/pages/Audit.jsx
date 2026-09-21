function Audit() {
  return (
    <main className="audit" style={{ minHeight: '80vh', padding: '40px 60px' }}>
      <section className="page-header">
        <div>
          <h2>Auditoría</h2>
          <p>Historial de eventos de AndesStay</p>
        </div>
      </section>

      <section className="dashboard-section" style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #ffdce5' }}>
        <h3 style={{ color: '#744028', fontSize: '24px' }}>Esta función está en construcción 🚧</h3>
        <p style={{ color: '#5a3b2e', marginTop: '10px' }}>
          El timeline de auditoría estará disponible próximamente al integrar el stream de eventos.
        </p>
      </section>
    </main>
  );
}

export default Audit;