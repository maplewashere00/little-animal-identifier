# Cat Detective: how we'll measure actual performance

The detector returns an **object detection score**, not the actual probability that its answer is correct. A high score on one photo does not establish 100% accuracy.

## Start with a small smoke test

- Try about 20 labeled photos containing cats and 20 not containing cats.
- Include Lucy and Neil only with permission to use those photos for private testing; do not publish personal photos as test fixtures without permission.
- Include clear cats, small cats, partly hidden cats, weird lighting, dogs, frogs, stuffed cats, and non-animal objects.
- Record the outcome without changing the label based on what the model predicted.

Example table:

| Photo | Actually contains a cat? | Model said “Cat detected”? | Raw score | Notes |
| --- | --- | --- | --- | --- |
| cat01.jpg | Yes | Yes | 0.87 | close-up |
| frog01.jpg | No | No | — | bright background |

The figures in this table are **illustrative placeholders**, not results.

## Measure, don't guess

- **True positive (TP):** “Cat detected,” and a cat is actually present.
- **False positive (FP):** “Cat detected,” but no cat is present.
- **False negative (FN):** a cat is present, but the tool didn't say “Cat detected.” This includes “Possible cat — uncertain.”
- **True negative (TN):** no cat is present and the tool did not say “Cat detected.”
- **Precision = TP / (TP + FP):** fraction of confident cat calls that were right.
- **Recall = TP / (TP + FN):** fraction of real cat photos that got a confident cat call.
- **Accuracy = (TP + TN) / (TP + FP + FN + TN):** fraction of correct binary yes/no calls, at the chosen threshold.
- Also count the **uncertain** cases separately and how long each phone takes to run.

If any denominator is zero, mark the metric *not available* rather than 100%.

The 0.70 strong score threshold is an arbitrary starting point. Raising it often reduces false positives but also increases false negatives: a higher threshold does not automatically make the model more accurate.

## Before claiming high accuracy

Use more photos collected independently, including unfamiliar cats and non-cats. Split photos by source/cat into a development set for choosing thresholds and a separate held-out test set for final reporting. Do not tune repeatedly on the held-out set. A sample of just 20 per class can find obvious problems but cannot support a credible claim of 99% or 100% accuracy.

If the results aren't strong, evaluate a separate fine-tuned cat-vs-not-cat model rather than changing the display percentage.
