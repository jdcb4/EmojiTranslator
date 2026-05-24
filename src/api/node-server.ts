import { serve } from '@hono/node-server';

import { apiApp } from './app';

const port = Number(process.env.PORT ?? '8787');

serve(
  {
    fetch: (request) => apiApp.fetch(request, process.env),
    port,
  },
  (info) => {
    console.log(
      `EmojiTranslator API listening on http://localhost:${info.port}`,
    );
  },
);
