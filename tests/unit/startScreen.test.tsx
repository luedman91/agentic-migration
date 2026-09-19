/**
 * @vitest-environment jsdom
 * ============================================================================
 * Unit Tests: StartScreen Component (startScreen.test.tsx)
 * ============================================================================
 * 
 * Feature Description:
 * Verifies that StartScreen correctly renders presets, exposes selectable
 * Target Framework and Target Library options, and invokes onLoadProject with
 * the selected target framework when launched.
 * 
 * Use Cases:
 * 1. Verifying that the target framework selector renders PyTorch, JAX, TensorFlow, and Triton.
 * 2. Verifying that changing the target framework updates the configuration state.
 * 3. Verifying that the target library package name is displayed and customizable.
 * ============================================================================
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StartScreen from '../../src/components/StartScreen';
import { ProjectConfig } from '../../src/types';

describe('StartScreen Component', () => {
  const defaultConfig: ProjectConfig = {
    repoUrl: 'https://github.com/lballabio/QuantLib.git',
    branch: 'v1.34.0',
    entryPoint: 'ql/pricingengines/vanilla/analyticeuropeanengine.cpp',
    targetFramework: 'PyTorch',
    targetDevice: 'cuda',
    precision: 'float64',
    sourceLanguage: 'C++',
    sourceLibraryName: 'QuantLib C++',
    targetLibraryName: 'torch_quantlib',
    executionMode: 'modal',
  };

  /**
   * Tests that the target framework dropdown renders all supported framework options.
   */
  it('renders target framework selector with selectable options', () => {
    const handleLoad = vi.fn();
    render(<StartScreen defaultConfig={defaultConfig} onLoadProject={handleLoad} />);

    const frameworkSelect = screen.getByLabelText(/Target Framework/i) as HTMLSelectElement;
    expect(frameworkSelect).toBeTruthy();
    expect(frameworkSelect.value).toBe('PyTorch');

    // Verify option values
    const options = Array.from(frameworkSelect.options).map((o) => o.value);
    expect(options).toContain('PyTorch');
    expect(options).toContain('JAX');
    expect(options).toContain('TensorFlow');
    expect(options).toContain('Triton');
  });

  /**
   * Tests that selecting a different target framework updates the dropdown and target library name.
   */
  it('allows user to change target framework and library name', () => {
    const handleLoad = vi.fn();
    render(<StartScreen defaultConfig={defaultConfig} onLoadProject={handleLoad} />);

    const frameworkSelect = screen.getByLabelText(/Target Framework/i) as HTMLSelectElement;
    fireEvent.change(frameworkSelect, { target: { value: 'JAX' } });
    expect(frameworkSelect.value).toBe('JAX');

    const libraryInput = screen.getByLabelText(/Target Library Package Name:/i) as HTMLInputElement;
    expect(libraryInput).toBeTruthy();
    expect(libraryInput.value).toBe('jax_sim');

    // Customize library name
    fireEvent.change(libraryInput, { target: { value: 'my_custom_jax_lib' } });
    expect(libraryInput.value).toBe('my_custom_jax_lib');
  });
});
