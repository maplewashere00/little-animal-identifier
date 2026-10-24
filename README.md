# Little Animal Identifier 🐾

Our original [MobileNet v2](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) animal classifier is the default again.

**Live website:** https://maplewashere00.github.io/little-animal-identifier/

## Current modes

- **🌎 Identify animal (default):** predicts the best animal/image category from the original full photo and shows its original model score, plus four alternatives. It also shows cat-appearance clues if MobileNet returned any known domestic-cat labels.
- **🔎 Also check a centered close-up (optional):** asks the same MobileNet model to classify a crop with 14% removed from each edge. Shows this as a **separate** result so we can compare background effects. It is not automatically more accurate; don't use it for off-center animals.
- **🐱 Detect cat locations:** separate COCO-SSD cat detector that draws boxes and, when possible, estimates the highest-scoring cat's appearance. Detection helpers were restored after a regression.
- **[Cat Coat Lab](coat-lab/):** earlier experimental coat color/pattern page retained for reference; not the default or a proven improvement.

## Accuracy and confidence

A model score is **not** the measured percentage of predictions it gets correct. We don't inflate scores or silently select the highest-scoring view. This update repairs broken detection functionality and adds a controlled comparison, **not** a trained accuracy upgrade. Improving real-world accuracy requires labeled photos, evaluation, and potentially a better trained model.

The original model has only a few domestic-cat appearance categories. Tabby is a pattern, not a breed. Coat color and most patterns are outside its supported label set.

Photos are processed in the browser. AI libraries and model weights are downloaded from third-party hosts; an internet connection is required.

## Tests

Run the offline decision tests with:

```sh
node --test tests/cat-logic.test.js
```

These tests check decision logic and regression cases, not image-recognition accuracy. See [EVALUATION.md](EVALUATION.md).

## License

MIT — see [LICENSE](LICENSE).
