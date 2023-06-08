import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from 'src/game/game.gateway';

@Module({
  providers: [GameService, GameGateway],
  controllers: [GameController]
})
export class GameModule { }
