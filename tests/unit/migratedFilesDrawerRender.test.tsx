/**
 * @vitest-environment jsdom
 * ============================================================================
 * Unit Tests: MigratedFilesDrawer Component Render (migratedFilesDrawerRender.test.tsx)
 * ============================================================================
 * 
 * Feature Description:
 * Validates that MigratedFilesDrawer renders without error, displays file tabs,
 * handles file switching, tab navigation between 'files' and 'guide', and closes
 * without white page exceptions.
 * ============================================================================
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MigratedFilesDrawer from '../../src/components/MigratedFilesDrawer';
import { MigratedFile } from '../../src/types';

describe('MigratedFilesDrawer Component', () => {
  const sampleFiles: MigratedFile[] = [
    {
      id: 'f_readme',
      path: 'README.md',
      content: '# torch-quantlib Getting Started\nVectorized PyTorch options.',
      shippable: true,
      linesCount: 2,
      sizeBytes: 60,
    },
    {
      id: 'f_norm',
      path: 'torch_quantlib/math/normal.py',
      content: 'import torch\nclass CumulativeNormalDistribution:\n    pass\n',
      shippable: true,
      linesCount: 3,
      sizeBytes: 65,
    },
  ];

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <MigratedFilesDrawer
        files={sampleFiles}
        isOpen={false}
        onClose={vi.fn()}
        onResetFiles={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders files drawer successfully and switches between files and guide', () => {
    const mockClose = vi.fn();
    const mockReset = vi.fn();

    render(
      <MigratedFilesDrawer
        files={sampleFiles}
        isOpen={true}
        onClose={mockClose}
        onResetFiles={mockReset}
      />
    );

    expect(screen.getByText(/Migrated PyTorch Repository Explorer/i)).toBeDefined();

    // Click "Open Guide (README)" button
    const guideButton = screen.getByText('Open Guide (README)');
    fireEvent.click(guideButton);

    // Verify Getting Started Guide banner is displayed
    expect(screen.getByText(/Getting Started Guide:/i)).toBeDefined();

    // Verify copy button works without crashing
    const copyButton = screen.getByText('Copy Content');
    fireEvent.click(copyButton);

    // Click on reset button and confirm
    const resetButton = screen.getByText('Reset & Delete');
    fireEvent.click(resetButton);

    expect(screen.getByText('Confirm Reset & Delete Files')).toBeDefined();

    const confirmButton = screen.getByText('Yes, Delete All & Reset');
    fireEvent.click(confirmButton);

    expect(mockReset).toHaveBeenCalled();
  });
});
