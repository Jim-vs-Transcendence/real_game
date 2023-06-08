import { Controller } from '@nestjs/common';
import { GameGateway } from 'src/game/game.gateway';

@Controller('game')
export class GameController {
    constructor(private readonly gameGateway: GameGateway) { }

}
