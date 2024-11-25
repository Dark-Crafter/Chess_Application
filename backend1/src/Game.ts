import WebSocket from 'ws';

interface Move {
  from: string;
  to: string;
}

export class Game {
  private board: any;
  private player1: WebSocket | null = null;
  private player2: WebSocket | null = null;
  private moveCount: number = 0;

  constructor(board: any) {
    this.board = board;
  }

  startGame(socket: WebSocket, color: string) {
    if (!this.player1) {
      this.player1 = socket;
      socket.send(JSON.stringify({ type: 'start', color: 'white' }));
    } else if (!this.player2) {
      this.player2 = socket;
      socket.send(JSON.stringify({ type: 'start', color: 'black' }));
      this.player1.send(JSON.stringify({ type: 'start', color: 'white' }));
    } else {
      socket.send(JSON.stringify({ type: 'error', error: 'Game already started' }));
    }
  }

  move(socket: WebSocket, move: Move) {
    // Check if it is the correct player's turn
    if (this.moveCount % 2 === 0 && socket === this.player2) {
      this.player2?.send(JSON.stringify({ type: 'error', error: 'It is not your turn' }));
      return;
    }

    if (this.moveCount % 2 === 1 && socket === this.player1) {
      this.player1?.send(JSON.stringify({ type: 'error', error: 'It is not your turn' }));
      return;
    }

    try {
      // Make the move
      const result = this.board.move(move);
      if (!result) {
        throw new Error('Invalid move');
      }
    } catch (error) {
      socket.send(JSON.stringify({ type: 'error', error: 'Invalid move' }));
      return;
    }

    // Send the move to the other player
    if (this.moveCount % 2 === 0) {
      this.player2?.send(JSON.stringify({ type: 'move', move }));
    } else {
      this.player1?.send(JSON.stringify({ type: 'move', move }));
    }

    this.moveCount++;
  }
}
