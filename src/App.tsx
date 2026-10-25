import { useRoute } from './lib/router';
import { Dashboard } from './pages/Dashboard';
import { Recovery } from './pages/Recovery';
import { Setup } from './pages/Setup';
import { Unlock } from './pages/Unlock';

export function App() {
  switch (useRoute()) {
    case '/setup':
      return <Setup />;
    case '/unlock':
      return <Unlock />;
    case '/recovery':
      return <Recovery />;
    default:
      return <Dashboard />;
  }
}
