# Contributing to kintone-as-code

First off, thank you for considering contributing to kintone-as-code! It's people like you that make kintone-as-code such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include your environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the TypeScript styleguide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Process

1. Fork the repo and create your branch from `main`
2. Install dependencies:
   ```bash
   npm install
   ```

3. Make your changes and ensure tests pass:
   ```bash
   npm run test:all
   npm run lint
   npm run typecheck
   ```

4. If you've added code that should be tested, add tests
5. If you've changed APIs, update the documentation
6. Ensure the test suite passes
7. Make sure your code lints
8. Issue that pull request!

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### TypeScript Styleguide

* Use TypeScript for all new code
* Prefer `const` over `let`
* Use meaningful variable names
* Add type annotations where TypeScript cannot infer
* Use functional programming patterns where appropriate
* Follow the existing code style

### Testing

* Write tests for all new functionality
* Ensure all tests pass before submitting PR
* Use descriptive test names
* Test both success and error cases

## Project Structure

```
kintone-as-code/
├── src/
│   ├── commands/     # CLI command implementations
│   ├── core/         # Core functionality
│   ├── test/         # Test utilities
│   └── cli.ts        # CLI entry point
├── examples/         # Example schemas and configurations
└── dist/            # Built files
```

## Additional Notes

### Issue and Pull Request Labels

* `bug` - Something isn't working
* `enhancement` - New feature or request
* `documentation` - Improvements or additions to documentation
* `good first issue` - Good for newcomers
* `help wanted` - Extra attention is needed

Thank you for contributing! 🎉