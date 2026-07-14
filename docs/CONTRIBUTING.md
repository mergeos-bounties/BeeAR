# BeeAR

WebXR AR library for building augmented reality experiences on the web.

## Installation

### Install from GitHub tarball

Until npm 2FA token is ready, install directly from GitHub:

```bash
npm install https://github.com/mergeos-bounties/BeeAR/archive/refs/heads/main.tar.gz
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "beear": "https://github.com/mergeos-bounties/BeeAR/archive/refs/heads/main.tar.gz"
  }
}
```

### Install specific version

To install a specific release version:

```bash
npm install https://github.com/mergeos-bounties/BeeAR/archive/refs/tags/v1.0.0.tar.gz
```

### Install specific commit

To install from a specific commit:

```bash
npm install https://github.com/mergeos-bounties/BeeAR/archive/<commit-hash>.tar.gz
```

## Usage

```javascript
import BeeAR from 'beear';

// Initialize BeeAR
const ar = new BeeAR({
  container: document.getElementById('ar-container')
});

// Start AR session
await ar.start();
```

## Features

- WebXR-based augmented reality
- Cross-platform compatibility
- Easy integration
- Lightweight and performant

## Requirements

- Modern browser with WebXR support
- HTTPS connection (required for WebXR)
- Device with AR capabilities

## Browser Support

- Chrome/Edge (Android)
- Safari (iOS 15+)

## Development

```bash
# Clone repository
git clone https://github.com/mergeos-bounties/BeeAR.git
cd BeeAR

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please use the GitHub issue tracker.