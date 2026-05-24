import { apiApp } from './app';

export default {
  fetch: apiApp.fetch,
} satisfies ExportedHandler;
