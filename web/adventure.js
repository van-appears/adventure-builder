import config from "./config";
import Game from "../game/game";

const $ = query => document.querySelector(query);

function addLine(line, user) {
  const lineEl = document.createElement("div");
  lineEl.className = user ? "textInput" : "textOutput";
  const spanEl = document.createElement("span");
  spanEl.innerText = line;
  lineEl.append(spanEl);
  $(".history").insertBefore(lineEl, $(".spacer"));
}

if (import.meta.env.DEV) {
  $("body").className = "started development";
} else {
  $("body").className = "started";
}

$(".wrapper").style = "";
const commandInput = $("#command");
const history = $(".history");
commandInput.value = "";

const game = new Game(config);
game.start().forEach(line => addLine(line, false));

commandInput.addEventListener("keyup", e => {
  if (e.key === "Enter" || e.keyCode === 13) {
    const input = (e.target.value || "").trim();
    if (input) {
      commandInput.value = "";
      const output = game.next(input);
      addLine(input, true);
      (output || []).forEach(line => addLine(line, false));
      history.scrollTo(0, history.scrollHeight);

      if (game.gameover) {
        $("body").className = "finished";
      }
    }
  }
});

setTimeout(() => {
  commandInput.focus();
}, 0);
