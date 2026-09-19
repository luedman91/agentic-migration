/**
 * ============================================================================
 * Unit Tests: Virtual Repository & Folder Tree Builder (migratedFiles.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates the folder tree hierarchy generator used by the Files & Guide
 * explorer, ensuring defensive handling of empty paths, nested folders, and sorting.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { buildFolderTree } from '../../src/components/MigratedFilesDrawer';
import { MigratedFile } from '../../src/types';

describe('Migrated Files Explorer & Tree Builder', () => {
  it('handles null, undefined, or empty file lists defensively without crashing', () => {
    const emptyResult = buildFolderTree([]);
    expect(emptyResult.name).toBe('root');
    expect(emptyResult.children.length).toBe(0);

    const nullResult = buildFolderTree(null as any);
    expect(nullResult.name).toBe('root');
    expect(nullResult.children.length).toBe(0);
  });

  it('correctly builds a multi-level directory tree structure', () => {
    const sampleFiles: MigratedFile[] = [
      {
        id: 'f1',
        path: 'README.md',
        content: '# Getting Started',
        shippable: true,
      },
      {
        id: 'f2',
        path: 'torch_quantlib/__init__.py',
        content: '__version__ = "1.0.0"',
        shippable: true,
      },
      {
        id: 'f3',
        path: 'torch_quantlib/math/normal.py',
        content: 'import torch',
        shippable: true,
      },
      {
        id: 'f4',
        path: 'torch_quantlib/pricingengines/european.py',
        content: 'class EuropeanEngine: pass',
        shippable: true,
      },
    ];

    const tree = buildFolderTree(sampleFiles);

    expect(tree.children.length).toBe(2); // 'torch_quantlib' (folder) and 'README.md' (file)
    const folderNode = tree.children.find((c) => c.isFolder && c.name === 'torch_quantlib');
    const readmeNode = tree.children.find((c) => !c.isFolder && c.name === 'README.md');

    expect(folderNode).toBeDefined();
    expect(readmeNode).toBeDefined();
    expect(folderNode?.children.some((c) => c.name === 'math')).toBe(true);
    expect(folderNode?.children.some((c) => c.name === 'pricingengines')).toBe(true);
  });

  it('normalizes paths with leading slashes and prevents duplicates', () => {
    const files: MigratedFile[] = [
      { id: '1', path: '/src/main.py', content: '' },
      { id: '2', path: 'src/main.py', content: '' },
    ];

    const tree = buildFolderTree(files);
    const srcFolder = tree.children.find((c) => c.name === 'src');
    expect(srcFolder).toBeDefined();
    expect(srcFolder?.children.length).toBe(1); // deduplicated
  });
});
