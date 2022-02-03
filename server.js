
import express from 'express';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
import {getSessionFromStorage, Session} from '@inrupt/solid-client-authn-node';
import cors from 'cors';
import morgan from 'morgan';

const server = express();

server.use(cors());

server.use(cookieSession({
    name: 'session',
    keys: ['first key', 'second key'],
}));

server.use(cookieParser());
server.use((req, res, next) => {
   console.log(`[session] Cookie Session: ${req.cookies['session']}`);
    req.sessionId = JSON.parse(atob(req.cookies['session']))['sessionId'];
    next();
});

server.use(morgan('dev'));

const sessionMap = new Set();

server.get('/api/login', async (req, res) => {
    const session = new Session();
    req.session['sessionId'] = session.info.sessionId;

    sessionMap.add(session.info.sessionId);

    const redirectToIdp = (url) => {
        res.redirect(url);
    }

    await session.login({
        redirectUrl: 'http://localhost:4200/api/handleLoginRedirect',
        oidcIssuer: 'http://localhost:3000',
        clientName: 'Test Solid Auth Agent Server',
        handleRedirect: redirectToIdp,
    });
});


server.get('/api/handleLoginRedirect', async (req, res) => {
    const session = await getSessionFromStorage(req.session['sessionId']);

    if (session) {
        await session.handleIncomingRedirect('http://localhost:4200' + req.url);

        const sessionCookie = req.cookies['session'];
        if (session.info.isLoggedIn) {
            res.cookie('session', sessionCookie, { httpOnly: true }); // 24 hours
            res.redirect('http://localhost:4200/?login=true');
        } else {
            res.redirect ('http://localhost:4200/?login=false');
        }
    }
})

server.post('/api/id', async (req, res) => {
    try {
        console.log(`[id] sessionId: ${req.sessionId}`)
        const session = await getSessionFromStorage(req.sessionId);
        if (session || session.info.isLoggedIn) {
            res.json({webId: session.info.webId});
        }
    } catch (e) {
        res.status(401).send();
    }
})

server.get('/api/sessions', (req, res) => {
    res.json(JSON.stringify(Array.from(sessionMap)));
})

server.all('*', (req, res) => {
    res.status(404).send();
})

server.listen(4000, () => {
    console.log('server listening on port 4000');
});
