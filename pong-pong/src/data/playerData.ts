import { gameDataDto } from "../game/gameDto/gameData.dto";

export class Room {
    dataFrame: any;
    roomName: string;
    leftPlayer: gameDataDto;
    rightPlayer: gameDataDto;
    leftReady: boolean;
    rightReady: boolean;
}