import { useEffect, useState } from 'react';

import { ConverterPage } from '../features/converter/ConverterPage';
import { GamePage } from '../features/game/GamePage';

function currentRoute() {
  if (typeof window === 'undefined') {
    return 'game';
  }

  return window.location.hash === '#translator' ? 'translator' : 'game';
}

export function App() {
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    function handleHashChange() {
      setRoute(currentRoute());
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route === 'translator' ? <ConverterPage /> : <GamePage />;
}
