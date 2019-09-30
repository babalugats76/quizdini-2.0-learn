# Quizdini Learn

# Todo List

- Client
  - Switch dangerousInnerHtml render to new method; remove conditional html check
  - Helmet - dynamic title integration
  - Implement react router switch including "Not Found"
    - Figure out where to put redirect logic, etc.
  - MatchGame
    - Add modern game logo
  - Match
    - Cleanup CSS
  - Splash
    - Create component that uses Modal UI component
    - Create Splash component that uses `Modal` dialog component
  - Modal
    - Refine `Modal` component
      - style

- Kay Items
  - Colors
  - Fonts
    - Term / Definition / Monospace (When code)

## Summary

Quizdini's architecture combines a server (Express) and client (React)

# Getting Started

## Create directory structure

- `mkdir Quizdini-2.0`
- `cd Quizdini-2.0`
- `mkdir learn`
- `cd learn`

## Create master project

- `npm init`

## Install key modules needed to establish base project

- `npm install --save express`
- `npm install -g nodemon`
- `npm install -g create-react-app`
- `npm install --save concurrently`

## Create subdirectory for server code

- `mkdir server`

## Create basic index.js in `server` directory (to test configuration)

```
const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.send('Hello World!');
});
const PORT = process.env.PORT || 5001;
app.listen(PORT);
```

## Modify master project package.json with server-specific scripts:

```
"scripts": {
  "start": "node server",
  "server": "nodemon server"
}
```

## Test express server

- `npm start`
- Open browser and go to `localhost:5001/` (You should see Hello World!)

## Create React app (from project root), placing in `client` directory

- `create-react-app client`

## Update client `package.json` to include non-default port:

```
  "scripts": {
    ...
    "start": "set PORT=3001 && react-scripts start"
    ...
  }
```

## Remove .git from CRA

Using File explorer, remove `.git` directory from `client`

## Modify master project package.json with client-specific scripts:

```
"scripts": {
  ...
  "client": "npm run start --prefix client"
}
```

## Test Client

- `rpm run client` (from root project directory)
- `localhost:3001` should work

## Add consolidated (dev) startup script (to master project package.json)

```
"scripts": {
  ...
  "dev": "concurrently \"npm run server\" \"npm run client\""
}
```

## Test consolidated script

- `npm run dev`
- Verify that server and client start

## Initialize GitHub respository (from master server directory)

- `git init`
- Do to # of uncommitted changes, you will be prompted to create `.gitignore`
- Add appropriate values to `.gitignore`, e.g., `dev.js`
- `echo "# quizdini-2.0-learn" >> README.md`
- `git add README.md`
- `git add .`
- `git status` (to double-check what has been staged)
- `git commit -m "first commit"`
- `git remote add origin https://github.com/babalugats76/quizdini-2.0-learn.git`
- `git push -u origin master`
- Check GitHub repo for propagation of code, etc.

## Heroku Setup

- Add to `package.json` `engines` JavaScript object:

```
"engines": {
    "node": "10.14.1",
    "npm": "6.4.1"
  }
```

- Login to Heroku: `heroku login`
- Create Heroku app: `heroku create` (annotate URLs)
  - [Heroku URL](https://secure-thicket-28240.herokuapp.com/)
  - [Heroku Remote Git Repo](https://git.heroku.com/secure-thicket-28240.git)
- Push code to Heroku repo: `git push heroku master`
- Subsequent deployments
  - Check in code, e.g., `commit` and push `git push heroku master`

## Bring legacy code and configuration forward

Now that a basic project is in place, bring forward previous code for both the client and the server. Update node modules as required, etc.
