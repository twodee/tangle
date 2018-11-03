var cellSize = 50;
var resolution = 10;
var svgNamespace = "http://www.w3.org/2000/svg";
var cells = [];
var labels = [];
var isAnswered = [];
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
var swapButton = null;
var gameOverRoot = null;
var nConsecutiveWrong = 0;
var padding = 5;
var isPrompting = false;
var fontSize;

function onReady() {
  var resetButton = document.getElementById('reset');
  var svg = document.getElementById('svg');
  gameOverRoot = document.getElementById('game-over');
  root = document.getElementById('root');
  guessBox = document.getElementById('guessBox');

  cellSize = root.offsetWidth / resolution;
  fontSize = cellSize * 0.3;
  margin[0] = cellSize * 0.35;
  margin[1] = cellSize * 0.35;
  var radius = cellSize / 13;
  padding = cellSize / 26;
  console.log("cellSize:", cellSize);

  svg.setAttribute('viewBox', '0 0 ' + (cellSize * resolution + margin[0]) + ' ' + (cellSize * resolution + margin[1]));

  for (var r = 0; r < resolution; ++r) {
    var label = document.createElementNS(svgNamespace, 'text');
    label.setAttribute('x', fontSize);
    label.setAttribute('y', (r + 0.5) * cellSize + margin[1]);
    label.setAttribute('font-size', fontSize);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('alignment-baseline', 'central');
    label.textContent = r + 1;
    svg.appendChild(label);
  }

  for (var c = 0; c < resolution; ++c) {
    var label = document.createElementNS(svgNamespace, 'text');
    label.setAttribute('x', (c + 0.5) * cellSize + margin[0]);
    label.setAttribute('y', fontSize);
    label.setAttribute('font-size', fontSize);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('alignment-baseline', 'end');
    label.textContent = c + 1;
    svg.appendChild(label);
  }

  for (var r = 0; r < resolution; ++r) {
    for (var c = 0; c < resolution; ++c) {
      var cell = document.createElementNS(svgNamespace, 'rect');
      cell.setAttribute('x', c * cellSize + margin[0] + padding);
      cell.setAttribute('y', r * cellSize + margin[1] + padding);
      cell.setAttribute('width', cellSize - 2 * padding);
      cell.setAttribute('height', cellSize - 2 * padding);
      cell.setAttribute('rx', radius);
      cell.setAttribute('ry', radius);
      cell.setAttribute('fill', cellOffColor);
      cells.push(cell);
      svg.appendChild(cell);

      var label = document.createElementNS(svgNamespace, 'text');
      label.setAttribute('x', (c + 0.5) * cellSize + margin[0]);
      label.setAttribute('y', (r + 0.5) * cellSize + margin[1]);
      label.setAttribute('font-size', fontSize);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', cellTextColor);
      label.setAttribute('alignment-baseline', 'central');
      label.setAttribute('opacity', 0);
      label.textContent = (r + 1) * (c + 1);
      labels.push(label);
      svg.appendChild(label);
    }
  }

  expression = document.createElementNS(svgNamespace, 'text');
  expression.setAttribute('x', 0);
  expression.setAttribute('y', 0);
  expression.setAttribute('font-size', 0.75 * fontSize);
  expression.setAttribute('text-anchor', 'middle');
  expression.setAttribute('alignment-baseline', 'central');
  expression.setAttribute('opacity', 0);
  expression.textContent = 'a * b';
  svg.appendChild(expression);

  swapButton = document.createElementNS(svgNamespace, 'text');
  swapButton.setAttribute('id', 'swapButton');
  swapButton.setAttribute('x', 0);
  swapButton.setAttribute('y', 0);
  swapButton.setAttribute('font-size', cellSize * 0.2);
  swapButton.setAttribute('text-anchor', 'middle');
  swapButton.setAttribute('alignment-baseline', 'central');
  swapButton.setAttribute('visibility', 'hidden');
  swapButton.textContent = '\u21c6';
  svg.appendChild(swapButton);

  guessBox.addEventListener('keyup', onKeyUp);
  resetButton.addEventListener('click', reset);
  swapButton.addEventListener('click', swap);

  resize();
  reset();

  window.addEventListener('resize', resize);
  guessBox.addEventListener('blur', function() {
    guessBox.focus();
  });
}

function resize() {
  var bounds = cells[0].getBoundingClientRect();
  guessBox.style.width = bounds.width + 'px';
  guessBox.style['font-size'] = bounds.height / 3 + 'px';

  // console.log("bounds.width:", bounds.width);
  // var foo = root.offsetWidth / resolution;

  // var p = svg.createSVGPoint();
  // p.x = 0;
  // p.y = 0;
  // var a = p.matrixTransform(svg.getScreenCTM());
  // console.log("a:", a);

  // p.y = fontSize;
  // var b = p.matrixTransform(svg.getScreenCTM());
  // diff = b.y - a.y;
  // guessBox.style['font-size'] = '18pt';

  if (isPrompting) {
    showPrompt(); 
  }
}

function reset() {
  gameOverRoot.style.display = 'none';
  order = [];

  for (var i = 0; i < resolution * resolution; ++i) {
    labels[i].setAttribute('opacity', 0);
    isAnswered[i] = false;
    order.push(i);
  }

  for (var i = resolution * resolution - 1; i >= 1; --i) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }

  next();
}

