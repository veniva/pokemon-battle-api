import { ConfigService } from '@nestjs/config';
import { createMongoOptions, DEFAULT_MONGODB_URI } from './mongo-config.module';

describe('createMongoOptions', () => {
  const createConfigService = (
    mongoUri?: string,
  ): { configService: ConfigService; getMock: jest.Mock<string, [string, string]> } => {
    const getMock = jest.fn((_key: string, defaultValue: string) => mongoUri ?? defaultValue);

    return {
      configService: { get: getMock } as unknown as ConfigService,
      getMock,
    };
  };

  it('returns the configured MongoDB URI from ConfigService', () => {
    const { configService, getMock } = createConfigService('mongodb://localhost:27017/test-db');

    expect(createMongoOptions(configService)).toEqual({ uri: 'mongodb://localhost:27017/test-db' });
    expect(getMock).toHaveBeenCalledWith('MONGODB_URI', DEFAULT_MONGODB_URI);
  });

  it('falls back to the local MongoDB URI', () => {
    const { configService } = createConfigService();

    expect(createMongoOptions(configService)).toEqual({ uri: DEFAULT_MONGODB_URI });
  });

  it('falls back when the configured MongoDB URI is blank', () => {
    const { configService } = createConfigService('   ');

    expect(createMongoOptions(configService)).toEqual({ uri: DEFAULT_MONGODB_URI });
  });
});
