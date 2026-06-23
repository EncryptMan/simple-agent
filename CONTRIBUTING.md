# Contributing

Thanks for helping improve this project.

## Before you open a pull request

1. Make your changes in a focused branch.
2. Run the relevant checks for the area you touched.
3. Update documentation or tests when behavior changes.
4. Keep changes small and easy to review.

## Local checks

For the Python agent:

```bash
cd agent
uv run pytest
```

For the web frontend:

```bash
cd web
pnpm lint
pnpm build
```

## Pull requests

Please include a short summary of the change, any relevant screenshots for UI updates, and the commands you ran to validate the work.