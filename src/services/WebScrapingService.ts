/**
 * WebScrapingService - Serviço para extração de conteúdo de páginas web
 * Faz scraping de URLs e extrai título, conteúdo e metadados
 */

import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { IWebScrapingService, WebScrapingResult } from './DocumentService';
import { ProcessingError, ValidationError } from '../utils/errors';

export class WebScrapingService implements IWebScrapingService {
  private readonly timeout: number;
  private readonly maxContentLength: number;
  private readonly userAgent: string;
  private readonly maxRedirects: number;

  constructor() {
    this.timeout = 30000; // 30 segundos
    this.maxContentLength = 1000000; // 1MB de texto
    this.userAgent = 'DocuLink-WebScraper/1.0 (+https://github.com/doculink/api)';
    this.maxRedirects = 5;
  }

  /**
   * Faz scraping de uma URL e extrai o conteúdo
   */
  async scrapeURL(url: string): Promise<WebScrapingResult> {
    try {
      // Validar URL básica
      if (!url || typeof url !== 'string') {
        throw new ValidationError('URL is required and must be a string');
      }

      const normalizedUrl = this.normalizeURL(url);

      // Fazer requisição HTTP
      const response = await this.fetchURL(normalizedUrl);

      // Validar resposta
      if (!response.data || typeof response.data !== 'string') {
        throw new ProcessingError('Invalid response content from URL');
      }

      // Extrair conteúdo usando Cheerio
      const extractedData = this.extractContent(response.data, normalizedUrl);

      return {
        title: extractedData.title,
        content: extractedData.content,
        url: normalizedUrl
      };

    } catch (error) {
      if (error instanceof ValidationError || error instanceof ProcessingError) {
        throw error;
      }

      // Log do erro para debugging
      console.error('Web scraping error:', error);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new ValidationError('URL is not accessible or does not exist');
        }
        if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
          throw new ProcessingError('Request timeout - URL took too long to respond');
        }
        if (error.response?.status === 404) {
          throw new ValidationError('URL not found (404)');
        }
        if (error.response?.status === 403) {
          throw new ValidationError('Access forbidden (403) - URL blocks web scraping');
        }
        if (error.response?.status && error.response.status >= 400) {
          throw new ValidationError(`HTTP error ${error.response.status}: ${error.response.statusText}`);
        }
      }

      throw new ProcessingError('Failed to scrape web page', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Valida se uma URL é acessível
   */
  async validateURL(url: string): Promise<boolean> {
    try {
      // Validação básica de formato
      if (!this.isValidURLFormat(url)) {
        return false;
      }

      const normalizedUrl = this.normalizeURL(url);

      // Fazer uma requisição HEAD para verificar acessibilidade
      const response = await axios.head(normalizedUrl, {
        timeout: this.timeout,
        maxRedirects: this.maxRedirects,
        headers: {
          'User-Agent': this.userAgent
        },
        validateStatus: (status) => status < 500 // Aceitar códigos < 500
      });

      // Verificar se o content-type é HTML
      const contentType = response.headers['content-type'] || '';
      return contentType.includes('text/html') || contentType.includes('application/xhtml');

    } catch (error) {
      console.error('URL validation error:', error);
      return false;
    }
  }

  /**
   * Normaliza a URL adicionando protocolo se necessário
   */
  private normalizeURL(url: string): string {
    let normalized = url.trim();

    // Adicionar protocolo se não tiver
    if (!normalized.match(/^https?:\/\//)) {
      normalized = `https://${normalized}`;
    }

    return normalized;
  }

  /**
   * Valida formato básico da URL
   */
  private isValidURLFormat(url: string): boolean {
    try {
      const normalizedUrl = this.normalizeURL(url);
      const urlObj = new URL(normalizedUrl);
      
      // Verificar se é HTTP ou HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Verificar se tem hostname
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        return false;
      }

      // Verificar se não é localhost ou IP privado (opcional, para segurança)
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Faz a requisição HTTP para a URL
   */
  private async fetchURL(url: string): Promise<AxiosResponse<string>> {
    return await axios.get(url, {
      timeout: this.timeout,
      maxRedirects: this.maxRedirects,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      responseType: 'text',
      maxContentLength: this.maxContentLength * 2, // Permitir HTML maior que o texto final
      validateStatus: (status) => status >= 200 && status < 300
    });
  }

  /**
   * Extrai conteúdo da página HTML usando Cheerio
   */
  private extractContent(html: string, url: string): { title: string; content: string } {
    const $ = cheerio.load(html);

    // Extrair título
    const title = this.extractTitle($, url);

    // Extrair conteúdo principal
    const content = this.extractMainContent($);

    return { title, content };
  }

  /**
   * Extrai título da página
   */
  private extractTitle($: cheerio.CheerioAPI, url: string): string {
    // Tentar diferentes seletores para título
    const titleSelectors = [
      'title',
      'h1',
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      '.title',
      '.page-title',
      'header h1'
    ];

    for (const selector of titleSelectors) {
      let titleText = '';

      if (selector.startsWith('meta')) {
        titleText = $(selector).attr('content') || '';
      } else {
        titleText = $(selector).first().text().trim();
      }

      if (titleText && titleText.length >= 3 && titleText.length <= 200) {
        return this.sanitizeText(titleText);
      }
    }

    // Fallback: usar domínio da URL
    try {
      const urlObj = new URL(url);
      return `Content from ${urlObj.hostname}`;
    } catch {
      return 'Web Page Content';
    }
  }

  /**
   * Extrai conteúdo principal da página
   */
  private extractMainContent($: cheerio.CheerioAPI): string {
    // Remover elementos indesejados
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar, .menu, .navigation').remove();

    // Tentar diferentes seletores para conteúdo principal
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      '#content',
      '#main',
      '.container',
      'body'
    ];

    let bestContent = '';
    let maxLength = 0;

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > maxLength) {
          maxLength = text.length;
          bestContent = text;
        }
      }
    }

    // Se não encontrou conteúdo suficiente, usar todo o texto da página
    if (bestContent.length < 100) {
      bestContent = $('body').text().trim();
    }

    // Limpar e validar conteúdo
    const cleanContent = this.sanitizeContent(bestContent);

    if (!cleanContent || cleanContent.length === 0) {
      throw new ProcessingError('No meaningful content could be extracted from the web page');
    }

    return cleanContent;
  }

  /**
   * Sanitiza texto removendo caracteres indesejados
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Múltiplos espaços em um só
      .replace(/[\r\n\t]/g, ' ') // Quebras de linha e tabs em espaços
      .trim();
  }

  /**
   * Sanitiza conteúdo completo
   */
  private sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    let sanitized = content
      // Remover múltiplas quebras de linha
      .replace(/\n{3,}/g, '\n\n')
      // Remover múltiplos espaços
      .replace(/[ \t]{2,}/g, ' ')
      // Remover caracteres de controle (exceto quebras de linha e tabs)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Trim geral
      .trim();

    // Limitar tamanho do conteúdo
    if (sanitized.length > this.maxContentLength) {
      sanitized = sanitized.substring(0, this.maxContentLength) + '... [content truncated]';
    }

    return sanitized;
  }

  /**
   * Obtém informações sobre o serviço
   */
  getServiceInfo(): {
    timeout: number;
    maxContentLength: number;
    userAgent: string;
    maxRedirects: number;
  } {
    return {
      timeout: this.timeout,
      maxContentLength: this.maxContentLength,
      userAgent: this.userAgent,
      maxRedirects: this.maxRedirects
    };
  }

  /**
   * Testa conectividade com uma URL de teste
   */
  async testConnectivity(): Promise<boolean> {
    try {
      // Testar com uma URL confiável
      const testUrl = 'https://httpbin.org/html';
      const result = await this.validateURL(testUrl);
      return result;
    } catch {
      return false;
    }
  }
}