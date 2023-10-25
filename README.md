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

```
npx jest
```

```
npx jest ./tests/signify.test.ts
```

```
npx jest ./tests/signify.test.ts -t client1
npx jest ./tests/signify.test.ts -t "name1|name2|oobi1|oobi2"
```
