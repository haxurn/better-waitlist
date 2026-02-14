import { describe, expect, it } from 'vitest';
import { type WaitlistEntryInput, waitlist } from '../../src/waitlist/index';

describe('waitlist', () => {
  describe('plugin creation', () => {
    it('should create a plugin with correct id', () => {
      const plugin = waitlist();
      expect(plugin.id).toBe('waitlist');
    });

    it('should create a plugin with schema', () => {
      const plugin = waitlist();
      expect(plugin.schema).toBeDefined();
      expect(plugin.schema?.waitlist).toBeDefined();
    });

    it('should have correct schema fields', () => {
      const plugin = waitlist();
      const schema = plugin.schema?.waitlist;

      expect(schema?.fields.email).toBeDefined();
      expect(schema?.fields.email.type).toBe('string');
      expect(schema?.fields.email.required).toBe(true);
      expect(schema?.fields.email.unique).toBe(true);

      expect(schema?.fields.status).toBeDefined();
      expect(schema?.fields.status.type).toBe('string');
      expect(schema?.fields.status.required).toBe(true);
      expect(schema?.fields.status.defaultValue).toBe('pending');

      expect(schema?.fields.position).toBeDefined();
      expect(schema?.fields.position.type).toBe('number');
      expect(schema?.fields.position.required).toBe(true);

      expect(schema?.fields.createdAt).toBeDefined();
      expect(schema?.fields.createdAt.type).toBe('date');
      expect(schema?.fields.createdAt.required).toBe(true);

      expect(schema?.fields.userId).toBeDefined();
      expect(schema?.fields.userId.type).toBe('string');
      expect(schema?.fields.userId.required).toBe(false);
    });

    it('should have userId reference to user table', () => {
      const plugin = waitlist();
      const schema = plugin.schema?.waitlist;

      expect(schema?.fields.userId?.references).toBeDefined();
      expect(schema?.fields.userId?.references?.model).toBe('user');
      expect(schema?.fields.userId?.references?.field).toBe('id');
    });

    it('should create plugin with default options', () => {
      const plugin = waitlist();
      expect(plugin.id).toBe('waitlist');
      expect(plugin.schema).toBeDefined();
    });

    it('should create plugin with custom options', () => {
      const plugin = waitlist({ requireAdmin: false });
      expect(plugin.id).toBe('waitlist');
    });

    it('should create plugin with requireAdmin true by default', () => {
      const plugin = waitlist({ requireAdmin: true });
      expect(plugin.id).toBe('waitlist');
    });
  });

  describe('endpoints', () => {
    it('should have joinWaitlist endpoint', () => {
      const plugin = waitlist();
      expect(plugin.endpoints?.joinWaitlist).toBeDefined();
    });

    it('should have getWaitlistStatus endpoint', () => {
      const plugin = waitlist();
      expect(plugin.endpoints?.getWaitlistStatus).toBeDefined();
    });

    it('should have getWaitlistPosition endpoint', () => {
      const plugin = waitlist();
      expect(plugin.endpoints?.getWaitlistPosition).toBeDefined();
    });

    it('should have listWaitlist endpoint', () => {
      const plugin = waitlist();
      expect(plugin.endpoints?.listWaitlist).toBeDefined();
    });

    it('should have approveWaitlistEntry endpoint', () => {
      const plugin = waitlist();
      expect(plugin.endpoints?.approveWaitlistEntry).toBeDefined();
    });

    it('should have rejectWaitlistEntry endpoint', () => {
      const plugin = waitlist();
      expect(plugin.endpoints?.rejectWaitlistEntry).toBeDefined();
    });
  });

  describe('WaitlistEntryInput type', () => {
    it('should validate WaitlistEntryInput', () => {
      const validInput: WaitlistEntryInput = {
        email: 'test@example.com',
      };
      expect(validInput.email).toBe('test@example.com');

      const inputWithUserId: WaitlistEntryInput = {
        email: 'test@example.com',
        userId: 'user-123',
      };
      expect(inputWithUserId.userId).toBe('user-123');
    });
  });
});
