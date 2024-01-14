import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { MessageBroker } from './lib/MessageBroker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: MessageBroker, useClass: MessageBroker }
  ],
};
