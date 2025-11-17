import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBrandIntelligence } from '../useBrandIntelligence';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useBrandIntelligence', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load brand intelligence successfully', async () => {
    const mockData = {
      id: 'intel_test',
      brandId: 'test',
      brandProfile: { usp: [], differentiators: [] },
      confidenceScore: 0.8
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() => useBrandIntelligence('test'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.intelligence).toEqual(mockData);
    expect(result.current.error).toBe(null);
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const { result } = renderHook(() => useBrandIntelligence('test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.intelligence).toBe(null);
    expect(result.current.error).toBe('HTTP 500: Internal Server Error');
  });

  it('should submit feedback successfully', async () => {
    const mockData = { id: 'intel_test', brandId: 'test' };
    
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    // Feedback submission
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Refresh after feedback
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() => useBrandIntelligence('test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.submitFeedback('rec_123', 'accepted');
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/brand-intelligence/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendationId: 'rec_123', action: 'accepted' })
    });
  });
});
