let encodeButton, saveOutputButton, copyOutputButton;
let baseImageInput, secretImageInput;
let pivotSlider, pivotSliderValueLabel;
let baseImageCanvasContainer, secretImageCanvasContainer, outputImageCanvasContainer;
let passwordField;
let outputPanel;

function onImageChange(input, canvasId, canvasContainer) {
  const file = input.files[0];
  removeAllChildren(canvasContainer);

  if (file) {
    let image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.id = canvasId;
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext('2d').drawImage(image, 0, 0);
      canvasContainer.appendChild(canvas);
    };
    image.src = URL.createObjectURL(file);
  }
}

function removeAllChildren(element) {
  while (element.firstChild){
    element.removeChild(element.firstChild);
  }
}

function seededBoolean(rng) {
  return rng() > 0.5;
}

function createMask(rng, size) {
  let mask = 0;
  for (let i = 0; i < size; i++) {
    mask = mask << 1;
    if (seededBoolean(rng)) {
      mask = mask | 1;
    }
  }
  return mask;
}

function onEncode() {
  const byte = 8;
  const baseImageCanvas = document.getElementById('base-image-canvas');
  const secretImageCanvas = document.getElementById('secret-image-canvas');

  const password = passwordField.value;
  const rng = new Math.seedrandom(password);

  if (baseImageCanvas && secretImageCanvas) {
    const pivot = pivotSlider.value;
    const baseImageCanvasContext = baseImageCanvas.getContext('2d');
    const secretImageCanvasContext = secretImageCanvas.getContext('2d');

    const outputImageCanvas = document.createElement('canvas');
    outputImageCanvas.id = 'output-image-canvas';
    const context = outputImageCanvas.getContext('2d');
    outputImageCanvas.width = baseImageCanvas.width;
    outputImageCanvas.height = baseImageCanvas.height;

    for (let y = 0; y < baseImageCanvas.height; y++) {
      for (let x = 0; x < baseImageCanvas.width; x++) {
        let baseRGB = baseImageCanvasContext.getImageData(x, y, 1, 1).data.slice(0,3);
        let secretRGB = secretImageCanvasContext.getImageData(x, y, 1, 1).data.slice(0,3);

        let mask = password === "" ? 0 : createMask(rng, byte - pivot);
        let outputRGB = baseRGB.map((v, i) => (v & (Math.pow(2, byte) - Math.pow(2, byte - pivot))) | (((secretRGB[i] >> pivot) ^ mask) & (Math.pow(2, byte - pivot) - 1)));

        context.fillStyle = "rgb(" + outputRGB[0] + "," + outputRGB[1] + "," + outputRGB[2] + ")";
        context.fillRect(x, y, 1, 1);
      }
    }
    removeAllChildren(outputImageCanvasContainer);
    outputImageCanvasContainer.appendChild(outputImageCanvas);
    outputPanel.classList.remove('hidden');
  } else {
    alert('Please select both a base image and a secret image.')
  }
}

function onOutputDownload() {
  const outputImageCanvas = document.getElementById('output-image-canvas');

  if (outputImageCanvas) {
    const downloader = document.createElement('a');
    downloader.download = "encoded-image.png";
    downloader.href = outputImageCanvas.toDataURL();
    downloader.click();
  } else {
    alert('No output to download!');
  }
}

function onOutputCopy() {
  const outputImageCanvas = document.getElementById('output-image-canvas');

  if (outputImageCanvas) {
    outputImageCanvas.toBlob((blob) => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item]);
    });
  } else {
    alert('No output to copy!');
  }
}

function onSliderValueChange() {
  pivotSliderValueLabel.innerText = pivotSlider.value;
}

function attachEventListeners() {
  encodeButton.addEventListener('click', onEncode);
  saveOutputButton.addEventListener('click', onOutputDownload);
  copyOutputButton.addEventListener('click', onOutputCopy);
  pivotSlider.addEventListener('input', onSliderValueChange);
  baseImageInput.addEventListener('change', () => onImageChange(baseImageInput, 'base-image-canvas', baseImageCanvasContainer));
  secretImageInput.addEventListener('change', () => onImageChange(secretImageInput, 'secret-image-canvas', secretImageCanvasContainer));
}

function initPageElements() {
  encodeButton = document.getElementById('encode-button');
  saveOutputButton = document.getElementById('save-output-button');
  copyOutputButton = document.getElementById('copy-output-button');
  pivotSlider = document.getElementById('pivot');
  pivotSliderValueLabel = document.getElementById('pivot-value');
  baseImageInput = document.getElementById('base-image-input');
  secretImageInput = document.getElementById('secret-image-input');
  baseImageCanvasContainer = document.getElementById('base-image-canvas-container');
  secretImageCanvasContainer = document.getElementById('secret-image-canvas-container');
  outputImageCanvasContainer = document.getElementById('output-image-canvas-container');
  passwordField = document.getElementById('password-field');
  outputPanel = document.getElementById('output-panel');
}

function start() {
  initPageElements();
  attachEventListeners();
}

window.onload = start;