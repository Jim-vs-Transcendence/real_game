import { gameDataDto } from "../gameDto/gameData.dto";

export class Room {
    roomName: string;
    leftPlayer: gameDataDto;
    rightPlayer: gameDataDto;
    leftReady: boolean;
    rightReady: boolean;
}