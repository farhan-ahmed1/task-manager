import { hashPassword, comparePassword } from '../src/utils/hash';
import hashModule from '../src/utils/hash';
import bcrypt from 'bcryptjs';

// Mock bcryptjs
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Hash Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password with generated salt', async () => {
      const password = 'testpassword123';
      const mockSalt = 'mock-salt';
      const mockHash = 'mock-hash';

      (mockedBcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await hashPassword(password);

      expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, mockSalt);
      expect(result).toBe(mockHash);
    });

    it('should handle bcrypt errors during salt generation', async () => {
      const password = 'testpassword123';
      const error = new Error('Salt generation failed');

      (mockedBcrypt.genSalt as jest.Mock).mockRejectedValue(error);

      await expect(hashPassword(password)).rejects.toThrow('Salt generation failed');
    });

    it('should handle bcrypt errors during hashing', async () => {
      const password = 'testpassword123';
      const mockSalt = 'mock-salt';
      const error = new Error('Hashing failed');

      (mockedBcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (mockedBcrypt.hash as jest.Mock).mockRejectedValue(error);

      await expect(hashPassword(password)).rejects.toThrow('Hashing failed');
    });
  });

  describe('comparePassword', () => {
    it('should compare password and hash successfully', async () => {
      const password = 'testpassword123';
      const hash = 'mock-hash';

      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'wrongpassword';
      const hash = 'mock-hash';

      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle bcrypt errors during comparison', async () => {
      const password = 'testpassword123';
      const hash = 'mock-hash';
      const error = new Error('Comparison failed');

      (mockedBcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(comparePassword(password, hash)).rejects.toThrow('Comparison failed');
    });
  });

  describe('default export', () => {
    it('should export both functions in default object', () => {
      expect(hashModule).toHaveProperty('hashPassword');
      expect(hashModule).toHaveProperty('comparePassword');
      expect(typeof hashModule.hashPassword).toBe('function');
      expect(typeof hashModule.comparePassword).toBe('function');
    });

    it('should work with default export functions', async () => {
      const password = 'testpassword123';
      const mockSalt = 'mock-salt';
      const mockHash = 'mock-hash';

      (mockedBcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Test default export hashPassword
      const hashedResult = await hashModule.hashPassword(password);
      expect(hashedResult).toBe(mockHash);

      // Test default export comparePassword
      const compareResult = await hashModule.comparePassword(password, mockHash);
      expect(compareResult).toBe(true);
    });
  });
});
