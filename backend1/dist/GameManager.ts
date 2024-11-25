import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";
import { Game } from "./Game";

export class GameManager {
    private games: Game[];
    private pendingUser: WebSocket | null;
    private users: Map<WebSocket, Game | null>;

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = new Map(); // Tracks users and their games
    }

    /**
     * Adds a new user to the system.
     */
    addUser(socket: WebSocket) {
        this.users.set(socket, null);
        this.addHandler(socket);
    }

    /**
     * Removes a user from the system and cleans up any associated games.
     */
    removeUser(socket: WebSocket) {
        const game = this.users.get(socket);

        // Remove the user and terminate their game if applicable
        this.users.delete(socket);

        if (game) {
            const opponent = socket === game.player1 ? game.player2 : game.player1;
            this.users.set(opponent, null);

            opponent.send(JSON.stringify({
                type: GAME_OVER,
                payload: { winner: "Opponent disconnected" }
            }));
        }
    }

    /**
     * Adds event handlers to a user's socket.
     */
    private addHandler(socket: WebSocket) {
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());

            if (message.type === INIT_GAME) {
                this.initializeGame(socket);
            } else if (message.type === MOVE) {
                this.handleMove(socket, message.payload.move);
            }
        });

        socket.on("close", () => {
            this.removeUser(socket);
        });
    }

    /**
     * Matches users and starts a new game.
     */
    private initializeGame(socket: WebSocket) {
        if (this.pendingUser) {
            const game = new Game(this.pendingUser, socket);
            this.games.push(game);
            this.users.set(this.pendingUser, game);
            this.users.set(socket, game);
            this.pendingUser = null;
        } else {
            this.pendingUser = socket;
        }
    }

    /**
     * Handles a move made by a user.
     */
    private handleMove(socket: WebSocket, move: { from: string; to: string; }) {
        const game = this.users.get(socket);
        if (game) {
            game.makeMove(socket, move);
        } else {
            console.log("User attempted to make a move outside of a game.");
        }
    }
}
