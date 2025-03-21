import express from 'express';
const assets = express.static('built');
const configureServer = (server: any) => {
    server.middlewares.use(assets);
};
export const static_serve = () => ({
    name: 'static-serve',
    configureServer,
    configurePreviewServer: configureServer
});