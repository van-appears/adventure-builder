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

function addErrors(errors) {
  const errorUl = document.createElement("ul");
  errors.forEach(err => {
    console.log(err);
    const errorLi = document.createElement("li");
    errorLi.innerText = err;
    errorUl.append(errorLi);
  });
  return errorUl;
}

if (config.errors.length && import.meta.env.DEV) {
  $("body").className = "started development errors";
  console.log(config.errors);
  $(".information").append("ERRORS");
  $(".information").append(addErrors(config.errors));
  if (config.warnings.length) {
    $(".information").append("WARNINGS");
    $(".information").append(addErrors(config.warnings));
  }
  $(".information").append(
    "Please correct your game definition and try again."
  );
} else if (config.errors.length) {
  $("body").className = "started errors";
  $(".information").append(
    "Please correct your game definition and try again."
  );
} else if (import.meta.env.DEV) {
  $("body").className = "started development";
} else {
  $("body").className = "started";
}

$(".wrapper").style = "";
if (!config.errors.length) {
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
}