function onKeyUp(event) {
  if (event.which == 13 && guessBox.value != '') {
    checkGuess();
  }
}

function operandsToIndex(c, r) {
  return (r - 1) * resolution + (c - 1);
}

var integerPattern = /^\d+$/;

function checkGuess() {
  var guess;
  if (integerPattern.test(guessBox.value)) {
    guess = parseInt(guessBox.value);
  } else {
    guess = 0;
  }

  if (guess == operands[0] * operands[1]) {
    var i = operandsToIndex(operands[0], operands[1]);
    labels[i].setAttribute('opacity', 1);
    isAnswered[i] = true;
    if (order.length == 0) {
      hidePrompt();
      bounds = [0, 0];
      synchronizeCells();
      gameOverRoot.style.display = 'block';
    } else {
      next();
    }
  } else {
    ++nConsecutiveWrong;
    shakeGuess(guess);
  }
}

function shakeGuess(guess) {
  var answer = operands[0] * operands[1];
  var elapsedTime = 0;
  var amplitude = root.offsetWidth / resolution / 6;
  var lambda = 0.95;
  var frequency = 30;
  var startMillis = new Date().getTime();
  var targetMillis = 3 * Math.PI / 20 * 1000;

  var oldX = guessBox.style.left;
  var oldY = guessBox.style.top;

  oldX = parseFloat(oldX.substring(0, oldX.length - 2));
  oldY = parseFloat(oldY.substring(0, oldY.length - 2));

  var bounds = guessBox.getBoundingClientRect();
  guessBox.disabled = true;

  if (guess > 0 && nConsecutiveWrong < 3) {
    synchronizeCells();
    var factorPairs = [];
    for (var i = 1; i <= resolution; ++i) {
      if (guess % i == 0 && guess / i <= resolution) {
        var pair = [i, guess / i];
        factorPairs.push(pair);
        var iPair = operandsToIndex(pair[0], pair[1]);
        cells[iPair].setAttribute('fill', '#E265FF');
        labels[iPair].setAttribute('opacity', 1);
      }
    }
  }

  var task = setInterval(() => {
    var elapsedMillis = new Date().getTime() - startMillis;
    if (elapsedMillis > targetMillis) {
      clearInterval(task);
      guessBox.disabled = false;
      if (nConsecutiveWrong >= 3) {
        order.unshift(operandsToIndex(operands[0], operands[1]));
        next();
      } else {
        guessBox.style.left = oldX + 'px';
        guessBox.value = '';
        guessBox.focus();
      }
    } else { 
      var intensity = amplitude * Math.exp(-lambda * elapsedMillis / 1000) * Math.cos(frequency * elapsedMillis / 1000 - Math.PI * 0.5);
      guessBox.style.left = (oldX + intensity) + 'px';
    }
  }, 10);
}

function swap() {
  // replace index of swapped with index of current
  var i = operandsToIndex(operands[1], operands[0]);
  order[order.indexOf(i)] = operandsToIndex(operands[0], operands[1]);
  var oldOperands = [operands[0], operands[1]];
  operands = [operands[1], operands[0]]
  hidePrompt();
  shape(oldOperands, operands);
}

function next() {
  nConsecutiveWrong = 0;
  var answer = order.pop();
  var oldOperands = [operands[0], operands[1]];
  operands[0] = 1 + answer % resolution;
  operands[1] = 1 + Math.floor(answer / resolution);

  hidePrompt();
  shape(oldOperands, operands);
}

function hidePrompt() {
  isPrompting = false;
  expression.setAttribute('opacity', 0);
  swapButton.setAttribute('visibility', 'hidden');
  guessBox.style.display = 'none';
}

function shape(oldResolution, newResolution) {
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
    synchronizeCells();
  }, 10);
}

function synchronizeCells() {
  for (var r = 0; r < resolution; ++r) {
    for (var c = 0; c < resolution; ++c) {
      var i = r * resolution + c;
      if (r < bounds[1] && c < bounds[0]) {
        cells[i].setAttribute('fill', cellOnColor);
      } else {
        cells[i].setAttribute('fill', cellOffColor);
      }
      if (isAnswered[i]) {
        labels[i].setAttribute('opacity', 1);
      } else {
        labels[i].setAttribute('opacity', 0);
      }
    }
  }
}

function showPrompt() {
  isPrompting = true;
  var p = svg.createSVGPoint();
  p.x = (operands[0] - 0.5) * cellSize + margin[0];
  p.y = (operands[1] - 0.5) * cellSize + margin[1];
  var pp = p.matrixTransform(svg.getScreenCTM());
  var bounds = root.getBoundingClientRect();
  var x = pp.x - bounds.left;
  var y = pp.y - bounds.top;
  expression.textContent = operands[0] + ' \u00D7 ' + operands[1];
  expression.setAttribute('x', p.x);
  expression.setAttribute('y', p.y - (cellSize - 2 * padding) / 3);
  expression.setAttribute('opacity', 1);
  swapButton.setAttribute('x', p.x);
  swapButton.setAttribute('y', p.y + (cellSize - 2 * padding) / 3);
  var iSwap = operandsToIndex(operands[1], operands[0]);
  if (order.includes(iSwap)) {
    swapButton.setAttribute('visibility', 'visible');
  }
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

window.addEventListener('load', onReady);
