# Installing

## Clone repos

Checkout `signify-ts` and `signify-tester`

```
cd ~/
git clone https://github.com/psteniusubi/signify-tester.git
git clone https://github.com/psteniusubi/signify-ts.git 
```

Create symlink ~/signify-tester/signify-ts -> ~/signify-ts

```
ln -sf ../signify-ts ~/signify-tester/
```

# Launching signify-tester

```
cd ~/signify-tester
npm install
npm run dev
```

Navigate to http://localhost:5173/ with your browser

# Publish to github

```
git switch github-pages
git merge master
npm run publish-github
git add -A
git commit -m publish
git push
git switch master
```

Navigate to https://psteniusubi.github.io/signify-tester/ with your browser

## Compare to master

```
git diff master github-pages  -- . ':!docs'
```

# Unit tests

## Run all tests

```
npx jest
```

## Prepare

```
npx jest ./tests/prepare.test.ts
```

## Individual tests

```
npx jest ./tests/api.test.ts
npx jest ./tests/delegate.test.ts
npx jest ./tests/multisig.test.ts
```

## Single test

```
npx jest ./tests/multisig.test.ts -t client3
npx jest ./tests/multisig.test.ts -t status
```
