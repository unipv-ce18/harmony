import {precacheAndRoute} from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

console.log('Sneaky sneaky service worker doing its job :P')
