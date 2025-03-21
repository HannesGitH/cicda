import express from 'express';
import { servable_files_dir } from '../config';
const static_middleware = express.static(servable_files_dir);
const configureServer = (server: any) => {
    server.middlewares.use(static_middleware);
};
export const static_serve = () => ({
    name: 'static-serve',
    configureServer,
    configurePreviewServer: configureServer
});