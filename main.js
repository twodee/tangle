var cellSize = 50;
var resolution = [10, 10];
var svgNamespace = "http://www.w3.org/2000/svg";
var cells = [];
var labels = [];
var operands = [0, 0];
var bounds = [0, 0];
var order = [];
var cellOnColor = '#FF6F5E';
var cellOffColor = 'rgb(230, 230, 230)';
var cellTextColor = 'rgb(100, 100, 100)';
var guessBox = null;
var root = null;
var margin = [20, 40];
var expression = null;
var gameOverRoot = null;

function onReady() {
  var resetButton = document.getElementById('reset');
  var svg = document.getElementById('svg');
  gameOverRoot = document.getElementById('game-over');
  root = document.getElementById('root');
  guessBox = document.getElementById('guessBox');

  cellSize = root.offsetWidth / resolution[0];
  svg.setAttribute('viewBox', '0 0 ' + (cellSize * resolution[0] + margin[0]) + ' ' + (cellSize * resolution[1] + margin[1]));

  guessBox.style.width = (cellSize * 0.4) + 'px';

  for (var r = 0; r < resolution[1]; ++r) {
    var label = document.createElementNS(svgNamespace, 'text');
    label.setAttribute('x', 0);
    label.setAttribute('y', (r + 0.5) * cellSize + margin[1]);
    label.setAttribute('font-size', cellSize * 0.3);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('alignment-baseline', 'middle');
    label.textContent = r + 1;
    svg.appendChild(label);
  }

  for (var c = 0; c < resolution[0]; ++c) {
    var label = document.createElementNS(svgNamespace, 'text');
    label.setAttribute('x', (c + 0.5) * cellSize + margin[0]);
    label.setAttribute('y', 15);
    label.setAttribute('font-size', cellSize * 0.3);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('alignment-baseline', 'middle');
    label.textContent = c + 1;
    svg.appendChild(label);
  }

  var padding = 5;
  for (var r = 0; r < resolution[1]; ++r) {
    for (var c = 0; c < resolution[0]; ++c) {
      var cell = document.createElementNS(svgNamespace, 'rect');
      cell.setAttribute('x', c * cellSize + margin[0] + padding);
      cell.setAttribute('y', r * cellSize + margin[1] + padding);
      cell.setAttribute('width', cellSize - 2 * padding);
      cell.setAttribute('height', cellSize - 2 * padding);
      cell.setAttribute('rx', 10);
      cell.setAttribute('ry', 10);
      cell.setAttribute('fill', cellOffColor);
      cells.push(cell);
      svg.appendChild(cell);

      var label = document.createElementNS(svgNamespace, 'text');
      label.setAttribute('x', (c + 0.5) * cellSize + margin[0]);
      label.setAttribute('y', (r + 0.5) * cellSize + margin[1]);
      label.setAttribute('font-size', cellSize * 0.3);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', cellTextColor);
      label.setAttribute('alignment-baseline', 'middle');
      label.setAttribute('opacity', 0);
      label.textContent = (r + 1) * (c + 1);
      labels.push(label);
      svg.appendChild(label);
    }
  }

  expression = document.createElementNS(svgNamespace, 'text');
  expression.setAttribute('x', 0);
  expression.setAttribute('y', 0);
  expression.setAttribute('font-size', cellSize * 0.2);
  expression.setAttribute('text-anchor', 'middle');
  expression.setAttribute('alignment-baseline', 'baseline');
  expression.setAttribute('opacity', 0);
  expression.textContent = 'a * b';
  svg.appendChild(expression);

  guessBox.addEventListener('keyup', onKeyUp);
  resetButton.addEventListener('click', reset);

  reset();
}

function reset() {
  gameOverRoot.style.display = 'none';
  order = [];

  for (var i = 0; i < resolution[0] * resolution[1]; ++i) {
    labels[i].setAttribute('opacity', 0);
    order.push(i);
  }

  for (var i = resolution[0] * resolution[1] - 1; i >= 1; --i) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }

  next();
}

function onKeyUp(event) {
  if (event.which == 13) {
    checkGuess();
  }
}

function checkGuess() {
  var guess = parseInt(guessBox.value);
  if (guess == operands[0] * operands[1]) {
    var i = (operands[1] - 1) * resolution[0] + (operands[0] - 1);
    labels[i].setAttribute('opacity', 1);
    if (order.length == 0) {
      hidePrompt();
      bounds = [0, 0];
      colorCells();
      gameOverRoot.style.display = 'block';
    } else {
      next();
    }
  } else {
    shakeGuess();
  }
}

