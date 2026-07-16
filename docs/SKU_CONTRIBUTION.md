# SKU Contribution Checklist

Before submitting a new SKU, ensure the following:
- [ ] Unique `sku` identifier.
- [ ] Valid JSON format.
- [ ] Correct `type`, `material`, `color`, and `shape`.
- [ ] Valid `model_path` (must point to a `.glb` file).
- [ ] Valid `texture_path` (must point to a `.png` or `.jpg` file).

### Fit Metadata Explained

When adding a new SKU, you must define the `fit` dictionary to ensure accurate sizing:
* `width_mm`: The total width of the frame front in millimeters.
* `bridge_mm`: The distance between the lenses (bridge width) in millimeters.
* `temple_mm`: The length of the temple arms from the hinge to the tip in millimeters.
