import { gameDataDto } from "../gameDto/gameData.dto";

export class Room {
    isEnd: boolean;
    endTimer: any;
    dataFrame: any;
    roomName: string;
    leftPlayer: gameDataDto;
    rightPlayer: gameDataDto;
    leftReady: boolean;
    rightReady: boolean;
}