function shakeGuess() {
  var elapsedTime = 0;
  var amplitude = 20;
  var lambda = 0.95;
  var frequency = 30;
  var startMillis = new Date().getTime();
  var targetMillis = 3 * Math.PI / 20 * 1000;

  var oldX = guessBox.style.left;
  var oldY = guessBox.style.top;

  oldX = parseFloat(oldX.substring(0, oldX.length - 2));
  oldY = parseFloat(oldY.substring(0, oldY.length - 2));

  var bounds = guessBox.getBoundingClientRect();

  var task = setInterval(() => {
    var elapsedMillis = new Date().getTime() - startMillis;
    if (elapsedMillis > targetMillis) {
      clearInterval(task);
      guessBox.style.left = oldX + 'px';
      guessBox.value = '';
      guessBox.focus();
    } else { 
      var intensity = amplitude * Math.exp(-lambda * elapsedMillis / 1000) * Math.cos(frequency * elapsedMillis / 1000 - Math.PI * 0.5);
      guessBox.style.left = (oldX + intensity) + 'px';
    }
  }, 10);
}

function next() {
  var answer = order.pop();
  var oldOperands = [operands[0], operands[1]];
  operands[0] = 1 + answer % resolution[0];
  operands[1] = 1 + Math.floor(answer / resolution[0]);

  hidePrompt();
  resize(oldOperands, operands);
}

function hidePrompt() {
  expression.setAttribute('opacity', 0);
  guessBox.style.display = 'none';
}

function resize(oldResolution, newResolution) {
  var startMillis = new Date().getTime();
  var diffX = newResolution[0] - oldResolution[0];
  var diffY = newResolution[1] - oldResolution[1];
  var hypot = Math.sqrt(diffX * diffX + diffY * diffY) * 100.5;
  var targetMillis = hypot;

  var task = setInterval(() => {
    var elapsedMillis = new Date().getTime() - startMillis;
    if (elapsedMillis > targetMillis) {
      bounds[0] = newResolution[0];
      bounds[1] = newResolution[1];
      clearInterval(task);
      showPrompt();
    } else { 
      bounds[0] = lerp(elapsedMillis, targetMillis, oldResolution[0], newResolution[0]);
      bounds[1] = lerp(elapsedMillis, targetMillis, oldResolution[1], newResolution[1]);
    }
    colorCells();
  }, 10);
}

function colorCells() {
  for (var r = 0; r < resolution[1]; ++r) {
    for (var c = 0; c < resolution[0]; ++c) {
      var i = r * resolution[0] + c;
      var color = (r < bounds[1] && c < bounds[0]) ? cellOnColor : cellOffColor;
      cells[i].setAttribute('fill', color);
    }
  }
}

function showPrompt() {
  var p = svg.createSVGPoint();
  p.x = (operands[0] - 0.5) * cellSize + margin[0];
  p.y = (operands[1] - 0.5) * cellSize + margin[1];
  var pp = p.matrixTransform(svg.getScreenCTM());
  var bounds = root.getBoundingClientRect();
  var x = pp.x - bounds.left;
  var y = pp.y - bounds.top;
  expression.textContent = operands[0] + ' \u00D7 ' + operands[1];
  expression.setAttribute('x', p.x);
  expression.setAttribute('y', p.y - 25);
  expression.setAttribute('opacity', 1);
  guessBox.style.left = x + 'px';
  guessBox.style.top = y + 'px';
  guessBox.value = '';
  guessBox.style.display = 'block';
  guessBox.focus();
}

function lerp(currentMillis, targetMillis, oldValue, newValue) {
  var proportion = currentMillis / targetMillis;
  return oldValue + proportion * (newValue - oldValue);
}

function easeBackInOut(currentMillis, targetMillis, oldValue, newValue) {
  var s = 1.70158;
  var u = s * 1.525;
  var t = currentMillis / (0.5 * targetMillis);
  if (t < 1) {
    return (newValue - oldValue) * 0.5 * t * t * ((u + 1) * t - u) + oldValue;
  } else {
    t -= 2.0;
    return (newValue - oldValue) * 0.5 * (t * t * ((u + 1) * t + u) + 2) + oldValue;
  }
}

function easeQuadInOut(currentMillis, targetMillis, oldValue, newValue) {
  var t = currentMillis / (0.5 * targetMillis);
  if (t < 1) {
    return (newValue - oldValue) * 0.5 * t * t + oldValue;
  } else {
    t -= 1.0;
    return (newValue - oldValue) * -0.5 * (t * (t - 2) - 1) + oldValue;
  }
}

document.addEventListener('DOMContentLoaded', onReady);
