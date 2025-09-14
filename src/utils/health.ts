import { DatabaseUtils } from './database';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
    };
  };
}

export class HealthChecker {
  /**
   * Verificar system health
   */
  static async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const services = {
      database: await this.checkDatabaseHealth()
    };

    const status = services.database.status === 'up' ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp,
      services
    };
  }

  /**
   * Verificar healthCheck do database com tempo de resposta
   */
  private static async checkDatabaseHealth(): Promise<{ status: 'up' | 'down'; responseTime?: number }> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await DatabaseUtils.healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        status: isHealthy ? 'up' : 'down',
        responseTime
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime
      };
    }
  }
}