/**
 * @vitest-environment jsdom
 * ============================================================================
 * Unit Tests: Pytest & Test Suite Runner Hook (useTestRunner.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates the test runner hook: execution lifecycle, pass rate calculations,
 * single test runs, batch suite execution, and test insertion.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTestRunner } from '../../src/hooks/useTestRunner';
import { DEFAULT_PROJECT_CONFIG } from '../../src/config/appConfig';
import { UnitTestResult } from '../../src/types';

describe('useTestRunner Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('initializes with test suite and metrics', () => {
    const { result } = renderHook(() => useTestRunner(DEFAULT_PROJECT_CONFIG));

    expect(result.current.tests.length).toBeGreaterThan(0);
    expect(result.current.metrics.total).toBe(result.current.tests.length);
    expect(result.current.metrics.passRate).toBeGreaterThanOrEqual(0);
    expect(result.current.metrics.shippableTestsCount).toBeGreaterThan(0);
  });

  it('runs an individual test and updates its status to passed', async () => {
    const { result } = renderHook(() => useTestRunner(DEFAULT_PROJECT_CONFIG));
    const testId = result.current.tests[0].id;

    let runPromise: Promise<void>;
    act(() => {
      runPromise = result.current.runTest(testId);
    });

    // Advance fake timers
    await act(async () => {
      vi.advanceTimersByTime(500);
      await runPromise;
    });

    const target = result.current.tests.find((t) => t.id === testId);
    expect(target?.status).toBe('passed');
    expect(target?.speedup).toBeGreaterThan(0);
  });

  it('runs all tests in batch mode', async () => {
    const { result } = renderHook(() => useTestRunner(DEFAULT_PROJECT_CONFIG));

    let runAllPromise: Promise<void>;
    act(() => {
      runAllPromise = result.current.runAllTests();
    });

    expect(result.current.isRunningAll).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await runAllPromise;
    });

    expect(result.current.isRunningAll).toBe(false);
    expect(result.current.metrics.passRate).toBe(100);
  });

  it('adds a new integration test into the suite', () => {
    const { result } = renderHook(() => useTestRunner(DEFAULT_PROJECT_CONFIG));

    const newTest = {
      id: 'custom-integration-test',
      name: 'test_custom_engine_integration',
      suite: 'Custom Integration',
      category: 'integration' as const,
      shippable: true,
      status: 'passed' as const,
      targetNodeId: 'engine_1',
      targetSymbol: 'CustomEngine',
      testCodeSnippet: 'def test_custom(): assert True',
      lastRunAt: new Date().toISOString(),
      tolerance: 1e-7,
      maxObservedDiff: 1e-10,
      quantLibExecutionTimeMs: 12,
      torchExecutionTimeMs: 1.5,
      speedup: 8.0,
      assertionsCount: 5,
      sampleInput: 'spot=100',
      qlExpected: '10.5',
      torchActual: '10.5',
    } as UnitTestResult;

    act(() => {
      result.current.addTest(newTest);
    });

    expect(result.current.tests.some((t) => t.id === 'custom-integration-test')).toBe(true);
  });

  it('resets tests back to designated preset', () => {
    const { result } = renderHook(() => useTestRunner(DEFAULT_PROJECT_CONFIG));

    act(() => {
      result.current.resetTests('default');
    });

    expect(result.current.tests.length).toBeGreaterThan(0);

    act(() => {
      result.current.resetTests('massive_enterprise_150_dag');
    });

    expect(result.current.tests.length).toBeGreaterThan(0);
  });
});
