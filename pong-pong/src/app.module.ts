import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { GameController } from './game/game.controller';
import { GameGateway } from './game.gateway';
// import { GameModule } from './game/game.module';

import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    })
  ], controllers: [AppController,],
  providers: [AppService, GameGateway],
})
export class AppModule { }
