function Reports() {
  return (
    <main className="reports" style={{ minHeight: '80vh', padding: '40px 60px' }}>
      <section className="page-header">
        <div>
          <h2>Reportería</h2>
          <p>Indicadores y estadísticas de AndesStay</p>
        </div>
      </section>

      <section className="dashboard-section" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3 style={{ color: '#744028', fontSize: '24px' }}>Esta función está en construcción 🚧</h3>
        <p style={{ color: '#5a3b2e', marginTop: '10px' }}>
          El módulo de analítica en tiempo real estará disponible próximamente al integrar Kafka.
        </p>
      </section>
    </main>
  );
}

export default Reports;