import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Mongoose models before importing the service that uses them
vi.mock('../../src/models/Material.js', () => ({
  Material: { findOne: vi.fn() },
}));
vi.mock('../../src/models/UsageEntry.js', () => ({
  UsageEntry: { findOne: vi.fn(), find: vi.fn(), create: vi.fn() },
}));

import { Material } from '../../src/models/Material.js';
import { UsageEntry } from '../../src/models/UsageEntry.js';
import { logUsage } from '../../src/services/usage.service.js';

function fakeMaterial(currentStock: number) {
  const mat = {
    _id: 'mat1',
    currentStock,
    save: vi.fn(async function (this: { currentStock: number }) {
      return this;
    }),
  };
  return mat;
}

describe('logUsage: stock decrement', () => {
  beforeEach(() => {
    vi.mocked(UsageEntry.find).mockResolvedValue([]); // no-op for the rolling-average recompute
  });

  it('decrements currentStock by the full quantity on a brand-new entry', async () => {
    const material = fakeMaterial(200);
    vi.mocked(Material.findOne).mockReturnValue({ catch: () => Promise.resolve(material) } as never);
    vi.mocked(UsageEntry.findOne).mockResolvedValue(null);
    vi.mocked(UsageEntry.create).mockResolvedValue({ quantity: 30 } as never);

    await logUsage('user1', { materialId: 'mat1', date: '2026-09-01', quantity: 30 });

    expect(material.currentStock).toBe(170); // 200 - 30
    expect(material.save).toHaveBeenCalled();
  });

  it('decrements only by the delta when re-logging the same date', async () => {
    const material = fakeMaterial(170); // already depleted by the first 30
    vi.mocked(Material.findOne).mockReturnValue({ catch: () => Promise.resolve(material) } as never);

    const existingEntry = {
      quantity: 30,
      notes: '',
      source: 'manual',
      save: vi.fn(async function (this: { quantity: number }) {
        return this;
      }),
    };
    vi.mocked(UsageEntry.findOne).mockResolvedValue(existingEntry as never);

    // Re-log the same date with a corrected quantity of 50 (delta = +20)
    await logUsage('user1', { materialId: 'mat1', date: '2026-09-01', quantity: 50 });

    expect(material.currentStock).toBe(150); // 170 - (50 - 30) = 150, same as 200 - 50
    expect(existingEntry.quantity).toBe(50);
  });

  it('never lets currentStock go negative', async () => {
    const material = fakeMaterial(10);
    vi.mocked(Material.findOne).mockReturnValue({ catch: () => Promise.resolve(material) } as never);
    vi.mocked(UsageEntry.findOne).mockResolvedValue(null);
    vi.mocked(UsageEntry.create).mockResolvedValue({ quantity: 999 } as never);

    await logUsage('user1', { materialId: 'mat1', date: '2026-09-02', quantity: 999 });

    expect(material.currentStock).toBe(0);
  });
});
