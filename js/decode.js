let decodeButton, saveHiddenOutputButton, copyHiddenOutputButton, saveOriginalOutputButton, copyOriginalOutputButton;
let decodeInput;
let pivotSlider, pivotSliderValueLabel;
let decodeImageCanvasContainer, originalImageCanvasContainer, hiddenImageCanvasContainer;
let passwordField;
let originalOutputPanel, hiddenOutputPanel;

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

function createMask(rng, pivot) {
  let mask = 0;
  for (let i = 0; i < pivot; i++) {
    mask = mask << 1;
    if (seededBoolean(rng)) {
      mask = mask | 1;
    }
  }
  return mask;
}

function onDecode() {
  const byte = 8;
  const decodeImageCanvas = document.getElementById('decode-image-canvas');

  const password = passwordField.value;
  const rng = new Math.seedrandom(password);

  if (decodeImageCanvas) {
    const pivot = pivotSlider.value;

    const originalImageCanvas = document.createElement('canvas');
    const hiddenImageCanvas = document.createElement('canvas');

    originalImageCanvas.id = 'original-image-canvas';
    hiddenImageCanvas.id = 'hidden-image-canvas';

    const decodeImageCanvasContext = decodeImageCanvas.getContext('2d');
    const originalImageContext = originalImageCanvas.getContext('2d');
    const hiddenImageContext = hiddenImageCanvas.getContext('2d');

    originalImageCanvas.width = decodeImageCanvas.width;
    originalImageCanvas.height = decodeImageCanvas.height;

    hiddenImageCanvas.width = decodeImageCanvas.width;
    hiddenImageCanvas.height = decodeImageCanvas.height;

    for (let y = 0; y < decodeImageCanvas.height; y++) {
      for (let x = 0; x < decodeImageCanvas.width; x++) {
        let decodeRGB = decodeImageCanvasContext.getImageData(x, y, 1, 1).data.slice(0,3);

        let mask = password === "" ? 0 : createMask(rng, pivot);

        let originalRGB = decodeRGB.map(v => v & (Math.pow(2, byte) - Math.pow(2, byte - pivot)));
        let hiddenRGB = decodeRGB.map(v => ((mask ^ v) & (Math.pow(2, byte - pivot) - 1)) << pivot);

        originalImageContext.fillStyle = "rgb(" + originalRGB[0] + "," + originalRGB[1] + "," + originalRGB[2] + ")";
        hiddenImageContext.fillStyle = "rgb(" + hiddenRGB[0] + "," + hiddenRGB[1] + "," + hiddenRGB[2] + ")";
        originalImageContext.fillRect(x, y, 1, 1);
        hiddenImageContext.fillRect(x, y, 1, 1);
      }
    }
    removeAllChildren(originalImageCanvasContainer);
    removeAllChildren(hiddenImageCanvasContainer);
    originalImageCanvasContainer.appendChild(originalImageCanvas);
    hiddenImageCanvasContainer.appendChild(hiddenImageCanvas);
    originalOutputPanel.classList.remove('hidden');
    hiddenOutputPanel.classList.remove('hidden');
  } else {
    alert('Please select an image to decode.')
  }
}

function onOutputDownload(canvasId, name) {
  const outputImageCanvas = document.getElementById(canvasId);

  if (outputImageCanvas) {
    const downloader = document.createElement('a');
    downloader.download = name;
    downloader.href = outputImageCanvas.toDataURL();
    downloader.click();
  } else {
    alert('No output to download!');
  }
}

function onOutputCopy(canvasId) {
  const outputImageCanvas = document.getElementById(canvasId);

  if (outputImageCanvas) {
    outputImageCanvas.toBlob((blob) => {
      const item = new ClipboardItem({"image/png": blob});
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
  decodeButton.addEventListener('click', onDecode);
  saveOriginalOutputButton.addEventListener('click', () => onOutputDownload('original-image-canvas', 'decoded-original-image.png'));
  copyOriginalOutputButton.addEventListener('click', () => onOutputCopy('original-image-canvas'));
  saveHiddenOutputButton.addEventListener('click', () => onOutputDownload('hidden-image-canvas', 'decoded-hidden-image.png'));
  copyHiddenOutputButton.addEventListener('click', () => onOutputCopy('hidden-image-canvas'));
  pivotSlider.addEventListener('input', onSliderValueChange);
  decodeInput.addEventListener('change', () => onImageChange(decodeInput, 'decode-image-canvas', decodeImageCanvasContainer));
}

function initPageElements() {
  decodeButton = document.getElementById('decode-button');
  saveOriginalOutputButton = document.getElementById('save-original-output-button');
  copyOriginalOutputButton = document.getElementById('copy-original-output-button');
  saveHiddenOutputButton = document.getElementById('save-hidden-output-button');
  copyHiddenOutputButton = document.getElementById('copy-hidden-output-button');
  pivotSlider = document.getElementById('pivot');
  pivotSliderValueLabel = document.getElementById('pivot-value');
  decodeInput = document.getElementById('decode-image-input');
  decodeImageCanvasContainer = document.getElementById('decode-image-canvas-container');
  originalImageCanvasContainer = document.getElementById('original-image-canvas-container');
  hiddenImageCanvasContainer = document.getElementById('hidden-image-canvas-container');
  passwordField = document.getElementById('password-field');
  originalOutputPanel = document.getElementById('original-output-panel');
  hiddenOutputPanel = document.getElementById('hidden-output-panel');
}

function start() {
  initPageElements();
  attachEventListeners();
}

window.onload = start;