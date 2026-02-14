# Contributing to Better Waitlist

First off, thank you for considering contributing! We welcome contributions from the community.

## Ways to Contribute

- **Report bugs** - Open an issue with a clear description
- **Suggest features** - Open an issue with your idea
- **Improve documentation** - Submit a PR to fix typos or add examples
- **Submit code** - Fix bugs or implement new features

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/haxurn/better-waitlist.git
cd better-waitlist
```

2. Install dependencies:
```bash
pnpm install
```

3. Run tests:
```bash
pnpm test
```

4. Build:
```bash
pnpm build
```

5. Run linter:
```bash
pnpm lint
```

## Code Style

- We use [oxlint](https://oxlint.rs/) for linting
- We use [Biome](https://biomejs.dev/) for formatting
- Follow existing code patterns in the project

## Submitting a Pull Request

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and linting
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

## Commit Messages

Use clear, descriptive commit messages:
- `fix: resolve join waitlist validation error`
- `feat: add promote endpoint for sending invites`
- `docs: update README with new API methods`

## Issue Reporting

When reporting bugs, include:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment details
