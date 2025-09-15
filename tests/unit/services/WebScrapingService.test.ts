import { WebScrapingService } from '../../../src/services/WebScrapingService';
import { ValidationError, ProcessingError } from '../../../src/utils/errors';
import axios from 'axios';

// Mock do axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('WebScrapingService', () => {
  let webScrapingService: WebScrapingService;

  beforeEach(() => {
    webScrapingService = new WebScrapingService();
    jest.clearAllMocks();
  });

  describe('validateURL', () => {
    it('should return false for invalid URL format', async () => {
      const result = await webScrapingService.validateURL('not-a-url');
      expect(result).toBe(false);
    });

    it('should return false for localhost URLs', async () => {
      const result = await webScrapingService.validateURL('http://localhost:3000');
      expect(result).toBe(false);
    });

    it('should return false for private IP URLs', async () => {
      const result = await webScrapingService.validateURL('http://192.168.1.1');
      expect(result).toBe(false);
    });

    it('should return true for valid accessible URL', async () => {
      mockAxios.head.mockResolvedValue({
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8'
        }
      } as any);

      const result = await webScrapingService.validateURL('https://example.com');
      expect(result).toBe(true);
      expect(mockAxios.head).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          timeout: 30000,
          maxRedirects: 5
        })
      );
    });

    it('should return false for non-HTML content type', async () => {
      mockAxios.head.mockResolvedValue({
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      } as any);

      const result = await webScrapingService.validateURL('https://api.example.com');
      expect(result).toBe(false);
    });

    it('should return false when request fails', async () => {
      mockAxios.head.mockRejectedValue(new Error('Network error'));

      const result = await webScrapingService.validateURL('https://nonexistent.com');
      expect(result).toBe(false);
    });
  });

  describe('scrapeURL', () => {
    const mockHtmlResponse = {
      status: 200,
      data: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Page Title</title>
        </head>
        <body>
          <main>
            <h1>Main Heading</h1>
            <p>This is the main content of the page.</p>
            <p>Another paragraph with more content.</p>
          </main>
          <script>console.log('script');</script>
        </body>
        </html>
      `
    };

    beforeEach(() => {
      mockAxios.get.mockResolvedValue(mockHtmlResponse);
    });

    it('should throw ValidationError for empty URL', async () => {
      await expect(
        webScrapingService.scrapeURL('')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string URL', async () => {
      await expect(
        webScrapingService.scrapeURL(null as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should successfully scrape valid URL', async () => {
      const result = await webScrapingService.scrapeURL('https://example.com');

      expect(result).toEqual({
        title: 'Test Page Title',
        content: expect.stringContaining('Main Heading'),
        url: 'https://example.com'
      });

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          timeout: 30000,
          maxRedirects: 5,
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('DocuLink-WebScraper')
          })
        })
      );
    });

    it('should add https protocol to URL without protocol', async () => {
      await webScrapingService.scrapeURL('example.com');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://example.com',
        expect.any(Object)
      );
    });

    it('should extract title from h1 when title tag is empty', async () => {
      const htmlWithoutTitle = {
        ...mockHtmlResponse,
        data: `
          <html>
          <head><title></title></head>
          <body>
            <h1>Page Heading</h1>
            <p>Content here</p>
          </body>
          </html>
        `
      };

      mockAxios.get.mockResolvedValue(htmlWithoutTitle);

      const result = await webScrapingService.scrapeURL('https://example.com');
      expect(result.title).toBe('Page Heading');
    });

    it('should use domain as fallback title', async () => {
      const htmlWithoutTitleOrH1 = {
        ...mockHtmlResponse,
        data: `
          <html>
          <body>
            <p>Just some content without title</p>
          </body>
          </html>
        `
      };

      mockAxios.get.mockResolvedValue(htmlWithoutTitleOrH1);

      const result = await webScrapingService.scrapeURL('https://example.com');
      expect(result.title).toBe('Content from example.com');
    });

    it('should remove script and style tags from content', async () => {
      const result = await webScrapingService.scrapeURL('https://example.com');

      expect(result.content).not.toContain('console.log');
      expect(result.content).toContain('Main Heading');
      expect(result.content).toContain('main content');
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.message = 'timeout of 30000ms exceeded';
      mockAxios.get.mockRejectedValue(timeoutError);

      await expect(
        webScrapingService.scrapeURL('https://slow-site.com')
      ).rejects.toThrow(ProcessingError);
    });

    it('should handle 404 errors', async () => {
      const notFoundError = {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: 'Not Found'
        }
      };
      mockAxios.isAxiosError.mockReturnValue(true);
      mockAxios.get.mockRejectedValue(notFoundError);

      await expect(
        webScrapingService.scrapeURL('https://example.com/nonexistent')
      ).rejects.toThrow(ValidationError);
    });

    it('should handle 403 forbidden errors', async () => {
      const forbiddenError = {
        isAxiosError: true,
        response: {
          status: 403,
          statusText: 'Forbidden'
        }
      };
      mockAxios.isAxiosError.mockReturnValue(true);
      mockAxios.get.mockRejectedValue(forbiddenError);

      await expect(
        webScrapingService.scrapeURL('https://protected-site.com')
      ).rejects.toThrow(ValidationError);
    });

    it('should handle DNS resolution errors', async () => {
      const dnsError = {
        isAxiosError: true,
        code: 'ENOTFOUND'
      };
      mockAxios.isAxiosError.mockReturnValue(true);
      mockAxios.get.mockRejectedValue(dnsError);

      await expect(
        webScrapingService.scrapeURL('https://nonexistent-domain.com')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ProcessingError when no content can be extracted', async () => {
      const emptyHtml = {
        ...mockHtmlResponse,
        data: '<html><body></body></html>'
      };

      mockAxios.get.mockResolvedValue(emptyHtml);

      await expect(
        webScrapingService.scrapeURL('https://empty-page.com')
      ).rejects.toThrow(ProcessingError);
    });

    it('should truncate very long content', async () => {
      const longContent = 'a'.repeat(1000001); // Longer than maxContentLength
      const htmlWithLongContent = {
        ...mockHtmlResponse,
        data: `<html><body><p>${longContent}</p></body></html>`
      };

      mockAxios.get.mockResolvedValue(htmlWithLongContent);

      const result = await webScrapingService.scrapeURL('https://long-page.com');

      expect(result.content).toHaveLength(1000000 + '... [content truncated]'.length);
      expect(result.content).toMatch(/\.\.\. \[content truncated\]$/);
    });
  });

  describe('getServiceInfo', () => {
    it('should return service configuration', () => {
      const info = webScrapingService.getServiceInfo();

      expect(info).toEqual({
        timeout: 30000,
        maxContentLength: 1000000,
        userAgent: expect.stringContaining('DocuLink-WebScraper'),
        maxRedirects: 5
      });
    });
  });

  describe('testConnectivity', () => {
    it('should return true when connectivity test passes', async () => {
      mockAxios.head.mockResolvedValue({
        status: 200,
        headers: { 'content-type': 'text/html' }
      } as any);

      const result = await webScrapingService.testConnectivity();
      expect(result).toBe(true);
    });

    it('should return false when connectivity test fails', async () => {
      mockAxios.head.mockRejectedValue(new Error('Network error'));

      const result = await webScrapingService.testConnectivity();
      expect(result).toBe(false);
    });
  });
});