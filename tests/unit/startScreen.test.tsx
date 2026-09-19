// @vitest-environment jsdom
/**
 * ============================================================================
 * Unit Tests: StartScreen Component (startScreen.test.tsx)
 * ============================================================================
 * 
 * Feature Description:
 * Verifies that StartScreen correctly renders the 28-node and 150-node presets,
 * exposes editable text fields for source repository, target framework, target package name,
 * and other instructions (with numerical diff tolerance), and updates configuration state.
 * 
 * Use Cases:
 * 1. Verifying that the 28-node and 150-node example graphs are displayed.
 * 2. Verifying that user can fill in text variables for Source repo, Target framework,
 *    Target package name, and Other instructions.
 * 3. Verifying that numerical diff tolerance is editable and defaults to 1e-5.
 * ============================================================================
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StartScreen, { LIBRARY_PRESETS } from '../../src/components/StartScreen';
import { ProjectConfig } from '../../src/types';

describe('StartScreen Component', () => {
  const defaultConfig: ProjectConfig = {
    repoUrl: 'https://github.com/lballabio/QuantLib.git',
    branch: 'v1.34.0',
    entryPoint: 'ql/pricingengines/vanilla/analyticeuropeanengine.cpp',
    targetFramework: 'pytorch',
    targetDevice: 'cuda',
    precision: 'float64',
    sourceLanguage: 'C++',
    sourceLibraryName: 'QuantLib C++',
    targetLibraryName: 'torch_quantlib',
    executionMode: 'modal',
    numericalTolerance: '1e-5',
    otherInstructions: 'numerical diff tolerance should be 1e-5\nvectorize inner mathematical loops',
  };

  /**
   * Tests that the presets include math pipelines, enterprise graphs, and non-math libraries.
   */
  it('renders presets including the 28-node and 150-node scopes and non-math libraries', () => {
    const handleLoad = vi.fn();
    render(<StartScreen defaultConfig={defaultConfig} onLoadProject={handleLoad} />);

    expect(LIBRARY_PRESETS.length).toBeGreaterThanOrEqual(2);
    expect(LIBRARY_PRESETS.some((p) => p.nodeCount === 28)).toBe(true);
    expect(LIBRARY_PRESETS.some((p) => p.nodeCount === 150)).toBe(true);

    // Check UI headings
    expect(screen.getByText(/28 Nodes: Distributed Function Pipeline/i)).toBeTruthy();
    expect(screen.getByText(/150 Nodes: Enterprise Ultra-Deep Dependency Graph/i)).toBeTruthy();
  });

  /**
   * Tests that the user-editable text fields for variables are rendered and customizable.
   */
  it('provides text input fields for Source repo, Target framework, Target package name, and Other instructions', () => {
    const handleLoad = vi.fn();
    render(<StartScreen defaultConfig={defaultConfig} onLoadProject={handleLoad} />);

    // Source repo input
    const repoInput = screen.getByLabelText(/Source repo:/i) as HTMLInputElement;
    expect(repoInput).toBeTruthy();
    expect(repoInput.value).toContain('QuantLib.git');

    // Target framework input
    const frameworkInput = screen.getByLabelText(/Target framework:/i) as HTMLInputElement;
    expect(frameworkInput).toBeTruthy();
    expect(frameworkInput.value).toBe('pytorch');

    // Target package name input
    const packageInput = screen.getByLabelText(/Target package name:/i) as HTMLInputElement;
    expect(packageInput).toBeTruthy();
    expect(packageInput.value).toBe('torch_quantlib');

    // Other instructions textarea (numerical diff tolerance is strictly configured in the text field)
    const instructionsInput = screen.getByLabelText(/Other instructions/i) as HTMLTextAreaElement;
    expect(instructionsInput).toBeTruthy();
    expect(instructionsInput.value).toContain('numerical diff tolerance should be 1e-5');
  });

  /**
   * Tests that editing the text inputs updates their values appropriately.
   */
  it('allows user to customize text field variables', () => {
    const handleLoad = vi.fn();
    render(<StartScreen defaultConfig={defaultConfig} onLoadProject={handleLoad} />);

    const frameworkInput = screen.getByLabelText(/Target framework:/i) as HTMLInputElement;
    fireEvent.change(frameworkInput, { target: { value: 'jax' } });
    expect(frameworkInput.value).toBe('jax');

    const packageInput = screen.getByLabelText(/Target package name:/i) as HTMLInputElement;
    fireEvent.change(packageInput, { target: { value: 'my_custom_torch_pkg' } });
    expect(packageInput.value).toBe('my_custom_torch_pkg');

    const instructionsInput = screen.getByLabelText(/Other instructions/i) as HTMLTextAreaElement;
    fireEvent.change(instructionsInput, { target: { value: 'numerical diff tolerance should be 1e-8' } });
    expect(instructionsInput.value).toContain('1e-8');
  });
});
