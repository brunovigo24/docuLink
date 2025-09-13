// Teste básico para verificar a configuração
describe('Configuration Setup', () => {
  it('should have proper test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have test database configuration', () => {
    expect(process.env.DB_NAME).toBe('document_processing_test');
  });
});