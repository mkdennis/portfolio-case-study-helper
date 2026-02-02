import { describe, it, expect } from 'vitest';
import {
  projectMetadataSchema,
  createProjectSchema,
  journalEntrySchema,
  assetMetadataSchema,
} from './project';

describe('Project Schemas', () => {
  describe('createProjectSchema', () => {
    it('validates a valid project', () => {
      const validProject = {
        name: 'My Project',
        role: 'Lead Designer',
        startDate: '2024-01-01',
        status: 'in-progress' as const,
        problemSpace: 'This is a problem space description that is long enough',
      };

      const result = createProjectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it('requires name', () => {
      const invalidProject = {
        role: 'Lead Designer',
        startDate: '2024-01-01',
        problemSpace: 'This is a problem space description',
      };

      const result = createProjectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('requires role', () => {
      const invalidProject = {
        name: 'My Project',
        startDate: '2024-01-01',
        problemSpace: 'This is a problem space description',
      };

      const result = createProjectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('role');
      }
    });

    it('requires startDate', () => {
      const invalidProject = {
        name: 'My Project',
        role: 'Lead Designer',
        problemSpace: 'This is a problem space description',
      };

      const result = createProjectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('startDate');
      }
    });

    it('requires problemSpace with at least 10 characters', () => {
      const invalidProject = {
        name: 'My Project',
        role: 'Lead Designer',
        startDate: '2024-01-01',
        problemSpace: 'Too short',
      };

      const result = createProjectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 10 characters');
      }
    });

    it('validates status enum', () => {
      const validStatuses = ['in-progress', 'completed', 'paused'];

      validStatuses.forEach((status) => {
        const project = {
          name: 'My Project',
          role: 'Lead Designer',
          startDate: '2024-01-01',
          status,
          problemSpace: 'This is a problem space description',
        };

        const result = createProjectSchema.safeParse(project);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid status', () => {
      const invalidProject = {
        name: 'My Project',
        role: 'Lead Designer',
        startDate: '2024-01-01',
        status: 'invalid-status',
        problemSpace: 'This is a problem space description',
      };

      const result = createProjectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });

    it('accepts optional fields', () => {
      const projectWithOptionals = {
        name: 'My Project',
        role: 'Lead Designer',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        problemSpace: 'This is a problem space description',
        team: 'Small team',
        timeline: '3 months',
        scope: 'Full redesign',
        technical: 'React, TypeScript',
        tags: ['design', 'frontend'],
      };

      const result = createProjectSchema.safeParse(projectWithOptionals);
      expect(result.success).toBe(true);
    });

    it('provides default values', () => {
      const minimalProject = {
        name: 'My Project',
        role: 'Lead Designer',
        startDate: '2024-01-01',
        problemSpace: 'This is a problem space description',
      };

      const result = createProjectSchema.parse(minimalProject);
      expect(result.status).toBe('in-progress');
      expect(result.tags).toEqual([]);
    });
  });

  describe('journalEntrySchema', () => {
    it('validates a valid journal entry', () => {
      const validEntry = {
        date: '2024-01-15',
        decision: 'Chose to use React',
        why: 'Better performance',
      };

      const result = journalEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('requires date', () => {
      const invalidEntry = {
        decision: 'Some decision',
      };

      const result = journalEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it('accepts all optional fields', () => {
      const fullEntry = {
        date: '2024-01-15',
        tags: ['important', 'design'],
        assets: ['asset1.png', 'asset2.png'],
        decision: 'Made a decision',
        why: 'For these reasons',
        milestone: 'Completed phase 1',
        change: 'Changed approach',
        tradeoff: 'Faster but less flexible',
        feedback: 'User loved it',
      };

      const result = journalEntrySchema.safeParse(fullEntry);
      expect(result.success).toBe(true);
    });

    it('provides default empty arrays', () => {
      const minimalEntry = {
        date: '2024-01-15',
      };

      const result = journalEntrySchema.parse(minimalEntry);
      expect(result.tags).toEqual([]);
      expect(result.assets).toEqual([]);
    });
  });

  describe('assetMetadataSchema', () => {
    it('validates a valid asset', () => {
      const validAsset = {
        filename: 'design-mockup.png',
        uploadedAt: '2024-01-15T10:00:00Z',
        role: 'final' as const,
        suggestedName: 'Final Design Mockup',
        fileSize: 1024000,
      };

      const result = assetMetadataSchema.safeParse(validAsset);
      expect(result.success).toBe(true);
    });

    it('validates role enum', () => {
      const validRoles = ['before', 'after', 'before-after', 'exploration', 'final', 'process', 'other'];

      validRoles.forEach((role) => {
        const asset = {
          filename: 'test.png',
          uploadedAt: '2024-01-15T10:00:00Z',
          role,
          suggestedName: 'Test Asset',
          fileSize: 1024,
        };

        const result = assetMetadataSchema.safeParse(asset);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid role', () => {
      const invalidAsset = {
        filename: 'test.png',
        uploadedAt: '2024-01-15T10:00:00Z',
        role: 'invalid-role',
        suggestedName: 'Test Asset',
        fileSize: 1024,
      };

      const result = assetMetadataSchema.safeParse(invalidAsset);
      expect(result.success).toBe(false);
    });

    it('provides default values', () => {
      const minimalAsset = {
        filename: 'test.png',
        uploadedAt: '2024-01-15T10:00:00Z',
        role: 'other' as const,
        suggestedName: 'Test Asset',
        fileSize: 1024,
      };

      const result = assetMetadataSchema.parse(minimalAsset);
      expect(result.linkedEntries).toEqual([]);
      expect(result.linkedSections).toEqual([]);
      expect(result.altText).toBe('');
      expect(result.tags).toEqual([]);
    });

    it('requires all mandatory fields', () => {
      const incompleteAsset = {
        filename: 'test.png',
      };

      const result = assetMetadataSchema.safeParse(incompleteAsset);
      expect(result.success).toBe(false);
    });
  });
});
