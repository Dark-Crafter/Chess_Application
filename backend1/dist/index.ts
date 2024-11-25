import { WebSocketServer } from "ws";
import { GameManager } from "./GameManager";

const wss = new WebSocketServer({ port: 8080 });
const gameManager = new GameManager();

wss.on("connection", (socket) => {
    console.log("New user connected.");
    gameManager.addUser(socket);

    socket.on("close", () => {
        console.log("User disconnected.");
        gameManager.removeUser(socket);
    });
});
