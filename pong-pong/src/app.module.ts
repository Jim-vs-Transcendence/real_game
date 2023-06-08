import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { GameController } from './game/game.controller';
import { GameGateway } from 'src/game/game.gateway';
import { GameService } from './game/game.service';
import { GameController } from './game/game.controller';
import { GameModule } from './game/game.module';
// import { GameModule } from './game/game.module';

import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    GameModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    })
  ],
  controllers: [
    AppController,
    GameController
  ],
  providers: [
    AppService,
    GameGateway
  ],
})
export class AppModule { }
