import config from "./config";
import Game from "../game/game";

function addLine(line) {
  const lineEl = document.createElement("div");
  lineEl.innerText = line;
  document.querySelector(".history").append(lineEl);
}

document.body.className = "started";
document.querySelector(".wrapper").style = "";
const commandInput = document.querySelector("#command");
commandInput.value = "";

const game = new Game(config);
game.start().forEach(addLine);

commandInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter" || e.keyCode === 13) {
    const input = (e.target.value || "").trim();
    if (input) {
      commandInput.value = "";
      const output = game.next(input);
      (output || []).forEach(addLine);
      if (game.gameover) {
        document.body.className = "finished";
      }
    }
  }
});
