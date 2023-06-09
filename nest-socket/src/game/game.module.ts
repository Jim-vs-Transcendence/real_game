import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

import { join } from 'path';

@Module({
  imports: [
  ],
  controllers: [
    GameController,
  ],
  providers: [
    GameService,
    GameGateway
  ],
})
export class GameModule { }
