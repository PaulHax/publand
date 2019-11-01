# aframe-typescript-hot-loader

Modifed example from https://github.com/supermedium/aframe-super-hot-loader.  Thanks Kevin Ngo!

- Bundle Typescript and Javascript A-Frame components with Webpack
- Develop components, shaders and html without refreshing thanks to Hot Module Replacment.
- ESLint and Prettier.
- Deploy to Github pages.

Also stole: https://github.com/olioapps/aframe-typescript-toolkit

## Getting Started
```
yarn install
yarn start
```
Point browser to localhost:3000

## Testing Components
Often you want to develop components independently from the main app.  One way:

Make a directory under the test directory and put a app.ts and index.html in it.  Say the directory is test/color-comp.

To run the Webpack dev server there:
```
yarn start --td color-comp
```
The --td argument sets the Webpack entry point and contentBase (aka static assests root) to that directory.

## Deploy to Github Pages
Setup the remote repo, then yarn deploy
```
git remote add origin [your repo URL here]
yarn deploy
```

------------


Kind of a heavy toolbelt, don't fall in deep water.

Helpful links (IMHO):
- https://github.com/DefinitelyTyped/DefinitelyTyped/blob/fde8e78611fd8f21f80425ed2e3ad160f8afb927/types/aframe/test/aframe-tests.ts
- https://dev.to/robertcoopercode/using-eslint-and-prettier-in-a-typescript-project-53jb
- https://github.com/babel/babel-eslint/issues/663
- https://github.com/olioapps/aframe-typescript-toolkit
