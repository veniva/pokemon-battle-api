import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

export const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/pokemon-game';

/** Creates Mongoose connection options from application configuration. */
export function createMongoOptions(configService: ConfigService): { uri: string } {
  const uri = configService.get<string>('MONGODB_URI', DEFAULT_MONGODB_URI).trim();

  return { uri: uri || DEFAULT_MONGODB_URI };
}

/** Configures the application MongoDB connection. */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createMongoOptions,
    }),
  ],
  exports: [MongooseModule],
})
export class MongoConfigModule {}
