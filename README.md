# React + Vite

## Automatic Firebase Hosting deployment

Pushing a commit to `main` runs the Firebase Hosting workflow. It installs
dependencies, builds the app, and deploys the `dist` output to the live Hosting
site. Pull requests and commits on other branches do not deploy.

Before the first deployment, add a GitHub Actions repository secret named
`FIREBASE_SERVICE_ACCOUNT_FARM_FLOW_REACT_APP` containing the JSON key for a
Google Cloud service account that has permission to deploy Firebase Hosting to
the `farm-flow-react-app` project. Add it under **Settings → Secrets and
variables → Actions → New repository secret**. Do not commit the service
account key to the repository.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
