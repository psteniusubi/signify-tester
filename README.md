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

