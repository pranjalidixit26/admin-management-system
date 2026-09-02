import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // this loads variables from our .env file
    // isGlobal true means we don't have to import this again in every other module
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // this sets up the actual connection to our MySQL database
    // using forRootAsync because we need to wait for .env values to load first
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),

        // automatically picks up entity files later, so we don't have to list them manually
        autoLoadEntities: true,

        // auto creates/updates tables based on our entities
        // good for development, we'll turn this off before going to production
        synchronize: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}