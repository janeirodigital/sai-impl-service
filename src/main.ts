import 'dotenv/config';

import express, { Request, Response } from 'express';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

import sessionGuard from './session.js';
import authRouter from './auth.js';
import usersRouter from './users';
import apiRouter from './api';
import {RedisStorage} from "./redis-storage";

const server = express();

server.use(cors());

server.use(cookieSession({
    name: 'session',
    // TODO (angel) ensure all required env parameters are set before starting the application
    // @ts-ignore
    keys: [process.env.COOKIE_KEY_1, process.env.COOKIE_KEY_2],
}));

server.use(cookieParser());
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({extended: true}))
server.use(morgan(process.env.NODE_ENV === 'production' ? 'common': 'dev'));

server.use('/auth', authRouter)
server.use(sessionGuard);
server.use('/users', usersRouter);
server.use('/api', apiRouter);

server.all('*', (req: Request, res: Response) => {
    res.status(404).send();
})

// Init the storage;
const storage = RedisStorage.instance;
storage.set('LAST STARTUP', new Date().toISOString());

server.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`);
});
